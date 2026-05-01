// ─── Servicio de Cálculo Dinámico de Stock ──────────────────────────────
//
// REGLA FUNDAMENTAL DE SILPP:
// El stock NO es un campo estático. Es el resultado de:
//   SUM(Historial_Movimiento.qty_afectada × TipoMovimiento.factor)
//
// Donde factor = 1 (suma: entradas, devoluciones) o -1 (resta: ventas, mermas)
//
// Este servicio es la ÚNICA fuente de verdad para existencias.
// ────────────────────────────────────────────────────────────────────────

const pool = require('../config/db');

/**
 * Calcula el stock total de un lote (todas las ubicaciones).
 * @param {string} idLote
 * @returns {Promise<number>}
 */
async function getStockByLote(idLote) {
  const [rows] = await pool.execute(
    `SELECT COALESCE(SUM(hm.qty_afectada * tm.factor), 0) AS stock_actual
     FROM Historial_Movimiento hm
     JOIN TipoMovimiento tm ON hm.id_tipo = tm.id_tipo
     WHERE hm.id_lote = ?`,
    [idLote]
  );
  return Number(rows[0].stock_actual);
}

/**
 * Calcula el stock de un lote en una ubicación específica.
 * @param {string} idLote
 * @param {number} idUbicacion
 * @returns {Promise<number>}
 */
async function getStockByLoteAndUbicacion(idLote, idUbicacion) {
  const [rows] = await pool.execute(
    `SELECT COALESCE(SUM(hm.qty_afectada * tm.factor), 0) AS stock_actual
     FROM Historial_Movimiento hm
     JOIN TipoMovimiento tm ON hm.id_tipo = tm.id_tipo
     WHERE hm.id_lote = ? AND hm.id_ubicacion = ?`,
    [idLote, idUbicacion]
  );
  return Number(rows[0].stock_actual);
}

/**
 * Calcula el stock desglosado por lote para un SKU dado,
 * ordenado por fecha_caducidad ASC (FEFO: First Expired, First Out).
 * @param {string} skuId
 * @returns {Promise<Array<{id_lote:string, fecha_caducidad:string, status:string, stock_actual:number}>>}
 */
async function getStockBySku(skuId) {
  const [rows] = await pool.execute(
    `SELECT l.id_lote,
            l.fecha_caducidad,
            l.status,
            COALESCE(SUM(hm.qty_afectada * tm.factor), 0) AS stock_actual
     FROM Lote l
     LEFT JOIN Historial_Movimiento hm ON l.id_lote = hm.id_lote
     LEFT JOIN TipoMovimiento tm ON hm.id_tipo = tm.id_tipo
     WHERE l.sku_id = ?
     GROUP BY l.id_lote, l.fecha_caducidad, l.status
     ORDER BY l.fecha_caducidad ASC`,
    [skuId]
  );
  return rows.map((r) => ({ ...r, stock_actual: Number(r.stock_actual) }));
}

module.exports = {
  getStockByLote,
  getStockByLoteAndUbicacion,
  getStockBySku,
};
