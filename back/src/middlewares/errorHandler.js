// ─── Clase de Error Operacional ─────────────────────────────────────────
// Úsala en controladores: throw new AppError('mensaje', 400);
// El middleware la capturará y responderá con el statusCode indicado.
// ────────────────────────────────────────────────────────────────────────

class AppError extends Error {
  /**
   * @param {string} message  — Mensaje descriptivo del error
   * @param {number} statusCode — Código HTTP (400 validación, 404 no encontrado, etc.)
   */
  constructor(message, statusCode) {
    super(message);
    this.statusCode   = statusCode;
    this.isOperational = true;           // Distingue errores controlados de bugs
    Error.captureStackTrace(this, this.constructor);
  }
}

// ─── Middleware Centralizado de Errores ──────────────────────────────────
// Debe registrarse como ÚLTIMO middleware en index.js:
//   app.use(errorHandler);
// ────────────────────────────────────────────────────────────────────────

function errorHandler(err, _req, res, _next) {
  // Errores operacionales (validación, not-found, etc.)
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      error:   err.message,
    });
  }

  // Errores de MySQL/MariaDB (duplicados, FK violations, etc.)
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      error:   'El registro ya existe (clave duplicada).',
    });
  }

  // Errores inesperados (bugs) → log completo + respuesta genérica
  console.error('❌ Error inesperado:', err);
  return res.status(500).json({
    success: false,
    error:   'Error interno del servidor.',
  });
}

module.exports = { AppError, errorHandler };
