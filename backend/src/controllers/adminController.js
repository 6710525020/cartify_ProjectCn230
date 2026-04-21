// src/controllers/adminController.js
const db = require('../db/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SECRET  = process.env.JWT_SECRET    || 'changeme';
const EXPIRES = process.env.JWT_EXPIRES_IN || '7d';

async function login(req, res, next) {
  try {
    const { aname, password } = req.body;
    if (!aname || !password)
      return res.status(400).json({ error: 'aname and password required' });
    const admin = await db.get2('SELECT * FROM Admin WHERE aname = ?', [aname]);
    if (!admin || !bcrypt.compareSync(password, admin.password))
      return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: admin.admin_id, role: 'admin' }, SECRET, { expiresIn: EXPIRES });
    res.json({ token, admin_id: admin.admin_id, aname: admin.aname });
  } catch (err) { next(err); }
}

async function getAll(req, res, next) {
  try { res.json(await db.all2('SELECT admin_id, aname FROM Admin')); }
  catch (err) { next(err); }
}

async function getOne(req, res, next) {
  try {
    const row = await db.get2('SELECT admin_id, aname FROM Admin WHERE admin_id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Admin not found' });
    res.json(row);
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { aname, password } = req.body;
    if (!aname || !password)
      return res.status(400).json({ error: 'aname and password required' });
    const hash = bcrypt.hashSync(password, 10);
    const { lastID } = await db.run2('INSERT INTO Admin (aname, password) VALUES (?,?)', [aname, hash]);
    res.status(201).json({ admin_id: lastID, aname });
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    const { changes } = await db.run2('DELETE FROM Admin WHERE admin_id = ?', [req.params.id]);
    if (changes === 0) return res.status(404).json({ error: 'Admin not found' });
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
}

module.exports = { login, getAll, getOne, create, remove };
