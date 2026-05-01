const { Router } = require('express');
const { buscarProductos } = require('../controllers/productos.controller');

const router = Router();

// GET /api/productos/search
router.get('/search', buscarProductos);

module.exports = router;
