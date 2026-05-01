// ─── Router de Usuarios y Roles ─────────────────────────────────────────
// Monta bajo /api/usuarios y /api/roles en index.js
// ────────────────────────────────────────────────────────────────────────

const { Router } = require('express');
const {
  listarUsuarios,
  crearUsuario,
  toggleStatus,
  listarRoles,
} = require('../controllers/usuarios.controller');

const router = Router();

// ── Usuarios ────────────────────────────────────────────────────────────

// GET  /api/usuarios            — Lista de usuarios con roles (GROUP_CONCAT)
router.get('/', listarUsuarios);

// POST /api/usuarios            — Registrar nuevo usuario + rol inicial (transaccional)
router.post('/', crearUsuario);

// PATCH /api/usuarios/:id/status — Baja/Alta lógica (toggle activo)
router.patch('/:id/status', toggleStatus);

// ── Roles ───────────────────────────────────────────────────────────────

// GET /api/roles — Catálogo de roles para <select> del frontend
router.get('/roles', listarRoles);

module.exports = router;
