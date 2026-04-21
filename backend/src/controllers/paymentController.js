// src/controllers/paymentController.js
const db = require('../db/database');

async function getAll(req, res, next) {
  try {
    const rows = await db.all2(`
      SELECT p.*, e.ename, o.total_price AS order_total
      FROM Payment p
      LEFT JOIN Employee e ON e.employee_id = p.employee_id
      LEFT JOIN "Order" o  ON o.order_id    = p.order_id
    `);
    res.json(rows);
  } catch (err) { next(err); }
}

async function getOne(req, res, next) {
  try {
    const row = await db.get2(`
      SELECT p.*, e.ename
      FROM Payment p
      LEFT JOIN Employee e ON e.employee_id = p.employee_id
      WHERE p.payment_id = ?
    `, [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Payment not found' });
    res.json(row);
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { order_id, amount, payment_method, employee_id } = req.body;
    if (!order_id || amount === undefined || !payment_method)
      return res.status(400).json({ error: 'order_id, amount and payment_method are required' });

    const order = await db.get2(`SELECT order_id FROM "Order" WHERE order_id = ?`, [order_id]);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const { lastID } = await db.run2(
      `INSERT INTO Payment (order_id, employee_id, amount, payment_method) VALUES (?,?,?,?)`,
      [order_id, employee_id ?? null, amount, payment_method]
    );
    await db.run2(`UPDATE "Order" SET status = 'completed' WHERE order_id = ?`, [order_id]);

    res.status(201).json({ payment_id: lastID, order_id, amount, payment_method });
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    const { changes } = await db.run2('DELETE FROM Payment WHERE payment_id = ?', [req.params.id]);
    if (changes === 0) return res.status(404).json({ error: 'Payment not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { next(err); }
}

module.exports = { getAll, getOne, create, remove };
