// src/controllers/employeeController.js
const db = require('../db/database');

async function getAll(req, res, next) {
  try { res.json(await db.all2('SELECT * FROM Employee')); }
  catch (err) { next(err); }
}

async function getOne(req, res, next) {
  try {
    const row = await db.get2('SELECT * FROM Employee WHERE employee_id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Employee not found' });
    res.json(row);
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { ename } = req.body;
    if (!ename) return res.status(400).json({ error: 'ename is required' });
    const { lastID } = await db.run2('INSERT INTO Employee (ename) VALUES (?)', [ename]);
    res.status(201).json({ employee_id: lastID, ename });
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const { changes } = await db.run2(
      'UPDATE Employee SET ename = COALESCE(?,ename) WHERE employee_id = ?',
      [req.body.ename ?? null, req.params.id]
    );
    if (changes === 0) return res.status(404).json({ error: 'Employee not found' });
    res.json({ message: 'Updated' });
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    const { changes } = await db.run2('DELETE FROM Employee WHERE employee_id = ?', [req.params.id]);
    if (changes === 0) return res.status(404).json({ error: 'Employee not found' });
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
}

module.exports = { getAll, getOne, create, update, remove };
