const { Router } = require('express');
const { escanear, sugerencias } = require('../controllers/scan.controller');

const router = Router();

// GET /api/scan?code=<valor_escaneado>
router.get('/', escanear);

// GET /api/scan/suggest?q=<texto_parcial> — Autocomplete
router.get('/suggest', sugerencias);

module.exports = router;

