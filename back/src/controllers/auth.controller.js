// ─── Controlador de Autenticación ───────────────────────────────────────
// POST /api/auth/login → loginByUserId
//
// Autenticación simplificada: recibe id_usuario, valida que exista
// y esté activo, devuelve el objeto completo con roles concatenados.
// Sin JWT por ahora — se agrega en fase futura.
// ────────────────────────────────────────────────────────────────────────

const pool = require('../config/db');
const { AppError } = require('../middlewares/errorHandler');

async function loginByUserId(req, res, next) {
  try {
    const { id_usuario } = req.body;

    if (!id_usuario) {
      throw new AppError('El campo "id_usuario" es requerido.', 400);
    }

    const [rows] = await pool.execute(
      `SELECT
         u.id_usuario,
         u.nombre,
         u.activo,
         COALESCE(GROUP_CONCAT(r.nombre_rol ORDER BY r.id_rol SEPARATOR ', '), '') AS roles,
         MIN(a.id_rol) AS id_rol
       FROM Usuario u
       LEFT JOIN Acceso a ON u.id_usuario = a.id_usuario
       LEFT JOIN Rol    r ON a.id_rol     = r.id_rol
       WHERE u.id_usuario = ?
       GROUP BY u.id_usuario, u.nombre, u.activo`,
      [id_usuario]
    );

    if (rows.length === 0) {
      throw new AppError('Usuario no encontrado.', 404);
    }

    const user = rows[0];

    if (!user.activo) {
      throw new AppError('Usuario desactivado. Contacta al administrador.', 403);
    }

    return res.json({
      success: true,
      user: {
        id_usuario: user.id_usuario,
        nombre:     user.nombre,
        activo:     Boolean(user.activo),
        roles:      user.roles,
        id_rol:     user.id_rol,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { loginByUserId };
