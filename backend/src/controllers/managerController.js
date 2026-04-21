// src/controllers/managerController.js
const db = require('../db/database');

async function getAll(req, res, next) {
  try { res.json(await db.all2('SELECT * FROM Manager')); }
  catch (err) { next(err); }
}

async function getOne(req, res, next) {
  try {
    const row = await db.get2('SELECT * FROM Manager WHERE manager_id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Manager not found' });
    res.json(row);
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { mname } = req.body;
    if (!mname) return res.status(400).json({ error: 'mname is required' });
    const { lastID } = await db.run2('INSERT INTO Manager (mname) VALUES (?)', [mname]);
    res.status(201).json({ manager_id: lastID, mname });
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const { changes } = await db.run2(
      'UPDATE Manager SET mname = COALESCE(?,mname) WHERE manager_id = ?',
      [req.body.mname ?? null, req.params.id]
    );
    if (changes === 0) return res.status(404).json({ error: 'Manager not found' });
    res.json({ message: 'Updated' });
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    const { changes } = await db.run2('DELETE FROM Manager WHERE manager_id = ?', [req.params.id]);
    if (changes === 0) return res.status(404).json({ error: 'Manager not found' });
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
}

module.exports = { getAll, getOne, create, update, remove };
