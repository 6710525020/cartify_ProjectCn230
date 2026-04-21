// src/routes/reportRoutes.js
const router = require('express').Router();
const ctrl = require('../controllers/reportController');
const { authenticate, requireRole } = require('../middleware/auth');

router.get('/',       authenticate, requireRole('admin'), ctrl.getAll);
router.get('/:id',    authenticate, requireRole('admin'), ctrl.getOne);
router.post('/',      authenticate, requireRole('admin'), ctrl.create);
router.delete('/:id', authenticate, requireRole('admin'), ctrl.remove);

module.exports = router;
