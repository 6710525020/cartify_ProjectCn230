// src/db/database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || './data/shop.db';
const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) { console.error('Failed to open DB:', err.message); process.exit(1); }
  console.log('📦  SQLite connected → ' + DB_PATH);
});

// Promisified helpers
db.run2 = (sql, params = []) =>
  new Promise((resolve, reject) =>
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    })
  );

db.all2 = (sql, params = []) =>
  new Promise((resolve, reject) =>
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)))
  );

db.get2 = (sql, params = []) =>
  new Promise((resolve, reject) =>
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)))
  );

db.exec2 = (sql) =>
  new Promise((resolve, reject) =>
    db.exec(sql, (err) => (err ? reject(err) : resolve()))
  );

const SCHEMA = `
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS Manager (
    manager_id  INTEGER PRIMARY KEY AUTOINCREMENT,
    mname       TEXT    NOT NULL
  );

  CREATE TABLE IF NOT EXISTS Admin (
    admin_id    INTEGER PRIMARY KEY AUTOINCREMENT,
    aname       TEXT    NOT NULL,
    password    TEXT    NOT NULL
  );

  CREATE TABLE IF NOT EXISTS Employee (
    employee_id INTEGER PRIMARY KEY AUTOINCREMENT,
    ename       TEXT    NOT NULL
  );

  CREATE TABLE IF NOT EXISTS Customer (
    customer_id  INTEGER PRIMARY KEY AUTOINCREMENT,
    cname        TEXT    NOT NULL,
    email        TEXT    NOT NULL UNIQUE,
    password     TEXT    NOT NULL,
    address      TEXT,
    phone_number TEXT
  );

  CREATE TABLE IF NOT EXISTS Product (
    product_id  INTEGER PRIMARY KEY AUTOINCREMENT,
    pname       TEXT    NOT NULL,
    price       REAL    NOT NULL CHECK (price >= 0)
  );

  CREATE TABLE IF NOT EXISTS "Order" (
    order_id    INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    admin_id    INTEGER,
    order_date  TEXT    NOT NULL DEFAULT (DATE('now')),
    status      TEXT    NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','processing','completed','cancelled')),
    total_price REAL    NOT NULL DEFAULT 0,
    FOREIGN KEY (customer_id) REFERENCES Customer(customer_id) ON DELETE RESTRICT,
    FOREIGN KEY (admin_id)    REFERENCES Admin(admin_id)        ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS OrderItem (
    order_id    INTEGER NOT NULL,
    product_id  INTEGER NOT NULL,
    count       INTEGER NOT NULL CHECK (count > 0),
    PRIMARY KEY (order_id, product_id),
    FOREIGN KEY (order_id)   REFERENCES "Order"(order_id)   ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES Product(product_id) ON DELETE RESTRICT
  );

  CREATE TABLE IF NOT EXISTS Payment (
    payment_id      INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id        INTEGER NOT NULL UNIQUE,
    employee_id     INTEGER,
    amount          REAL    NOT NULL CHECK (amount >= 0),
    payment_method  TEXT    NOT NULL
                            CHECK (payment_method IN ('cash','credit_card','bank_transfer','promptpay')),
    payment_date    TEXT    NOT NULL DEFAULT (DATE('now')),
    FOREIGN KEY (order_id)    REFERENCES "Order"(order_id)     ON DELETE CASCADE,
    FOREIGN KEY (employee_id) REFERENCES Employee(employee_id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS Report (
    report_id   INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id    INTEGER NOT NULL,
    report_date TEXT    NOT NULL DEFAULT (DATE('now')),
    report_type TEXT    NOT NULL,
    FOREIGN KEY (order_id) REFERENCES "Order"(order_id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS Manager_Report (
    manager_id  INTEGER NOT NULL,
    report_id   INTEGER NOT NULL,
    PRIMARY KEY (manager_id, report_id),
    FOREIGN KEY (manager_id) REFERENCES Manager(manager_id) ON DELETE CASCADE,
    FOREIGN KEY (report_id)  REFERENCES Report(report_id)   ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_order_customer  ON "Order"(customer_id);
  CREATE INDEX IF NOT EXISTS idx_order_admin     ON "Order"(admin_id);
  CREATE INDEX IF NOT EXISTS idx_orderitem_order ON OrderItem(order_id);
  CREATE INDEX IF NOT EXISTS idx_payment_order   ON Payment(order_id);
  CREATE INDEX IF NOT EXISTS idx_report_order    ON Report(order_id);
`;

db.exec2(SCHEMA)
  .then(() => console.log('✅  Schema ready'))
  .catch((err) => { console.error('Schema error:', err.message); process.exit(1); });

module.exports = db;
