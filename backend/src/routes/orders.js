const router = require('express').Router();
const ctrl = require('../controllers/orderController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { validate } = require('../utils/validate');
const asyncHandler = require('../utils/asyncHandler');

router.post('/', requireAuth, requireRole('client'), validate(ctrl.createOrderSchema), asyncHandler(ctrl.create));
router.get('/me', requireAuth, asyncHandler(ctrl.listMine));
router.get('/restaurant/:restaurantId', requireAuth, requireRole('restaurant','admin'), asyncHandler(ctrl.listForRestaurant));
router.get('/:id', requireAuth, asyncHandler(ctrl.getOne));
router.patch('/:id/status', requireAuth, requireRole('restaurant','admin'), validate(ctrl.updateStatusSchema), asyncHandler(ctrl.updateStatus));

module.exports = router;
