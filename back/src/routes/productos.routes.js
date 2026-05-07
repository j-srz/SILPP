const { Router } = require('express');
const { buscarProductos, catalogoProductos, detalleProducto } = require('../controllers/productos.controller');

const router = Router();

// GET /api/productos/catalog — Catálogo con agregación (stock global, lotes, estado crítico)
router.get('/catalog', catalogoProductos);

// GET /api/productos/search
router.get('/search', buscarProductos);

// GET /api/productos/:sku — Expediente de Producto
router.get('/:sku', detalleProducto);

module.exports = router;

