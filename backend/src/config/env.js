// Centralise la lecture des variables d'environnement.
// Echoue immediatement si une variable critique manque (fail fast).
require('dotenv').config();

const required = [
  'DATABASE_URL',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
];

for (const key of required) {
  if (!process.env[key]) {
    console.error('[env] Missing required env var: ' + key);
    process.exit(1);
  }
}

const isProd = process.env.NODE_ENV === 'production';

module.exports = {
  port: parseInt(process.env.PORT || '4000', 10),
  env: process.env.NODE_ENV || 'development',
  isProd,
  // FRONTEND_URL accepte plusieurs URLs separees par des virgules.
  // Ex: "https://tif.vercel.app,https://www.tif.app"
  frontendUrls: (process.env.FRONTEND_URL || 'http://localhost:3000')
    .split(',').map(function (s) { return s.trim(); }).filter(Boolean),
  databaseUrl: process.env.DATABASE_URL,
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessTtl: process.env.JWT_ACCESS_TTL || '15m',
    refreshTtl: process.env.JWT_REFRESH_TTL || '7d',
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },
  // En prod : cross-origin (vercel.app vs railway.app), donc sameSite=none + secure=true.
  cookies: {
    domain: process.env.COOKIE_DOMAIN || undefined,
    secure: isProd || process.env.COOKIE_SECURE === 'true',
    sameSite: isProd ? 'none' : 'lax',
  },
};
