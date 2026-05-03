const { z } = require('zod');
const { query } = require('../config/database');
const { NotFound, Forbidden } = require('../utils/errors');

// === Schemas ===
const createSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(2000).optional(),
  cuisineType: z.string().max(80).optional(),
  addressLine1: z.string().min(1).max(200),
  addressLine2: z.string().max(200).optional(),
  city: z.string().min(1).max(120),
  postalCode: z.string().min(1).max(20),
  phone: z.string().max(30).optional(),
  email: z.string().email().optional(),
  offersPickup: z.boolean().default(true),
  offersDelivery: z.boolean().default(false),
  deliveryFeeCents: z.number().int().nonnegative().default(0),
  minOrderCents: z.number().int().nonnegative().default(0),
  prepTimeMin: z.number().int().positive().default(20),
  coverImageUrl: z.string().url().optional(),
  logoUrl: z.string().url().optional(),
});

const updateSchema = createSchema.partial().extend({
  isPublished: z.boolean().optional(),
});

const listQuerySchema = z.object({
  city: z.string().optional(),
  cuisine: z.string().optional(),
  q: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

// === Helpers ===
function slugify(s) {
  return s.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    .slice(0, 140);
}

function rowToPublic(r) {
  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    description: r.description,
    cuisineType: r.cuisine_type,
    coverImageUrl: r.cover_image_url,
    logoUrl: r.logo_url,
    address: {
      line1: r.address_line1, line2: r.address_line2,
      city: r.city, postalCode: r.postal_code, country: r.country,
    },
    phone: r.phone,
    offersPickup: r.offers_pickup,
    offersDelivery: r.offers_delivery,
    deliveryFeeCents: r.delivery_fee_cents,
    minOrderCents: r.min_order_cents,
    prepTimeMin: r.prep_time_min,
    isPublished: r.is_published,
  };
}

// === GET /api/restaurants ===
async function list(req, res) {
  const { city, cuisine, q, limit, offset } = req.query;
  const params = [];
  const wheres = ['is_published = TRUE'];

  if (city)    { params.push(city);    wheres.push(`city ILIKE $${params.length}`); }
  if (cuisine) { params.push(cuisine); wheres.push(`cuisine_type = $${params.length}`); }
  if (q)       { params.push(`%${q}%`); wheres.push(`(name ILIKE $${params.length} OR description ILIKE $${params.length})`); }

  params.push(limit, offset);
  const sql = `
    SELECT * FROM restaurants
    WHERE ${wheres.join(' AND ')}
    ORDER BY created_at DESC
    LIMIT $${params.length - 1} OFFSET $${params.length}
  `;
  const { rows } = await query(sql, params);
  res.json({ items: rows.map(rowToPublic), limit, offset });
}

// === GET /api/restaurants/:slug ===
async function getBySlug(req, res) {
  const { rows } = await query(
    'SELECT * FROM restaurants WHERE slug = $1 AND is_published = TRUE',
    [req.params.slug]
  );
  if (rows.length === 0) throw new NotFound('Restaurant not found');
  res.json({ restaurant: rowToPublic(rows[0]) });
}

// === GET /api/restaurants/me  (mon resto, owner) ===
async function getMine(req, res) {
  const { rows } = await query(
    'SELECT * FROM restaurants WHERE owner_id = $1 ORDER BY created_at DESC LIMIT 1',
    [req.user.id]
  );
  if (rows.length === 0) return res.json({ restaurant: null });
  res.json({ restaurant: rowToPublic(rows[0]) });
}

// === POST /api/restaurants ===
async function create(req, res) {
  const b = req.body;
  let slug = slugify(b.name);
  // collisions : suffixe -2, -3, ...
  let suffix = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const exists = await query('SELECT 1 FROM restaurants WHERE slug = $1', [slug]);
    if (exists.rowCount === 0) break;
    suffix += 1;
    slug = `${slugify(b.name)}-${suffix}`;
  }

  const { rows } = await query(
    `INSERT INTO restaurants
     (owner_id, name, slug, description, cuisine_type, address_line1, address_line2,
      city, postal_code, phone, email, offers_pickup, offers_delivery,
      delivery_fee_cents, min_order_cents, prep_time_min, cover_image_url, logo_url)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
     RETURNING *`,
    [
      req.user.id, b.name, slug, b.description || null, b.cuisineType || null,
      b.addressLine1, b.addressLine2 || null, b.city, b.postalCode,
      b.phone || null, b.email || null,
      b.offersPickup, b.offersDelivery,
      b.deliveryFeeCents, b.minOrderCents, b.prepTimeMin,
      b.coverImageUrl || null, b.logoUrl || null,
    ]
  );
  res.status(201).json({ restaurant: rowToPublic(rows[0]) });
}

// === PATCH /api/restaurants/:id ===
async function update(req, res) {
  const { rows: existing } = await query('SELECT owner_id FROM restaurants WHERE id = $1', [req.params.id]);
  if (existing.length === 0) throw new NotFound();
  if (existing[0].owner_id !== req.user.id && req.user.role !== 'admin') {
    throw new Forbidden();
  }

  const b = req.body;
  const map = {
    name: 'name', description: 'description', cuisineType: 'cuisine_type',
    addressLine1: 'address_line1', addressLine2: 'address_line2',
    city: 'city', postalCode: 'postal_code', phone: 'phone', email: 'email',
    offersPickup: 'offers_pickup', offersDelivery: 'offers_delivery',
    deliveryFeeCents: 'delivery_fee_cents', minOrderCents: 'min_order_cents',
    prepTimeMin: 'prep_time_min', coverImageUrl: 'cover_image_url',
    logoUrl: 'logo_url', isPublished: 'is_published',
  };
  const sets = []; const values = [];
  for (const [k, col] of Object.entries(map)) {
    if (b[k] !== undefined) { values.push(b[k]); sets.push(`${col} = $${values.length}`); }
  }
  if (sets.length === 0) return res.status(400).json({ error: 'No fields to update' });

  values.push(req.params.id);
  const { rows } = await query(
    `UPDATE restaurants SET ${sets.join(', ')} WHERE id = $${values.length} RETURNING *`,
    values
  );
  res.json({ restaurant: rowToPublic(rows[0]) });
}

// === GET /api/restaurants/:id/stats  (dashboard) ===
async function stats(req, res) {
  const { rows: own } = await query('SELECT owner_id FROM restaurants WHERE id = $1', [req.params.id]);
  if (own.length === 0) throw new NotFound();
  if (own[0].owner_id !== req.user.id && req.user.role !== 'admin') throw new Forbidden();

  const today = await query(
    `SELECT
       COUNT(*) FILTER (WHERE status NOT IN ('pending','cancelled'))::int AS orders_today,
       COALESCE(SUM(total_cents) FILTER (WHERE status NOT IN ('pending','cancelled')), 0)::int AS revenue_today_cents
     FROM orders
     WHERE restaurant_id = $1 AND created_at >= CURRENT_DATE`,
    [req.params.id]
  );

  const week = await query(
    `SELECT
       COUNT(*) FILTER (WHERE status NOT IN ('pending','cancelled'))::int AS orders_week,
       COALESCE(SUM(total_cents) FILTER (WHERE status NOT IN ('pending','cancelled')), 0)::int AS revenue_week_cents
     FROM orders
     WHERE restaurant_id = $1 AND created_at >= CURRENT_DATE - INTERVAL '7 days'`,
    [req.params.id]
  );

  const pending = await query(
    `SELECT COUNT(*)::int AS count FROM orders
     WHERE restaurant_id = $1 AND status IN ('paid','preparing')`,
    [req.params.id]
  );

  res.json({
    today: today.rows[0],
    week:  week.rows[0],
    activeOrders: pending.rows[0].count,
  });
}

module.exports = {
  list, getBySlug, getMine, create, update, stats,
  createSchema, updateSchema, listQuerySchema,
};
