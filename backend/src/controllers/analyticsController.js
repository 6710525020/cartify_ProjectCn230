const db = require('../db/database');

async function orderSummaryByStatus(req, res, next) {
  try {
    const rows = await db.all2(`
      SELECT
        o.status,
        COUNT(o.order_id)            AS total_orders,
        ROUND(SUM(o.total_price), 2) AS total_revenue,
        ROUND(AVG(o.total_price), 2) AS avg_order_value
      FROM "Order" o
      GROUP BY o.status
      ORDER BY total_revenue DESC
    `);

    const grandTotal = await db.get2(`
      SELECT
        COUNT(*)            AS all_orders,
        ROUND(SUM(total_price), 2) AS all_revenue
      FROM "Order"
    `);

    res.json({ by_status: rows, grand_total: grandTotal });
  } catch (err) { next(err); }
}

async function topSellingProducts(req, res, next) {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const rows = await db.all2(`
      SELECT
        p.product_id,
        p.pname,
        p.price,
        SUM(oi.count)                        AS total_sold,
        COUNT(DISTINCT oi.order_id)          AS orders_count,
        ROUND(SUM(oi.count * p.price), 2)    AS total_revenue
      FROM Product p
      JOIN OrderItem oi ON oi.product_id = p.product_id
      JOIN "Order"   o  ON o.order_id    = oi.order_id
      WHERE o.status != 'cancelled'
      GROUP BY p.product_id, p.pname, p.price
      HAVING total_sold > 0
      ORDER BY total_sold DESC
      LIMIT ?
    `, [limit]);
    res.json(rows);
  } catch (err) { next(err); }
}


async function customerPurchaseSummary(req, res, next) {
  try {
    const rows = await db.all2(`
      SELECT
        c.customer_id,
        c.cname,
        c.email,
        COUNT(o.order_id)             AS total_orders,
        COALESCE(ROUND(SUM(
          CASE WHEN o.status != 'cancelled' THEN o.total_price ELSE 0 END
        ), 2), 0)                     AS total_spent,
        SUM(CASE WHEN o.status = 'pending'    THEN 1 ELSE 0 END) AS pending_orders,
        SUM(CASE WHEN o.status = 'completed'  THEN 1 ELSE 0 END) AS completed_orders,
        MAX(o.order_date)             AS last_order_date
      FROM Customer c
      LEFT JOIN "Order" o ON o.customer_id = c.customer_id
      GROUP BY c.customer_id, c.cname, c.email
      ORDER BY total_spent DESC
    `);
    res.json(rows);
  } catch (err) { next(err); }
}

async function unpaidOrders(req, res, next) {
  try {
    const rows = await db.all2(`
      SELECT
        o.order_id,
        o.order_date,
        o.status,
        o.total_price,
        c.cname          AS customer_name,
        c.email          AS customer_email,
        c.phone_number,
        COUNT(oi.product_id) AS item_types
      FROM "Order" o
      JOIN Customer c   ON c.customer_id = o.customer_id
      LEFT JOIN OrderItem oi ON oi.order_id = o.order_id
      WHERE o.status NOT IN ('cancelled', 'completed')
        AND NOT EXISTS (
          SELECT 1 FROM Payment p WHERE p.order_id = o.order_id
        )
      GROUP BY o.order_id
      ORDER BY o.order_date ASC
    `);

    const summary = await db.get2(`
      SELECT
        COUNT(*)                     AS unpaid_count,
        ROUND(SUM(o.total_price), 2) AS unpaid_total
      FROM "Order" o
      WHERE o.status NOT IN ('cancelled','completed')
        AND NOT EXISTS (SELECT 1 FROM Payment p WHERE p.order_id = o.order_id)
    `);

    res.json({ summary, orders: rows });
  } catch (err) { next(err); }
}

async function revenueTrend(req, res, next) {
  try {
    const mode   = req.query.mode === 'monthly' ? '%Y-%m' : '%Y-%m-%d';
    const label  = req.query.mode === 'monthly' ? 'month' : 'date';
    const limit  = parseInt(req.query.limit) || 30;

    const rows = await db.all2(`
      SELECT
        strftime('${mode}', p.payment_date)  AS ${label},
        COUNT(p.payment_id)                  AS transactions,
        ROUND(SUM(p.amount), 2)              AS revenue,
        ROUND(AVG(p.amount), 2)              AS avg_transaction
      FROM Payment p
      JOIN "Order" o ON o.order_id = p.order_id
      WHERE o.status = 'completed'
      GROUP BY strftime('${mode}', p.payment_date)
      ORDER BY ${label} DESC
      LIMIT ?
    `, [limit]);

    res.json(rows);
  } catch (err) { next(err); }
}

async function adminPerformance(req, res, next) {
  try {
    const rows = await db.all2(`
      SELECT
        a.admin_id,
        a.aname,
        COUNT(o.order_id)    AS total_managed,
        SUM(CASE WHEN o.status = 'completed'  THEN 1 ELSE 0 END) AS completed,
        SUM(CASE WHEN o.status = 'cancelled'  THEN 1 ELSE 0 END) AS cancelled,
        SUM(CASE WHEN o.status = 'pending'    THEN 1 ELSE 0 END) AS pending,
        ROUND(SUM(CASE WHEN o.status = 'completed' THEN o.total_price ELSE 0 END), 2)
                             AS revenue_managed,
        ROUND(
          100.0 * SUM(CASE WHEN o.status = 'completed' THEN 1 ELSE 0 END)
          / COUNT(o.order_id), 1
        )                    AS completion_rate_pct
      FROM Admin a
      JOIN "Order" o ON o.admin_id = a.admin_id
      GROUP BY a.admin_id, a.aname
      HAVING total_managed > 0
      ORDER BY revenue_managed DESC
    `);
    res.json(rows);
  } catch (err) { next(err); }
}

async function searchOrders(req, res, next) {
  try {
    const { status, customer_id, from_date, to_date } = req.query;

    const conditions = [];
    const params     = [];

    if (status)      { conditions.push(`o.status = ?`);         params.push(status); }
    if (customer_id) { conditions.push(`o.customer_id = ?`);    params.push(customer_id); }
    if (from_date)   { conditions.push(`o.order_date >= ?`);    params.push(from_date); }
    if (to_date)     { conditions.push(`o.order_date <= ?`);    params.push(to_date); }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    const rows = await db.all2(`
      SELECT
        o.order_id,
        o.order_date,
        o.status,
        o.total_price,
        c.cname            AS customer_name,
        c.phone_number,
        a.aname            AS admin_name,
        p.payment_method,
        p.payment_date,
        (
          SELECT COUNT(*) FROM OrderItem oi WHERE oi.order_id = o.order_id
        )                  AS item_count
      FROM "Order" o
      JOIN  Customer c ON c.customer_id = o.customer_id
      LEFT JOIN Admin   a ON a.admin_id    = o.admin_id
      LEFT JOIN Payment p ON p.order_id    = o.order_id
      ${where}
      ORDER BY o.order_date DESC
    `, params);

    res.json({ count: rows.length, orders: rows });
  } catch (err) { next(err); }
}

module.exports = {
  orderSummaryByStatus,
  topSellingProducts,
  customerPurchaseSummary,
  unpaidOrders,
  revenueTrend,
  adminPerformance,
  searchOrders,
};