const bcrypt = require('bcrypt');
const { z } = require('zod');
const { query } = require('../config/database');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { Unauthorized, Conflict } = require('../utils/errors');
const env = require('../config/env');

const BCRYPT_ROUNDS = 12;

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  role: z.enum(['client', 'restaurant']).default('client'),
  phone: z.string().max(30).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function publicUser(u) {
  return {
    id: u.id, email: u.email, role: u.role,
    firstName: u.first_name, lastName: u.last_name, phone: u.phone,
  };
}

function setRefreshCookie(res, token) {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    sameSite: env.cookies.sameSite,
    secure: env.cookies.secure,
    domain: env.cookies.domain,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/api/auth',
  });
}

async function register(req, res) {
  const { email, password, firstName, lastName, role, phone } = req.body;

  const existing = await query('SELECT 1 FROM users WHERE email = $1', [email]);
  if (existing.rowCount > 0) throw new Conflict('Email already in use');

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const { rows } = await query(
    'INSERT INTO users (email, password_hash, role, first_name, last_name, phone) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, role, first_name, last_name, phone',
    [email, passwordHash, role, firstName, lastName, phone || null]
  );
  const user = rows[0];

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  await query('UPDATE users SET refresh_token = $1 WHERE id = $2', [refreshToken, user.id]);

  setRefreshCookie(res, refreshToken);
  res.status(201).json({ user: publicUser(user), accessToken });
}

async function login(req, res) {
  const { email, password } = req.body;
  const { rows } = await query(
    'SELECT id, email, role, password_hash, first_name, last_name, phone FROM users WHERE email = $1',
    [email]
  );
  const user = rows[0];
  if (!user) throw new Unauthorized('Invalid credentials');

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) throw new Unauthorized('Invalid credentials');

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  await query('UPDATE users SET refresh_token = $1 WHERE id = $2', [refreshToken, user.id]);

  setRefreshCookie(res, refreshToken);
  res.json({ user: publicUser(user), accessToken });
}

async function refresh(req, res) {
  const token = req.cookies.refreshToken;
  if (!token) throw new Unauthorized('Missing refresh token');

  let payload;
  try { payload = verifyRefreshToken(token); }
  catch (e) { throw new Unauthorized('Invalid refresh token'); }

  const { rows } = await query(
    'SELECT id, email, role, refresh_token, first_name, last_name FROM users WHERE id = $1',
    [payload.sub]
  );
  const user = rows[0];
  if (!user || user.refresh_token !== token) {
    throw new Unauthorized('Refresh token revoked');
  }

  const newRefresh = signRefreshToken(user);
  const newAccess = signAccessToken(user);
  await query('UPDATE users SET refresh_token = $1 WHERE id = $2', [newRefresh, user.id]);

  setRefreshCookie(res, newRefresh);
  res.json({ accessToken: newAccess, user: publicUser(user) });
}

async function logout(req, res) {
  const token = req.cookies.refreshToken;
  if (token) {
    try {
      const payload = verifyRefreshToken(token);
      await query('UPDATE users SET refresh_token = NULL WHERE id = $1', [payload.sub]);
    } catch (e) { /* ignore */ }
  }
  res.clearCookie('refreshToken', { path: '/api/auth' });
  res.status(204).end();
}

async function me(req, res) {
  const { rows } = await query(
    'SELECT id, email, role, first_name, last_name, phone FROM users WHERE id = $1',
    [req.user.id]
  );
  if (rows.length === 0) throw new Unauthorized();
  res.json({ user: publicUser(rows[0]) });
}

module.exports = { register, login, refresh, logout, me, registerSchema, loginSchema };
