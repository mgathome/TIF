const router = require('express').Router();
const ctrl = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');
const { validate } = require('../utils/validate');
const asyncHandler = require('../utils/asyncHandler');

router.post ('/register', validate(ctrl.registerSchema), asyncHandler(ctrl.register));
router.post ('/login',    validate(ctrl.loginSchema),    asyncHandler(ctrl.login));
router.post ('/refresh',  asyncHandler(ctrl.refresh));
router.post ('/logout',   asyncHandler(ctrl.logout));
router.get  ('/me',       requireAuth, asyncHandler(ctrl.me));
router.patch('/me',       requireAuth, validate(ctrl.updateProfileSchema), asyncHandler(ctrl.updateMe));

module.exports = router;
