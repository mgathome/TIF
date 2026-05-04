const bcrypt = require('bcrypt');
const { z } = require('zod');
const { query } = require('../config/database');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { Unauthorized, Conflict } = require('../utils/errors');
const env = require('../config/env');
const { geocode } = require('../services/geocoding');

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
    address: u.address_line1 ? {
      line1: u.address_line1,
      line2: u.address_line2 || null,
      city: u.city,
      postalCode: u.postal_code,
      country: u.country,
    } : null,
    latitude:  u.latitude  !== undefined && u.latitude  !== null ? parseFloat(u.latitude)  : null,
    longitude: u.longitude !== undefined && u.longitude !== null ? parseFloat(u.longitude) : null,
  };
}

const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(80).optional(),
  lastName:  z.string().min(1).max(80).optional(),
  phone:     z.string().max(30).optional(),
  addressLine1: z.string().max(200).optional(),
  addressLine2: z.string().max(200).optional(),
  city:         z.string().max(120).optional(),
  postalCode:   z.string().max(20).optional(),
});

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
    `SELECT id, email, role, first_name, last_name, phone,
            address_line1, address_line2, city, postal_code, country, latitude, longitude
     FROM users WHERE id = $1`,
    [req.user.id]
  );
  if (rows.length === 0) throw new Unauthorized();
  res.json({ user: publicUser(rows[0]) });
}

// PATCH /api/auth/me - mise a jour du profil + adresse (avec geocodage auto)
async function updateMe(req, res) {
  const b = req.body;
  const map = {
    firstName: 'first_name',
    lastName:  'last_name',
    phone:     'phone',
    addressLine1: 'address_line1',
    addressLine2: 'address_line2',
    city:         'city',
    postalCode:   'postal_code',
  };
  const sets = []; const values = [];
  for (const [k, col] of Object.entries(map)) {
    if (b[k] !== undefined) { values.push(b[k] || null); sets.push(`${col} = $${values.length}`); }
  }

  // Si l'adresse est touchee, on (re-)geocode
  if (b.addressLine1 !== undefined || b.city !== undefined || b.postalCode !== undefined) {
    const { rows: [current] } = await query(
      'SELECT address_line1, city, postal_code FROM users WHERE id = $1',
      [req.user.id]
    );
    const finalLine = b.addressLine1 ?? current.address_line1;
    const finalCity = b.city ?? current.city;
    const finalPostal = b.postalCode ?? current.postal_code;
    if (finalLine && finalCity && finalPostal) {
      const geo = await geocode({
        addressLine: finalLine, city: finalCity, postalCode: finalPostal,
      });
      if (geo) {
        values.push(geo.lat); sets.push(`latitude = $${values.length}`);
        values.push(geo.lon); sets.push(`longitude = $${values.length}`);
      }
    }
  }

  if (sets.length === 0) return res.json({ user: publicUser((await query('SELECT * FROM users WHERE id = $1', [req.user.id])).rows[0]) });

  values.push(req.user.id);
  const { rows } = await query(
    `UPDATE users SET ${sets.join(', ')} WHERE id = $${values.length}
     RETURNING id, email, role, first_name, last_name, phone, address_line1, address_line2, city, postal_code, country, latitude, longitude`,
    values
  );
  res.json({ user: publicUser(rows[0]) });
}

module.exports = { register, login, refresh, logout, me, updateMe, registerSchema, loginSchema, updateProfileSchema };
