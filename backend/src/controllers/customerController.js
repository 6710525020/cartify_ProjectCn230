// src/controllers/customerController.js
const db = require('../db/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SECRET  = process.env.JWT_SECRET    || 'changeme';
const EXPIRES = process.env.JWT_EXPIRES_IN || '7d';

async function register(req, res, next) {
  try {
    const { cname, email, password, address, phone_number } = req.body;
    if (!cname || !email || !password)
      return res.status(400).json({ error: 'cname, email and password are required' });
    const hash = bcrypt.hashSync(password, 10);
    const { lastID } = await db.run2(
      `INSERT INTO Customer (cname, email, password, address, phone_number) VALUES (?,?,?,?,?)`,
      [cname, email, hash, address ?? null, phone_number ?? null]
    );
    res.status(201).json({ customer_id: lastID, cname, email });
  } catch (err) { next(err); }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'email and password required' });
    const customer = await db.get2('SELECT * FROM Customer WHERE email = ?', [email]);
    if (!customer || !bcrypt.compareSync(password, customer.password))
      return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: customer.customer_id, role: 'customer' }, SECRET, { expiresIn: EXPIRES });
    res.json({ token, customer_id: customer.customer_id, cname: customer.cname });
  } catch (err) { next(err); }
}

async function getAll(req, res, next) {
  try {
    const rows = await db.all2('SELECT customer_id, cname, email, address, phone_number FROM Customer');
    res.json(rows);
  } catch (err) { next(err); }
}

async function getOne(req, res, next) {
  try {
    const row = await db.get2(
      'SELECT customer_id, cname, email, address, phone_number FROM Customer WHERE customer_id = ?',
      [req.params.id]
    );
    if (!row) return res.status(404).json({ error: 'Customer not found' });
    res.json(row);
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const { cname, email, address, phone_number } = req.body;
    const { changes } = await db.run2(
      `UPDATE Customer
       SET cname        = COALESCE(?, cname),
           email        = COALESCE(?, email),
           address      = COALESCE(?, address),
           phone_number = COALESCE(?, phone_number)
       WHERE customer_id = ?`,
      [cname ?? null, email ?? null, address ?? null, phone_number ?? null, req.params.id]
    );
    if (changes === 0) return res.status(404).json({ error: 'Customer not found' });
    res.json({ message: 'Updated successfully' });
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    const { changes } = await db.run2('DELETE FROM Customer WHERE customer_id = ?', [req.params.id]);
    if (changes === 0) return res.status(404).json({ error: 'Customer not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { next(err); }
}

module.exports = { register, login, getAll, getOne, update, remove };
