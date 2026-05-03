#!/usr/bin/env node
/**
 * Migrate runner — exécute les fichiers SQL du dossier migrations/
 * dans l'ordre, en sautant ceux déjà appliqués (suivi dans la table _migrations).
 *
 * Usage :
 *   node scripts/migrate.js
 *   node scripts/migrate.js --seed   # applique aussi 002_seed.sql
 *
 * En production sur Railway, on enchaîne `npm run migrate && npm start`.
 */
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const MIGRATIONS_DIR = path.resolve(__dirname, '..', 'migrations');
const SHOULD_SEED = process.argv.includes('--seed');

const useSSL = process.env.NODE_ENV === 'production' || /sslmode=require/i.test(process.env.DATABASE_URL || '');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSSL ? { rejectUnauthorized: false } : false,
});

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

async function applied() {
  const { rows } = await pool.query('SELECT filename FROM _migrations');
  return new Set(rows.map((r) => r.filename));
}

async function applyFile(filename) {
  const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, filename), 'utf8');
  console.log(`[migrate] applying ${filename}`);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('INSERT INTO _migrations (filename) VALUES ($1)', [filename]);
    await client.query('COMMIT');
    console.log(`[migrate] ✓ ${filename}`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('[migrate] DATABASE_URL missing');
    process.exit(1);
  }

  await ensureTable();
  const done = await applied();

  // Liste les .sql triés ; on saute le seed sauf si --seed
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .filter((f) => SHOULD_SEED || !f.includes('seed'))
    .sort();

  let applied_count = 0;
  for (const f of files) {
    if (done.has(f)) {
      console.log(`[migrate] skip ${f} (already applied)`);
      continue;
    }
    await applyFile(f);
    applied_count++;
  }

  console.log(`[migrate] done. ${applied_count} new migration(s) applied.`);
  await pool.end();
}

main().catch((err) => {
  console.error('[migrate] FAILED', err);
  process.exit(1);
});
