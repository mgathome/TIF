const { HttpError } = require('../utils/errors');
const env = require('../config/env');

// 404 fallthrough
function notFound(_req, res) {
  res.status(404).json({ error: 'Route not found' });
}

// Handler global ; doit être le dernier middleware enregistré
function errorHandler(err, _req, res, _next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({
      error: err.message,
      ...(err.details && { details: err.details }),
    });
  }

  // Postgres : violation unique
  if (err.code === '23505') {
    return res.status(409).json({ error: 'Resource already exists', details: err.detail });
  }

  console.error('[unhandled]', err);
  res.status(500).json({
    error: 'Internal server error',
    ...(env.isProd ? {} : { stack: err.stack }),
  });
}

module.exports = { notFound, errorHandler };
