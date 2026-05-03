// Pool PostgreSQL partage.
// Helper query + withTransaction pour les flows multi-requetes.
const { Pool } = require('pg');
const env = require('./env');

// Neon, Supabase, Render Postgres exigent SSL.
// On l'active automatiquement quand l'URL contient sslmode=require
// ou quand on est en production (par securite).
const useSSL = env.isProd || /sslmode=require/i.test(env.databaseUrl);

const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl: useSSL ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', function (err) {
  console.error('[pg] unexpected client error', err);
});

async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  if (env.env === 'development') {
    const ms = Date.now() - start;
    if (ms > 50) console.log('[pg] ' + ms + 'ms - ' + text.split('\n')[0].slice(0, 80));
  }
  return res;
}

// Execute une fonction async dans une transaction. Rollback auto sur erreur.
async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { pool, query, withTransaction };
