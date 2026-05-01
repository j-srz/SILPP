const { Router } = require('express');
const { loginByUserId } = require('../controllers/auth.controller');

const router = Router();

// POST /api/auth/login — Autenticación por id_usuario
router.post('/login', loginByUserId);

module.exports = router;
