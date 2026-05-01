// ─── Controlador de Lotes ───────────────────────────────────────────────
// POST /api/lotes       → crearLote
// GET  /api/lotes/search → megaBusqueda
// ────────────────────────────────────────────────────────────────────────

const pool = require('../config/db');
const { AppError } = require('../middlewares/errorHandler');
const stockService = require('../services/stock.service');

// ════════════════════════════════════════════════════════════════════════
// A. POST /api/lotes — Registro de un nuevo lote
// ════════════════════════════════════════════════════════════════════════

async function crearLote(req, res, next) {
  let conn;
  try {
    const { sku_id, fecha_fabricacion, fecha_caducidad, status, cantidad, id_usuario } = req.body;

    // ── 1. Campos requeridos ────────────────────────────────────────
    if (!sku_id || !fecha_fabricacion || !fecha_caducidad || !status || cantidad === undefined || !id_usuario) {
      throw new AppError(
        'Faltan campos requeridos: sku_id, fecha_fabricacion, fecha_caducidad, status, cantidad, id_usuario.',
        400
      );
    }

    if (Number(cantidad) <= 0) {
      throw new AppError('La cantidad debe ser mayor a 0.', 400);
    }

    // ── 2. Validar status ───────────────────────────────────────────
    const statusValidos = ['Disponible', 'Cuarentena', 'Vencido'];
    if (!statusValidos.includes(status)) {
      throw new AppError(
        `Status inválido. Valores permitidos: ${statusValidos.join(', ')}.`,
        400
      );
    }

    // ── 3. Verificar que el SKU exista ──────────────────────────────
    const [productoRows] = await pool.execute(
      'SELECT sku_id, es_perecedero FROM Producto WHERE sku_id = ?',
      [sku_id]
    );
    if (productoRows.length === 0) {
      throw new AppError('SKU no encontrado en el catálogo de productos.', 400);
    }
    const producto = productoRows[0];

    // ── 4. Validar coherencia de fechas ─────────────────────────────
    const fechaFab = new Date(fecha_fabricacion);
    const fechaCad = new Date(fecha_caducidad);

    if (isNaN(fechaFab.getTime()) || isNaN(fechaCad.getTime())) {
      throw new AppError('Formato de fecha inválido. Usa YYYY-MM-DD.', 400);
    }
    if (fechaCad <= fechaFab) {
      throw new AppError(
        'La fecha de caducidad debe ser estrictamente posterior a la fecha de fabricación.',
        400
      );
    }

    // ── 5. Generar id_lote automático y único ───────────────────────
    let id_lote = '';
    let isUnique = false;
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
    
    while (!isUnique) {
      const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
      id_lote = `LOT-${dateStr}-${randomStr}`;
      const [existente] = await pool.execute('SELECT id_lote FROM Lote WHERE id_lote = ?', [id_lote]);
      if (existente.length === 0) {
        isUnique = true;
      }
    }

    // ── 6. Iniciar Transacción ──────────────────────────────────────
    conn = await pool.getConnection();
    await conn.beginTransaction();

    // a) Insertar en Lote
    await conn.execute(
      `INSERT INTO Lote (id_lote, sku_id, fecha_fabricacion, fecha_caducidad, status)
       VALUES (?, ?, ?, ?, ?)`,
      [id_lote, sku_id, fecha_fabricacion, fecha_caducidad, status]
    );

    // b) Insertar en Entrada (Generar folio REC-YYYYMMDD-IDLOTE)
    const folio = `REC-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${id_lote}`;
    await conn.execute(
      `INSERT INTO Entrada (folio, fecha_llegada, id_usuario, id_lote)
       VALUES (?, NOW(), ?, ?)`,
      [folio, id_usuario, id_lote]
    );

    // c) Insertar en Existencia_Ubicacion (id_ubicacion = 501: Recepcion)
    await conn.execute(
      `INSERT INTO Existencia_Ubicacion (id_lote, id_ubicacion, cantidad)
       VALUES (?, 501, ?)`,
      [id_lote, cantidad]
    );

    // d) Insertar en Historial_Movimiento (id_tipo = 1: Entrada por Recepcion)
    await conn.execute(
      `INSERT INTO Historial_Movimiento (id_lote, id_ubicacion, id_usuario, id_tipo, qty_afectada, fecha_hora)
       VALUES (?, 501, ?, 1, ?, NOW())`,
      [id_lote, id_usuario, cantidad]
    );

    await conn.commit();
    conn.release();

    // ── 7. Alerta de caducidad crítica ──────────────────────────────
    let warning = null;
    if (producto.es_perecedero) {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const diffDias = Math.ceil((fechaCad.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDias < 3) {
        warning = `ALERTA: Producto perecedero con caducidad en ${diffDias} día(s). Riesgo de merma inminente.`;
      }
    }

    return res.status(201).json({
      success: true,
      data: { id_lote, sku_id, status, cantidad_ingresada: cantidad },
      warning
    });
  } catch (err) {
    if (conn) {
      await conn.rollback();
      conn.release();
    }
    next(err);
  }
}

// ════════════════════════════════════════════════════════════════════════
// B. GET /api/lotes/search — Mega-Búsqueda Universal + Filtros
// ════════════════════════════════════════════════════════════════════════
//
// Query params:
//   q             — Texto parcial (LIKE %q%) en múltiples campos
//   status        — Filtro exacto: Disponible | Cuarentena | Vencido
//   es_perecedero — Filtro boolean: true | false
//   fecha_fin     — Lotes que vencen ANTES de esta fecha (para alertas)
//   area          — ID de área específico
//   page          — Página (default 1)
//   limit         — Resultados por página (default 20, max 100)

async function megaBusqueda(req, res, next) {
  try {
    const {
      q,
      status,
      es_perecedero,
      fecha_fin,
      area,
      page = 1,
      limit = 20,
    } = req.query;

    // ── Paginación segura ───────────────────────────────────────────
    const pageNum  = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset   = (pageNum - 1) * limitNum;

    // ── Construcción dinámica de la query ────────────────────────────
    //
    // SELECT base con subconsulta para stock dinámico (la fuente de verdad)
    // y JOINs masivos para la búsqueda universal.

    let selectSQL = `
      SELECT DISTINCT
        l.id_lote,
        l.sku_id,
        l.fecha_fabricacion,
        l.fecha_caducidad,
        l.status,
        p.nombre       AS producto_nombre,
        p.descripcion  AS producto_descripcion,
        p.marca        AS producto_marca,
        p.categoria    AS producto_categoria,
        p.url_img      AS producto_url_img,
        p.es_perecedero AS producto_es_perecedero,
        a.id_area       AS ubicacion_id_area,
        a.nombre_area   AS ubicacion_nombre_area,
        u.pasillo       AS ubicacion_pasillo,
        u.rack          AS ubicacion_rack,
        u.nivel         AS ubicacion_nivel,
        cb.codigo_ean,
        COALESCE((
          SELECT SUM(hm2.qty_afectada * tm2.factor)
          FROM Historial_Movimiento hm2
          JOIN TipoMovimiento tm2 ON hm2.id_tipo = tm2.id_tipo
          WHERE hm2.id_lote = l.id_lote
        ), 0) AS stock_actual
      FROM Lote l
      JOIN Producto p ON l.sku_id = p.sku_id
      LEFT JOIN CodigoBarras cb ON p.sku_id = cb.sku_id
      LEFT JOIN Existencia_Ubicacion eu ON l.id_lote = eu.id_lote
      LEFT JOIN Ubicacion u ON eu.id_ubicacion = u.id_ubicacion
      LEFT JOIN Area a ON u.id_area = a.id_area
    `;

    const conditions = [];
    const params     = [];

    // ── Filtro: búsqueda de texto parcial (?q=) ─────────────────────
    if (q && q.trim()) {
      const term = `%${q.trim()}%`;
      conditions.push(`(
        l.id_lote       LIKE ? OR
        l.sku_id        LIKE ? OR
        cb.codigo_ean   LIKE ? OR
        p.nombre        LIKE ? OR
        p.descripcion   LIKE ? OR
        p.marca         LIKE ? OR
        p.categoria     LIKE ? OR
        a.nombre_area   LIKE ? OR
        u.pasillo       LIKE ? OR
        u.rack          LIKE ? OR
        u.nivel         LIKE ?
      )`);
      // 11 campos → 11 params con el mismo término
      for (let i = 0; i < 11; i++) params.push(term);
    }

    // ── Filtro: status exacto ───────────────────────────────────────
    if (status) {
      conditions.push('l.status = ?');
      params.push(status);
    }

    // ── Filtro: es_perecedero ───────────────────────────────────────
    if (es_perecedero !== undefined) {
      const boolVal = es_perecedero === 'true' || es_perecedero === '1' ? 1 : 0;
      conditions.push('p.es_perecedero = ?');
      params.push(boolVal);
    }

    // ── Filtro: fecha_fin (vencen ANTES de esta fecha) ──────────────
    if (fecha_fin) {
      conditions.push('l.fecha_caducidad <= ?');
      params.push(fecha_fin);
    }

    // ── Filtro: área específica ─────────────────────────────────────
    if (area) {
      conditions.push('a.id_area = ?');
      params.push(parseInt(area, 10));
    }

    // ── Ensamblar WHERE ─────────────────────────────────────────────
    if (conditions.length > 0) {
      selectSQL += ' WHERE ' + conditions.join(' AND ');
    }

    // ── ORDER BY FEFO (caducidad más próxima primero) ───────────────
    selectSQL += ' ORDER BY l.fecha_caducidad ASC';

    // ── Contar total ANTES de paginar ───────────────────────────────
    const countSQL = `SELECT COUNT(*) AS total FROM (${selectSQL}) AS sub_count`;
    const [countRows] = await pool.execute(countSQL, params);
    const total = countRows[0].total;

    // ── Aplicar LIMIT / OFFSET ──────────────────────────────────────
    selectSQL += ' LIMIT ? OFFSET ?';
    const paginatedParams = [...params, String(limitNum), String(offset)];
    const [rows] = await pool.execute(selectSQL, paginatedParams);

    // ── Formatear respuesta ─────────────────────────────────────────
    const data = rows.map((r) => ({
      id_lote:          r.id_lote,
      sku_id:           r.sku_id,
      fecha_fabricacion: r.fecha_fabricacion,
      fecha_caducidad:  r.fecha_caducidad,
      status:           r.status,
      stock_actual:     Number(r.stock_actual),
      producto: {
        nombre:        r.producto_nombre,
        descripcion:   r.producto_descripcion,
        marca:         r.producto_marca,
        categoria:     r.producto_categoria,
        url_img:       r.producto_url_img,
        es_perecedero: Boolean(r.producto_es_perecedero),
      },
      ubicacion: {
        id_area:      r.ubicacion_id_area,
        nombre_area:  r.ubicacion_nombre_area,
        pasillo:      r.ubicacion_pasillo,
        rack:         r.ubicacion_rack,
        nivel:        r.ubicacion_nivel,
      },
      codigo_ean: r.codigo_ean || null,
    }));

    return res.json({
      success: true,
      data,
      pagination: {
        page:       pageNum,
        limit:      limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    next(err);
  }
}

// ════════════════════════════════════════════════════════════════════════
// C. GET /api/lotes/:id — Detalle completo ("Expediente Clínico")
// ════════════════════════════════════════════════════════════════════════

async function detalleLote(req, res, next) {
  try {
    const { id } = req.params;

    // ── 1. Datos base del lote + producto + código de barras ─────────
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
      [id]
    );

    if (loteRows.length === 0) {
      throw new AppError(`Lote "${id}" no encontrado.`, 404);
    }

    const lote = loteRows[0];

    // ── 2. Stock total dinámico ─────────────────────────────────────
    const stockTotal = await stockService.getStockByLote(id);

    // ── 3. Ubicaciones desglosadas por área ─────────────────────────
    const [ubicRows] = await pool.execute(
      `SELECT
         eu.id_ubicacion,
         a.nombre_area,
         u.pasillo, u.rack, u.nivel
       FROM Existencia_Ubicacion eu
       JOIN Ubicacion u ON eu.id_ubicacion = u.id_ubicacion
       JOIN Area a ON u.id_area = a.id_area
       WHERE eu.id_lote = ?`,
      [id]
    );

    // Calcular stock dinámico por ubicación
    const ubicaciones = {};
    for (const ub of ubicRows) {
      const stockUb = await stockService.getStockByLoteAndUbicacion(id, ub.id_ubicacion);
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

    // ── 4. Fecha de ingreso (primer movimiento tipo Entrada) ────────
    const [ingresoRows] = await pool.execute(
      `SELECT MIN(hm.fecha_hora) AS fecha_ingreso
       FROM Historial_Movimiento hm
       WHERE hm.id_lote = ?`,
      [id]
    );

    return res.json({
      success: true,
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
  } catch (err) {
    next(err);
  }
}

// ════════════════════════════════════════════════════════════════════════
// D. GET /api/lotes/:id/trazabilidad — Timeline de movimientos
// ════════════════════════════════════════════════════════════════════════

async function trazabilidadLote(req, res, next) {
  try {
    const { id } = req.params;

    // Verificar que el lote exista
    const [check] = await pool.execute('SELECT id_lote FROM Lote WHERE id_lote = ?', [id]);
    if (check.length === 0) {
      throw new AppError(`Lote "${id}" no encontrado.`, 404);
    }

    const [rows] = await pool.execute(
      `SELECT
         hm.id_movimiento,
         tm.descripcion AS tipo,
         tm.factor,
         hm.qty_afectada,
         hm.fecha_hora,
         usr.nombre AS usuario,
         a.nombre_area,
         u.pasillo, u.rack, u.nivel
       FROM Historial_Movimiento hm
       JOIN TipoMovimiento tm ON hm.id_tipo = tm.id_tipo
       LEFT JOIN Usuario usr ON hm.id_usuario = usr.id_usuario
       LEFT JOIN Ubicacion u ON hm.id_ubicacion = u.id_ubicacion
       LEFT JOIN Area a ON u.id_area = a.id_area
       WHERE hm.id_lote = ?
       ORDER BY hm.fecha_hora ASC`,
      [id]
    );

    const data = rows.map((r) => ({
      id_movimiento: r.id_movimiento,
      tipo: r.tipo,
      factor: r.factor,
      qty_afectada: Number(r.qty_afectada),
      fecha_hora: r.fecha_hora,
      usuario: r.usuario,
      ubicacion: {
        nombre_area: r.nombre_area,
        pasillo: r.pasillo,
        rack: r.rack,
        nivel: r.nivel,
      },
    }));

    return res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

// ════════════════════════════════════════════════════════════════════════
// E. GET /api/lotes/ubicaciones — Catálogo para filtros dinámicos
// ════════════════════════════════════════════════════════════════════════

async function listarUbicaciones(_req, res, next) {
  try {
    const [rows] = await pool.execute(
      `SELECT DISTINCT
         a.id_area, a.nombre_area,
         u.pasillo, u.rack, u.nivel
       FROM Ubicacion u
       JOIN Area a ON u.id_area = a.id_area
       ORDER BY a.nombre_area, u.pasillo, u.rack, u.nivel`
    );
    return res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

module.exports = { crearLote, megaBusqueda, detalleLote, trazabilidadLote, listarUbicaciones };
