// ─── Controlador de Usuarios ────────────────────────────────────────────
// GET    /api/usuarios            → listarUsuarios
// POST   /api/usuarios            → crearUsuario
// PATCH  /api/usuarios/:id/status → toggleStatus (baja lógica)
// GET    /api/roles               → listarRoles
// ────────────────────────────────────────────────────────────────────────

const pool = require('../config/db');
const { AppError } = require('../middlewares/errorHandler');

// ════════════════════════════════════════════════════════════════════════
// A. GET /api/usuarios — Lista de usuarios con sus roles
// ════════════════════════════════════════════════════════════════════════
//
// Hace JOIN con Acceso → Rol y concatena los nombres de rol
// usando GROUP_CONCAT para devolver un solo string por usuario.
//
// Ejemplo de respuesta por usuario:
//   { id_usuario: 5, nombre: "Ricardo", activo: true, roles: "Operativo, Táctico" }

async function listarUsuarios(_req, res, next) {
  try {
    const [rows] = await pool.execute(`
      SELECT
        u.id_usuario,
        u.nombre,
        u.activo,
        COALESCE(GROUP_CONCAT(r.nombre_rol ORDER BY r.id_rol SEPARATOR ', '), '') AS roles
      FROM Usuario u
      LEFT JOIN Acceso a  ON u.id_usuario = a.id_usuario
      LEFT JOIN Rol    r  ON a.id_rol     = r.id_rol
      GROUP BY u.id_usuario, u.nombre, u.activo
      ORDER BY u.id_usuario ASC
    `);

    const data = rows.map((r) => ({
      id_usuario: r.id_usuario,
      nombre:     r.nombre,
      activo:     Boolean(r.activo),
      roles:      r.roles,
    }));

    return res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

// ════════════════════════════════════════════════════════════════════════
// B. POST /api/usuarios — Registro de nuevo usuario
// ════════════════════════════════════════════════════════════════════════
//
// Cuerpo esperado:
//   { "nombre": "Carlos López", "id_rol": 1 }
//
// Usa una transacción para garantizar atomicidad:
//   1. INSERT en Usuario
//   2. INSERT en Acceso (asignación de rol inicial)
//
// Si cualquiera falla → ROLLBACK y el usuario no queda a medias.

async function crearUsuario(req, res, next) {
  const conn = await pool.getConnection();
  try {
    const { nombre, id_rol } = req.body;

    // ── 1. Validar campos requeridos ────────────────────────────────
    if (!nombre || !nombre.trim()) {
      throw new AppError('El campo "nombre" es requerido.', 400);
    }
    if (!id_rol) {
      throw new AppError('El campo "id_rol" es requerido para asignar un rol inicial.', 400);
    }

    // ── 2. Verificar que el rol exista ──────────────────────────────
    const [rolRows] = await conn.execute(
      'SELECT id_rol FROM Rol WHERE id_rol = ?',
      [id_rol]
    );
    if (rolRows.length === 0) {
      throw new AppError(
        `Rol con id_rol=${id_rol} no existe. Roles válidos: 1 (Operativo), 2 (Táctico), 3 (Auditor).`,
        400
      );
    }

    // ── 3. Transacción: INSERT Usuario + INSERT Acceso ──────────────
    await conn.beginTransaction();

    const [insertResult] = await conn.execute(
      'INSERT INTO Usuario (nombre, activo) VALUES (?, 1)',
      [nombre.trim()]
    );
    const newUserId = insertResult.insertId;

    await conn.execute(
      'INSERT INTO Acceso (id_usuario, id_rol) VALUES (?, ?)',
      [newUserId, id_rol]
    );

    await conn.commit();

    // ── 4. Obtener el nombre del rol para la respuesta ──────────────
    const [rolInfo] = await pool.execute(
      'SELECT nombre_rol FROM Rol WHERE id_rol = ?',
      [id_rol]
    );

    return res.status(201).json({
      success: true,
      data: {
        id_usuario: newUserId,
        nombre:     nombre.trim(),
        activo:     true,
        roles:      rolInfo[0].nombre_rol,
      },
    });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
}

// ════════════════════════════════════════════════════════════════════════
// C. PATCH /api/usuarios/:id/status — Baja/Alta lógica
// ════════════════════════════════════════════════════════════════════════
//
// Cuerpo esperado:
//   { "activo": false }   ← desactivar (baja lógica)
//   { "activo": true }    ← reactivar
//
// NO se borra el registro para mantener la trazabilidad
// del Historial_Movimiento, Entrada, Merma, etc.

async function toggleStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { activo } = req.body;

    // ── 1. Validar parámetro ────────────────────────────────────────
    if (activo === undefined || activo === null) {
      throw new AppError('El campo "activo" (true/false) es requerido en el body.', 400);
    }

    const activoVal = activo === true || activo === 'true' || activo === 1 ? 1 : 0;

    // ── 2. Verificar que el usuario exista ───────────────────────────
    const [existente] = await pool.execute(
      'SELECT id_usuario, nombre, activo FROM Usuario WHERE id_usuario = ?',
      [id]
    );
    if (existente.length === 0) {
      throw new AppError(`Usuario con id=${id} no encontrado.`, 404);
    }

    // ── 3. Actualizar ───────────────────────────────────────────────
    await pool.execute(
      'UPDATE Usuario SET activo = ? WHERE id_usuario = ?',
      [activoVal, id]
    );

    return res.json({
      success: true,
      data: {
        id_usuario: Number(id),
        nombre:     existente[0].nombre,
        activo:     Boolean(activoVal),
      },
      message: activoVal
        ? 'Usuario reactivado correctamente.'
        : 'Usuario desactivado (baja lógica). Su historial se preserva.',
    });
  } catch (err) {
    next(err);
  }
}

// ════════════════════════════════════════════════════════════════════════
// D. GET /api/roles — Catálogo de roles
// ════════════════════════════════════════════════════════════════════════
//
// Devuelve el catálogo completo de la tabla Rol.
// Usado para llenar los <select> en el frontend.

async function listarRoles(_req, res, next) {
  try {
    const [rows] = await pool.execute(
      'SELECT id_rol, nombre_rol FROM Rol ORDER BY id_rol ASC'
    );

    return res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

module.exports = { listarUsuarios, crearUsuario, toggleStatus, listarRoles };
