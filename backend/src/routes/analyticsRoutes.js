const router = require('express').Router();
const ctrl   = require('../controllers/analyticsController');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate, requireRole('admin'));

router.get('/order-summary',          ctrl.orderSummaryByStatus);

router.get('/top-products',           ctrl.topSellingProducts);

router.get('/customer-summary',       ctrl.customerPurchaseSummary);

router.get('/unpaid-orders',          ctrl.unpaidOrders);

router.get('/revenue-trend',          ctrl.revenueTrend);

router.get('/admin-performance',      ctrl.adminPerformance);

router.get('/search-orders',          ctrl.searchOrders);

module.exports = router;