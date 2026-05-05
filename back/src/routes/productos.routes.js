const { Router } = require('express');
const { buscarProductos, detalleProducto } = require('../controllers/productos.controller');

const router = Router();

// GET /api/productos/search
router.get('/search', buscarProductos);

// GET /api/productos/:sku — Expediente de Producto
router.get('/:sku', detalleProducto);

module.exports = router;

