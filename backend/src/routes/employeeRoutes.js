// src/routes/employeeRoutes.js
const router = require('express').Router();
const ctrl = require('../controllers/employeeController');
const { authenticate, requireRole } = require('../middleware/auth');

router.get('/',       authenticate, requireRole('admin'), ctrl.getAll);
router.get('/:id',    authenticate, requireRole('admin'), ctrl.getOne);
router.post('/',      authenticate, requireRole('admin'), ctrl.create);
router.put('/:id',    authenticate, requireRole('admin'), ctrl.update);
router.delete('/:id', authenticate, requireRole('admin'), ctrl.remove);

module.exports = router;
