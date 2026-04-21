// src/controllers/reportController.js
const db = require('../db/database');

async function getAll(req, res, next) {
  try {
    const rows = await db.all2(`
      SELECT r.*, o.status AS order_status, o.total_price
      FROM Report r
      JOIN "Order" o ON o.order_id = r.order_id
    `);
    res.json(rows);
  } catch (err) { next(err); }
}

async function getOne(req, res, next) {
  try {
    const report = await db.get2(`
      SELECT r.*, o.status AS order_status, o.total_price
      FROM Report r
      JOIN "Order" o ON o.order_id = r.order_id
      WHERE r.report_id = ?
    `, [req.params.id]);
    if (!report) return res.status(404).json({ error: 'Report not found' });

    const managers = await db.all2(`
      SELECT m.manager_id, m.mname
      FROM Manager_Report mr
      JOIN Manager m ON m.manager_id = mr.manager_id
      WHERE mr.report_id = ?
    `, [req.params.id]);

    res.json({ ...report, managers });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { order_id, report_type, manager_ids } = req.body;
    if (!order_id || !report_type)
      return res.status(400).json({ error: 'order_id and report_type are required' });

    const { lastID: report_id } = await db.run2(
      'INSERT INTO Report (order_id, report_type) VALUES (?,?)',
      [order_id, report_type]
    );

    if (Array.isArray(manager_ids)) {
      for (const mid of manager_ids) {
        await db.run2('INSERT INTO Manager_Report (manager_id, report_id) VALUES (?,?)', [mid, report_id]);
      }
    }
    res.status(201).json({ report_id, order_id, report_type });
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    const { changes } = await db.run2('DELETE FROM Report WHERE report_id = ?', [req.params.id]);
    if (changes === 0) return res.status(404).json({ error: 'Report not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { next(err); }
}

module.exports = { getAll, getOne, create, remove };
