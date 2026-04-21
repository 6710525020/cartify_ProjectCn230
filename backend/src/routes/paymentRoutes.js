// src/routes/paymentRoutes.js
const router = require('express').Router();
const ctrl = require('../controllers/paymentController');
const { authenticate, requireRole } = require('../middleware/auth');

router.get('/',       authenticate, requireRole('admin'), ctrl.getAll);
router.get('/:id',    authenticate, ctrl.getOne);
router.post('/',      authenticate, ctrl.create);
router.delete('/:id', authenticate, requireRole('admin'), ctrl.remove);

module.exports = router;
