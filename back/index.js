// ─── SILPP Backend · Entry Point ────────────────────────────────────────
//
// Sistema de Inventario por Lotes de Productos Perecederos
// Instituto Tecnológico de Aguascalientes
//
// Lógica FEFO (First Expired, First Out)
// Trazabilidad dinámica: stock = SUM(movimientos × factor)
// ────────────────────────────────────────────────────────────────────────

require('dotenv').config();

const express = require('express');
const cors    = require('cors');

const { errorHandler }  = require('./src/middlewares/errorHandler');
const authRoutes        = require('./src/routes/auth.routes');
const lotesRoutes       = require('./src/routes/lotes.routes');
const productosRoutes   = require('./src/routes/productos.routes');
const usuariosRoutes    = require('./src/routes/usuarios.routes');
const pool              = require('./src/config/db');

const app  = express();
const PORT = process.env.PORT || 3000;

// ═══════════════════════════════════════════════════════════════════════
// Middlewares globales
// ═══════════════════════════════════════════════════════════════════════

// CORS — permite comunicación con el frontend de React
app.use(cors());

// Parseo de JSON en el body de las peticiones
app.use(express.json());

// ═══════════════════════════════════════════════════════════════════════
// Rutas
// ═══════════════════════════════════════════════════════════════════════

app.use('/api/auth', authRoutes);
app.use('/api/lotes', lotesRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/usuarios', usuariosRoutes);

// Health-check básico
app.get('/api/health', async (_req, res) => {
  try {
    const [rows] = await pool.execute('SELECT 1 AS ok');
    res.json({ success: true, db: 'connected', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ success: false, db: 'disconnected', error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════
// Middleware de errores (DEBE ser el último)
// ═══════════════════════════════════════════════════════════════════════

app.use(errorHandler);

// ═══════════════════════════════════════════════════════════════════════
// Arranque
// ═══════════════════════════════════════════════════════════════════════

app.listen(PORT, () => {
  console.log(`\n🟢 Servidor SILPP corriendo en http://localhost:${PORT}`);
  console.log(`   ├── POST  /api/auth/login`);
  console.log(`   ├── POST  /api/lotes`);
  console.log(`   ├── GET   /api/lotes/search`);
  console.log(`   ├── GET   /api/usuarios`);
  console.log(`   ├── POST  /api/usuarios`);
  console.log(`   ├── PATCH /api/usuarios/:id/status`);
  console.log(`   ├── GET   /api/usuarios/roles`);
  console.log(`   └── GET   /api/health\n`);
});
