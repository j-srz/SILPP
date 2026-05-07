const pool = require('../config/db');
const { AppError } = require('../middlewares/errorHandler');

// ════════════════════════════════════════════════════════════════════════
// GET /api/productos/search — Búsqueda de Productos
// ════════════════════════════════════════════════════════════════════════

async function buscarProductos(req, res, next) {
  try {
    const { q } = req.query;
    
    if (!q || q.trim() === '') {
      return res.json({ success: true, data: [] });
    }

    const term = `%${q.trim()}%`;

    const [rows] = await pool.execute(
      `SELECT 
         p.sku_id, p.nombre, p.marca, p.descripcion, p.url_img, p.es_perecedero,
         cb.codigo_ean
       FROM Producto p
       LEFT JOIN CodigoBarras cb ON p.sku_id = cb.sku_id
       WHERE 
         p.sku_id LIKE ? OR 
         p.nombre LIKE ? OR 
         p.marca LIKE ? OR 
         cb.codigo_ean LIKE ?
       LIMIT 10`,
      [term, term, term, term]
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

// ════════════════════════════════════════════════════════════════════════
// GET /api/productos/catalog — Catálogo Unificado con Agregación SQL
// ════════════════════════════════════════════════════════════════════════
//
// Devuelve productos con stock_global, total_lotes y estado_critico
// calculados en una sola query. Soporta búsqueda y paginación.
//
// Query params: q (búsqueda), page, limit

async function catalogoProductos(req, res, next) {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    // Base WHERE clause for search
    let whereClause = '';
    const params = [];
    if (q && q.trim()) {
      const term = `%${q.trim()}%`;
      whereClause = `WHERE (p.sku_id LIKE ? OR p.nombre LIKE ? OR p.marca LIKE ? OR cb_search.codigo_ean LIKE ?)`;
      params.push(term, term, term, term);
    }

    // Count total for pagination
    const [countRows] = await pool.execute(
      `SELECT COUNT(DISTINCT p.sku_id) AS total
       FROM Producto p
       LEFT JOIN CodigoBarras cb_search ON p.sku_id = cb_search.sku_id
       ${whereClause}`,
      params
    );
    const total = countRows[0].total;

    // Main aggregated query
    const [rows] = await pool.execute(
      `SELECT
         p.sku_id, p.nombre, p.descripcion, p.marca, p.categoria,
         p.url_img, p.es_perecedero,
         -- Agregación: stock global del producto (sum de todos los lotes activos)
         COALESCE(agg.stock_global, 0)   AS stock_global,
         -- Agregación: total de lotes activos con stock > 0
         COALESCE(agg.total_lotes, 0)    AS total_lotes,
         -- Agregación: días mínimos para caducar (lote más crítico)
         agg.dias_critico
       FROM Producto p
       LEFT JOIN CodigoBarras cb_search ON p.sku_id = cb_search.sku_id
       LEFT JOIN (
         SELECT
           l.sku_id,
           SUM(lot_stock.stock_actual)   AS stock_global,
           COUNT(*)                       AS total_lotes,
           MIN(DATEDIFF(l.fecha_caducidad, CURDATE())) AS dias_critico
         FROM Lote l
         JOIN (
           SELECT
             hm.id_lote,
             COALESCE(SUM(hm.qty_afectada * tm.factor), 0) AS stock_actual
           FROM Historial_Movimiento hm
           JOIN TipoMovimiento tm ON hm.id_tipo = tm.id_tipo
           GROUP BY hm.id_lote
           HAVING stock_actual > 0
         ) lot_stock ON l.id_lote = lot_stock.id_lote
         WHERE l.status IN ('Disponible', 'Cuarentena')
         GROUP BY l.sku_id
       ) agg ON p.sku_id = agg.sku_id
       ${whereClause}
       GROUP BY p.sku_id
       ORDER BY p.nombre ASC
       LIMIT ? OFFSET ?`,
      [...params, String(limitNum), String(offset)]
    );

    // Fetch all barcodes for returned products in one batch
    const skuIds = rows.map(r => r.sku_id);
    let barcodeMap = {};
    if (skuIds.length > 0) {
      const placeholders = skuIds.map(() => '?').join(',');
      const [cbRows] = await pool.execute(
        `SELECT codigo_ean, sku_id FROM CodigoBarras WHERE sku_id IN (${placeholders})`,
        skuIds
      );
      for (const cb of cbRows) {
        if (!barcodeMap[cb.sku_id]) barcodeMap[cb.sku_id] = [];
        barcodeMap[cb.sku_id].push(cb.codigo_ean);
      }
    }

    const data = rows.map(r => ({
      sku_id: r.sku_id,
      nombre: r.nombre,
      descripcion: r.descripcion,
      marca: r.marca,
      categoria: r.categoria,
      url_img: r.url_img,
      es_perecedero: Boolean(r.es_perecedero),
      codigos_barras: barcodeMap[r.sku_id] || [],
      stock_global: Number(r.stock_global),
      total_lotes: Number(r.total_lotes),
      dias_critico: r.dias_critico != null ? Number(r.dias_critico) : null,
    }));

    res.json({
      success: true,
      data,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    next(err);
  }
}

// ════════════════════════════════════════════════════════════════════════
// GET /api/productos/:sku — Expediente de Producto
// ════════════════════════════════════════════════════════════════════════

async function detalleProducto(req, res, next) {
  try {
    const { sku } = req.params;

    // 1. Datos del producto
    const [prodRows] = await pool.execute(
      `SELECT p.sku_id, p.nombre, p.descripcion, p.marca, p.categoria,
              p.url_img, p.es_perecedero
       FROM Producto p
       WHERE p.sku_id = ?`,
      [sku]
    );

    if (prodRows.length === 0) {
      throw new AppError(`Producto "${sku}" no encontrado.`, 404);
    }

    const producto = prodRows[0];

    // 2. Todos los códigos de barras del producto (multi-barcode)
    const [cbRows] = await pool.execute(
      'SELECT codigo_ean FROM CodigoBarras WHERE sku_id = ?',
      [sku]
    );

    // 3. Todos los lotes activos con stock dinámico 
    const [lotesRows] = await pool.execute(
      `SELECT
         l.id_lote, l.fecha_fabricacion, l.fecha_caducidad, l.status,
         DATEDIFF(l.fecha_caducidad, CURDATE()) AS dias_para_caducar,
         COALESCE((
           SELECT SUM(hm.qty_afectada * tm.factor)
           FROM Historial_Movimiento hm
           JOIN TipoMovimiento tm ON hm.id_tipo = tm.id_tipo
           WHERE hm.id_lote = l.id_lote
         ), 0) AS stock_actual
       FROM Lote l
       WHERE l.sku_id = ?
         AND l.status IN ('Disponible', 'Cuarentena')
       ORDER BY l.fecha_caducidad ASC`,
      [sku]
    );

    const lotes = lotesRows.map((r) => ({
      id_lote: r.id_lote,
      fecha_fabricacion: r.fecha_fabricacion,
      fecha_caducidad: r.fecha_caducidad,
      status: r.status,
      dias_para_caducar: r.dias_para_caducar,
      stock_actual: Number(r.stock_actual),
    }));

    res.json({
      success: true,
      data: {
        producto: {
          ...producto,
          es_perecedero: Boolean(producto.es_perecedero),
          codigos_barras: cbRows.map(cb => cb.codigo_ean),
          // Retrocompatibilidad: mantener codigo_ean como primer código
          codigo_ean: cbRows.length > 0 ? cbRows[0].codigo_ean : null,
        },
        lotes,
        total_lotes: lotes.length,
        stock_global: lotes.reduce((sum, l) => sum + l.stock_actual, 0),
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { buscarProductos, catalogoProductos, detalleProducto };

