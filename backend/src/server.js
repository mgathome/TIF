const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const env = require('./config/env');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const restaurantRoutes = require('./routes/restaurants');
const menuRoutes = require('./routes/menu');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payments');
const { stripeWebhookHandler } = require('./controllers/paymentController');

const app = express();

if (env.isProd) app.set('trust proxy', 1);

app.use(helmet({
  hsts: env.isProd ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (env.frontendUrls.includes(origin)) return cb(null, true);
    cb(new Error('CORS blocked: ' + origin));
  },
  credentials: true,
}));

app.use(morgan(env.isProd ? 'combined' : 'dev'));
app.use(cookieParser());

app.post(
  '/api/payments/webhook',
  express.raw({ type: 'application/json' }),
  stripeWebhookHandler
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) => res.json({ status: 'ok', env: env.env }));
app.get('/', (_req, res) => res.json({ name: 'tif-api', status: 'ok' }));

const authLimiter = rateLimit({
  windowMs: 15 * 60000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);

app.use(notFound);
app.use(errorHandler);

const server = app.listen(env.port, () => {
  console.log('[tif] API listening on port ' + env.port + ' (' + env.env + ')');
});

['SIGTERM', 'SIGINT'].forEach((sig) => {
  process.on(sig, () => {
    console.log('[tif] ' + sig + ' received, shutting down');
    server.close(() => process.exit(0));
  });
});
