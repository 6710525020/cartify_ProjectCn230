// src/routes/productRoutes.js
const router = require('express').Router();
const ctrl = require('../controllers/productController');
const { authenticate, requireRole } = require('../middleware/auth');

router.get('/',       ctrl.getAll);
router.get('/:id',    ctrl.getOne);
router.post('/',      authenticate, requireRole('admin'), ctrl.create);
router.put('/:id',    authenticate, requireRole('admin'), ctrl.update);
router.delete('/:id', authenticate, requireRole('admin'), ctrl.remove);

module.exports = router;
