// src/controllers/productController.js
const db = require('../db/database');

async function getAll(req, res, next) {
  try { res.json(await db.all2('SELECT * FROM Product')); }
  catch (err) { next(err); }
}

async function getOne(req, res, next) {
  try {
    const row = await db.get2('SELECT * FROM Product WHERE product_id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Product not found' });
    res.json(row);
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { pname, price } = req.body;
    if (!pname || price === undefined)
      return res.status(400).json({ error: 'pname and price are required' });
    const { lastID } = await db.run2('INSERT INTO Product (pname, price) VALUES (?,?)', [pname, price]);
    res.status(201).json({ product_id: lastID, pname, price });
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const { pname, price } = req.body;
    const { changes } = await db.run2(
      'UPDATE Product SET pname = COALESCE(?,pname), price = COALESCE(?,price) WHERE product_id = ?',
      [pname ?? null, price ?? null, req.params.id]
    );
    if (changes === 0) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Updated successfully' });
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    const { changes } = await db.run2('DELETE FROM Product WHERE product_id = ?', [req.params.id]);
    if (changes === 0) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { next(err); }
}

module.exports = { getAll, getOne, create, update, remove };
