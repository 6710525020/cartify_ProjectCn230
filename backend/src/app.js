// src/app.js
require('dotenv').config();
const express = require('express');
const cors    = require('cors');

// Initialize DB (runs schema on first boot)
require('./db/database');

const app = express();

// ── Global Middleware ───────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/products',  require('./routes/productRoutes'));
app.use('/api/orders',    require('./routes/orderRoutes'));
app.use('/api/payments',  require('./routes/paymentRoutes'));
app.use('/api/reports',   require('./routes/reportRoutes'));
app.use('/api/managers',  require('./routes/managerRoutes'));
app.use('/api/admins',    require('./routes/adminRoutes'));
app.use('/api/employees', require('./routes/employeeRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// ── 404 ──────────────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: `Route ${req.method} ${req.path} not found` }));

// ── Error Handler ─────────────────────────────────────────────────────────────
app.use(require('./middleware/errorHandler'))

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀  Server running on http://localhost:${PORT}`));

module.exports = app;
