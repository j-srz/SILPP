// ─── Router de Lotes ────────────────────────────────────────────────────
// Monta bajo /api/lotes en index.js
// ────────────────────────────────────────────────────────────────────────

const { Router } = require('express');
const {
  crearLote,
  megaBusqueda,
  detalleLote,
  trazabilidadLote,
  listarUbicaciones,
} = require('../controllers/lotes.controller');

const router = Router();

// POST /api/lotes              — Registrar un nuevo lote
router.post('/', crearLote);

// GET  /api/lotes/search       — Mega-búsqueda universal con filtros avanzados
router.get('/search', megaBusqueda);

// GET  /api/lotes/ubicaciones  — Catálogo de ubicaciones para filtros dinámicos
router.get('/ubicaciones', listarUbicaciones);

// GET  /api/lotes/:id          — Detalle completo 
router.get('/:id', detalleLote);

// GET  /api/lotes/:id/trazabilidad — Timeline de movimientos
router.get('/:id/trazabilidad', trazabilidadLote);

module.exports = router;
