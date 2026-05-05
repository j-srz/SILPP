// ─── Controlador de Escaneo Híbrido ────────────────────────────────────
// GET /api/scan?code=<valor>
//
// Lógica de detección automática:
//   1. ¿Empieza con "LOT-"? → Buscar en Lote por id_lote exacto
//   2. ¿Es un código EAN?   → Buscar en CodigoBarras → Lotes del producto
//   3. ¿Es un SKU?          → Buscar en Producto → Lotes del producto
//   4. Sin coincidencia      → tipo: "no_encontrado"
//
// NOTA CRÍTICA (Linux): Todas las tablas en PascalCase
//   Lote, Producto, CodigoBarras, Historial_Movimiento, TipoMovimiento, etc.
// ────────────────────────────────────────────────────────────────────────

const pool = require('../config/db');
const { AppError } = require('../middlewares/errorHandler');
const stockService = require('../services/stock.service');

async function escanear(req, res, next) {
  try {
    const { code } = req.query;

    if (!code || code.trim() === '') {
      throw new AppError('El parámetro "code" es requerido.', 400);
    }

    const input = code.trim();

    // ════════════════════════════════════════════════════════════════════
    // CASO 1: El input es un ID de Lote (prefijo LOT-)
    // ════════════════════════════════════════════════════════════════════
    if (input.toUpperCase().startsWith('LOT-')) {
      // Buscar lote por id_lote exacto
      const [loteRows] = await pool.execute(
        `SELECT
           l.id_lote, l.sku_id, l.fecha_fabricacion, l.fecha_caducidad, l.status,
           DATEDIFF(l.fecha_caducidad, CURDATE()) AS dias_para_caducar,
           p.nombre, p.descripcion, p.marca, p.categoria, p.url_img, p.es_perecedero,
           cb.codigo_ean
         FROM Lote l
         JOIN Producto p ON l.sku_id = p.sku_id
         LEFT JOIN CodigoBarras cb ON p.sku_id = cb.sku_id
         WHERE l.id_lote = ?`,
        [input]
      );

      if (loteRows.length === 0) {
        return res.json({
          success: true,
          tipo: 'no_encontrado',
          message: `No se encontró ningún lote con ID "${input}".`,
          data: null,
        });
      }

      const lote = loteRows[0];

      // Stock total dinámico (reutiliza stockService)
      const stockTotal = await stockService.getStockByLote(input);

      // Ubicaciones desglosadas por área
      const [ubicRows] = await pool.execute(
        `SELECT
           eu.id_ubicacion,
           a.nombre_area,
           u.pasillo, u.rack, u.nivel
         FROM Existencia_Ubicacion eu
         JOIN Ubicacion u ON eu.id_ubicacion = u.id_ubicacion
         JOIN Area a ON u.id_area = a.id_area
         WHERE eu.id_lote = ?`,
        [input]
      );

      const ubicaciones = {};
      for (const ub of ubicRows) {
        const stockUb = await stockService.getStockByLoteAndUbicacion(input, ub.id_ubicacion);
        const area = ub.nombre_area;
        if (!ubicaciones[area]) {
          ubicaciones[area] = { total_unidades: 0, posiciones: [] };
        }
        ubicaciones[area].total_unidades += stockUb;
        ubicaciones[area].posiciones.push({
          id_ubicacion: ub.id_ubicacion,
          pasillo: ub.pasillo,
          rack: ub.rack,
          nivel: ub.nivel,
          stock: stockUb,
        });
      }

      // Fecha de ingreso
      const [ingresoRows] = await pool.execute(
        `SELECT MIN(hm.fecha_hora) AS fecha_ingreso
         FROM Historial_Movimiento hm
         WHERE hm.id_lote = ?`,
        [input]
      );

      return res.json({
        success: true,
        tipo: 'lote',
        data: {
          id_lote: lote.id_lote,
          status: lote.status,
          fecha_fabricacion: lote.fecha_fabricacion,
          fecha_caducidad: lote.fecha_caducidad,
          fecha_ingreso: ingresoRows[0]?.fecha_ingreso || null,
          dias_para_caducar: lote.dias_para_caducar,
          stock_total: stockTotal,
          producto: {
            sku_id: lote.sku_id,
            nombre: lote.nombre,
            descripcion: lote.descripcion,
            marca: lote.marca,
            categoria: lote.categoria,
            url_img: lote.url_img,
            es_perecedero: Boolean(lote.es_perecedero),
            codigo_ean: lote.codigo_ean || null,
          },
          ubicaciones,
        },
      });
    }

    // ════════════════════════════════════════════════════════════════════
    // CASO 2+3: El input es un código EAN o un SKU (búsqueda unificada)
    // ════════════════════════════════════════════════════════════════════
    // Una sola query con LEFT JOIN para detectar EAN y SKU en un round-trip.
    const [unifiedRows] = await pool.execute(
      `SELECT p.sku_id, cb.codigo_ean
       FROM Producto p
       LEFT JOIN CodigoBarras cb ON p.sku_id = cb.sku_id
       WHERE p.sku_id = ? OR cb.codigo_ean = ?
       LIMIT 1`,
      [input, input]
    );

    if (unifiedRows.length > 0) {
      return await _responderConProductoYLotes(
        res,
        unifiedRows[0].sku_id,
        unifiedRows[0].codigo_ean || null
      );
    }

    // ════════════════════════════════════════════════════════════════════
    // CASO 4: No se encontró nada
    // ════════════════════════════════════════════════════════════════════
    return res.json({
      success: true,
      tipo: 'no_encontrado',
      message: `No se encontró ningún lote, producto o código de barras para "${input}".`,
      data: null,
    });
  } catch (err) {
    next(err);
  }
}

// ────────────────────────────────────────────────────────────────────────
// Helper: Responder con datos del producto + lista de lotes activos
// ────────────────────────────────────────────────────────────────────────

async function _responderConProductoYLotes(res, skuId, codigoEan) {
  // Datos del producto
  const [prodRows] = await pool.execute(
    `SELECT
       p.sku_id, p.nombre, p.descripcion, p.marca, p.categoria,
       p.url_img, p.es_perecedero
     FROM Producto p
     WHERE p.sku_id = ?`,
    [skuId]
  );

  if (prodRows.length === 0) {
    return res.json({
      success: true,
      tipo: 'no_encontrado',
      message: 'Producto asociado no encontrado.',
      data: null,
    });
  }

  const producto = prodRows[0];

  // Si no nos pasaron el EAN, intentar obtenerlo
  if (!codigoEan) {
    const [cbRows] = await pool.execute(
      'SELECT codigo_ean FROM CodigoBarras WHERE sku_id = ?',
      [skuId]
    );
    codigoEan = cbRows.length > 0 ? cbRows[0].codigo_ean : null;
  }

  // Todos los lotes activos del producto con stock dinámico (FEFO)
  const [lotesRows] = await pool.execute(
    `SELECT
       l.id_lote,
       l.fecha_fabricacion,
       l.fecha_caducidad,
       l.status,
       DATEDIFF(l.fecha_caducidad, CURDATE()) AS dias_para_caducar,
       COALESCE((
         SELECT SUM(hm2.qty_afectada * tm2.factor)
         FROM Historial_Movimiento hm2
         JOIN TipoMovimiento tm2 ON hm2.id_tipo = tm2.id_tipo
         WHERE hm2.id_lote = l.id_lote
       ), 0) AS stock_actual
     FROM Lote l
     WHERE l.sku_id = ?
       AND l.status IN ('Disponible', 'Cuarentena')
     ORDER BY l.fecha_caducidad ASC`,
    [skuId]
  );

  const lotes = lotesRows.map((r) => ({
    id_lote: r.id_lote,
    fecha_fabricacion: r.fecha_fabricacion,
    fecha_caducidad: r.fecha_caducidad,
    status: r.status,
    dias_para_caducar: r.dias_para_caducar,
    stock_actual: Number(r.stock_actual),
  }));

  return res.json({
    success: true,
    tipo: 'producto',
    data: {
      producto: {
        sku_id: producto.sku_id,
        nombre: producto.nombre,
        descripcion: producto.descripcion,
        marca: producto.marca,
        categoria: producto.categoria,
        url_img: producto.url_img,
        es_perecedero: Boolean(producto.es_perecedero),
        codigo_ean: codigoEan,
      },
      lotes,
      total_lotes: lotes.length,
      stock_global: lotes.reduce((sum, l) => sum + l.stock_actual, 0),
    },
  });
}

// ════════════════════════════════════════════════════════════════════════
// GET /api/scan/suggest?q= — Sugerencias en tiempo real (autocomplete)
// ════════════════════════════════════════════════════════════════════════
//
// Devuelve hasta 5 sugerencias combinadas de Lotes y Productos.
// Cada sugerencia incluye: tipo, valor (para enviar al /scan), y label
// legible (Nombre del Producto + ID Lote) para el dropdown.

async function sugerencias(req, res, next) {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json({ success: true, data: [] });
    }

    const term = `%${q.trim()}%`;
    const results = [];

    // ── 1. Buscar Lotes que coincidan (id_lote, sku_id) ──────────────
    const [loteRows] = await pool.execute(
      `SELECT l.id_lote, l.status, p.nombre AS producto_nombre, p.marca
       FROM Lote l
       JOIN Producto p ON l.sku_id = p.sku_id
       WHERE l.id_lote LIKE ? OR l.sku_id LIKE ?
       ORDER BY l.fecha_caducidad ASC
       LIMIT 3`,
      [term, term]
    );

    for (const r of loteRows) {
      results.push({
        tipo: 'lote',
        valor: r.id_lote,
        label: r.id_lote,
        sublabel: `${r.producto_nombre} · ${r.marca}`,
        status: r.status,
      });
    }

    // ── 2. Buscar Productos que coincidan (nombre, marca, SKU, EAN) ──
    const [prodRows] = await pool.execute(
      `SELECT DISTINCT p.sku_id, p.nombre, p.marca, cb.codigo_ean
       FROM Producto p
       LEFT JOIN CodigoBarras cb ON p.sku_id = cb.sku_id
       WHERE p.sku_id LIKE ? OR p.nombre LIKE ? OR p.marca LIKE ? OR cb.codigo_ean LIKE ?
       LIMIT 3`,
      [term, term, term, term]
    );

    for (const r of prodRows) {
      results.push({
        tipo: 'producto',
        valor: r.codigo_ean || r.sku_id,
        label: r.nombre,
        sublabel: `${r.marca} · SKU: ${r.sku_id}${r.codigo_ean ? ` · EAN: ${r.codigo_ean}` : ''}`,
        status: null,
      });
    }

    // Limitar a 5 resultados totales
    return res.json({ success: true, data: results.slice(0, 5) });
  } catch (err) {
    next(err);
  }
}

module.exports = { escanear, sugerencias };
