// src/routes/adminRoutes.js
const router = require('express').Router();
const ctrl = require('../controllers/adminController');
const { authenticate, requireRole } = require('../middleware/auth');

router.post('/login',  ctrl.login);
router.get('/',        authenticate, requireRole('admin'), ctrl.getAll);
router.get('/:id',     authenticate, requireRole('admin'), ctrl.getOne);
router.post('/',       authenticate, requireRole('admin'), ctrl.create);
router.delete('/:id',  authenticate, requireRole('admin'), ctrl.remove);

module.exports = router;
