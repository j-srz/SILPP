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

    // 2. Código EAN
    const [cbRows] = await pool.execute(
      'SELECT codigo_ean FROM CodigoBarras WHERE sku_id = ?',
      [sku]
    );

    // 3. Todos los lotes activos con stock dinámico (FEFO)
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

module.exports = { buscarProductos, detalleProducto };

