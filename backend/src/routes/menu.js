const router = require('express').Router();
const ctrl = require('../controllers/menuController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { validate } = require('../utils/validate');
const asyncHandler = require('../utils/asyncHandler');

// Public
router.get('/restaurant/:restaurantId',     asyncHandler(ctrl.listForRestaurant));

// Owner only
router.get('/restaurant/:restaurantId/all', requireAuth, requireRole('restaurant','admin'), asyncHandler(ctrl.listAllForOwner));
router.post('/restaurant/:restaurantId',    requireAuth, requireRole('restaurant'), validate(ctrl.itemSchema), asyncHandler(ctrl.create));
router.patch('/:itemId',  requireAuth, requireRole('restaurant','admin'), validate(ctrl.updateItemSchema), asyncHandler(ctrl.update));
router.delete('/:itemId', requireAuth, requireRole('restaurant','admin'), asyncHandler(ctrl.remove));

module.exports = router;
