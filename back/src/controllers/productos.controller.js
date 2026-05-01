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

module.exports = { buscarProductos };
