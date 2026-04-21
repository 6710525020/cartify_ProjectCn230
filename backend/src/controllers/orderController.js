// src/controllers/orderController.js
const db = require('../db/database');

async function recalcTotal(order_id) {
  const row = await db.get2(
    `SELECT COALESCE(SUM(oi.count * p.price), 0) AS total
     FROM OrderItem oi
     JOIN Product p ON p.product_id = oi.product_id
     WHERE oi.order_id = ?`,
    [order_id]
  );
  await db.run2('UPDATE "Order" SET total_price = ? WHERE order_id = ?', [row.total, order_id]);
  return row.total;
}

async function getAll(req, res, next) {
  try {
    const rows = await db.all2(`
      SELECT o.*, c.cname, a.aname
      FROM "Order" o
      LEFT JOIN Customer c ON c.customer_id = o.customer_id
      LEFT JOIN Admin a    ON a.admin_id    = o.admin_id
    `);
    res.json(rows);
  } catch (err) { next(err); }
}

async function getOne(req, res, next) {
  try {
    const order = await db.get2(`
      SELECT o.*, c.cname, a.aname
      FROM "Order" o
      LEFT JOIN Customer c ON c.customer_id = o.customer_id
      LEFT JOIN Admin a    ON a.admin_id    = o.admin_id
      WHERE o.order_id = ?
    `, [req.params.id]);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const items = await db.all2(`
      SELECT oi.*, p.pname, p.price
      FROM OrderItem oi
      JOIN Product p ON p.product_id = oi.product_id
      WHERE oi.order_id = ?
    `, [req.params.id]);

    res.json({ ...order, items });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { customer_id, admin_id, items } = req.body;
    if (!customer_id || !Array.isArray(items) || items.length === 0)
      return res.status(400).json({ error: 'customer_id and items[] required' });

    // Validate items
    for (const item of items) {
      if (!item.product_id || !item.count)
        return res.status(400).json({ error: 'Each item needs product_id and count' });
    }

    const { lastID: order_id } = await db.run2(
      `INSERT INTO "Order" (customer_id, admin_id) VALUES (?,?)`,
      [customer_id, admin_id ?? null]
    );

    for (const item of items) {
      await db.run2(
        'INSERT INTO OrderItem (order_id, product_id, count) VALUES (?,?,?)',
        [order_id, item.product_id, item.count]
      );
    }

    const total_price = await recalcTotal(order_id);
    res.status(201).json({ order_id, total_price });
  } catch (err) { next(err); }
}

async function updateStatus(req, res, next) {
  try {
    const { status } = req.body;
    const valid = ['pending', 'processing', 'completed', 'cancelled'];
    if (!valid.includes(status))
      return res.status(400).json({ error: `status must be one of: ${valid.join(', ')}` });
    const { changes } = await db.run2(
      `UPDATE "Order" SET status = ? WHERE order_id = ?`,
      [status, req.params.id]
    );
    if (changes === 0) return res.status(404).json({ error: 'Order not found' });
    res.json({ message: 'Status updated', status });
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    const { changes } = await db.run2(`DELETE FROM "Order" WHERE order_id = ?`, [req.params.id]);
    if (changes === 0) return res.status(404).json({ error: 'Order not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { next(err); }
}

async function addItem(req, res, next) {
  try {
    const { id: order_id } = req.params;
    const { product_id, count } = req.body;
    if (!product_id || !count)
      return res.status(400).json({ error: 'product_id and count required' });

    const existing = await db.get2(
      'SELECT count FROM OrderItem WHERE order_id = ? AND product_id = ?',
      [order_id, product_id]
    );
    if (existing) {
      await db.run2(
        'UPDATE OrderItem SET count = ? WHERE order_id = ? AND product_id = ?',
        [existing.count + count, order_id, product_id]
      );
    } else {
      await db.run2(
        'INSERT INTO OrderItem (order_id, product_id, count) VALUES (?,?,?)',
        [order_id, product_id, count]
      );
    }
    const total_price = await recalcTotal(order_id);
    res.json({ message: 'Item added', total_price });
  } catch (err) { next(err); }
}

async function removeItem(req, res, next) {
  try {
    const { id: order_id, productId: product_id } = req.params;
    const { changes } = await db.run2(
      'DELETE FROM OrderItem WHERE order_id = ? AND product_id = ?',
      [order_id, product_id]
    );
    if (changes === 0) return res.status(404).json({ error: 'Item not found' });
    const total_price = await recalcTotal(order_id);
    res.json({ message: 'Item removed', total_price });
  } catch (err) { next(err); }
}

module.exports = { getAll, getOne, create, updateStatus, remove, addItem, removeItem };
