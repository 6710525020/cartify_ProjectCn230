// src/middleware/errorHandler.js

function errorHandler(err, req, res, next) {
  console.error(`[${new Date().toISOString()}] ${err.message}`);

  // SQLite constraint errors
  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return res.status(409).json({ error: 'Duplicate entry — resource already exists' });
  }
  if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
    return res.status(400).json({ error: 'Foreign key constraint failed' });
  }
  if (err.code === 'SQLITE_CONSTRAINT_CHECK') {
    return res.status(400).json({ error: 'Value violates check constraint' });
  }

  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal server error' });
}

module.exports = errorHandler;
