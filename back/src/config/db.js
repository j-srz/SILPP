// ─── Pool de Conexiones MySQL2/Promise ─────────────────────────────────
// Todas las consultas deben usar pool.execute() (sentencias preparadas)
// para prevenir inyección SQL.
// ────────────────────────────────────────────────────────────────────────

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:     process.env.DB_HOST,
  user:     process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port:     Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  // Devolver fechas como strings ISO para evitar problemas de timezone
  dateStrings: true,
});

module.exports = pool;
