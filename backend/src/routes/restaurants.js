const router = require('express').Router();
const ctrl = require('../controllers/restaurantController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { validate } = require('../utils/validate');
const asyncHandler = require('../utils/asyncHandler');

router.get('/',          validate(ctrl.listQuerySchema, 'query'), asyncHandler(ctrl.list));
router.get('/me',        requireAuth, requireRole('restaurant'),  asyncHandler(ctrl.getMine));
router.get('/:slug',     asyncHandler(ctrl.getBySlug));
router.get('/:id/stats', requireAuth, requireRole('restaurant','admin'), asyncHandler(ctrl.stats));

router.post(  '/',     requireAuth, requireRole('restaurant'), validate(ctrl.createSchema), asyncHandler(ctrl.create));
router.patch( '/:id',  requireAuth, requireRole('restaurant','admin'), validate(ctrl.updateSchema), asyncHandler(ctrl.update));

module.exports = router;
