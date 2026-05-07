const { Router } = require('express');
const { escanear, sugerencias, generarBarcode } = require('../controllers/scan.controller');

const router = Router();

// GET /api/scan/barcode/:code?type=ean13
router.get('/barcode/:code', generarBarcode);

// GET /api/scan?code=<valor_escaneado>
router.get('/', escanear);

// GET /api/scan/suggest?q=<texto_parcial> — Autocomplete
router.get('/suggest', sugerencias);

module.exports = router;

