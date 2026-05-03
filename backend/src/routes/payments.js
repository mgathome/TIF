const router = require('express').Router();
const ctrl = require('../controllers/paymentController');
const { requireAuth } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

// /webhook est déclaré directement dans server.js (avant le json parser)
router.get('/order/:orderId', requireAuth, asyncHandler(ctrl.getForOrder));

module.exports = router;
