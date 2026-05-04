const { z } = require('zod');
const { query } = require('../config/database');
const { NotFound, Forbidden } = require('../utils/errors');
const { geocode } = require('../services/geocoding');

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
  deliveryRadiusKm: z.number().min(0).max(50).default(5),
  // Champs URL : on accepte null et chaine vide en plus de string url valide
  coverImageUrl: z.preprocess(
    (v) => (v === null || v === '' ? undefined : v),
    z.string().url().optional()
  ),
  logoUrl: z.preprocess(
    (v) => (v === null || v === '' ? undefined : v),
    z.string().url().optional()
  ),
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
  // Filtre par distance : si lat/lon fournis et forDelivery=true,
  // on ne renvoie que les restos qui livrent jusqu'a cette position
  clientLat: z.coerce.number().optional(),
  clientLon: z.coerce.number().optional(),
  forDelivery: z.coerce.boolean().optional(),
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
    latitude: r.latitude !== null ? parseFloat(r.latitude) : null,
    longitude: r.longitude !== null ? parseFloat(r.longitude) : null,
    phone: r.phone,
    offersPickup: r.offers_pickup,
    offersDelivery: r.offers_delivery,
    deliveryFeeCents: r.delivery_fee_cents,
    minOrderCents: r.min_order_cents,
    prepTimeMin: r.prep_time_min,
    deliveryRadiusKm: r.delivery_radius_km !== null ? parseFloat(r.delivery_radius_km) : 5,
    isPublished: r.is_published,
    // Distance calculee si filtre client (cf. list)
    distanceKm: r.distance_km !== undefined ? parseFloat(r.distance_km) : undefined,
  };
}

// === GET /api/restaurants ===
async function list(req, res) {
  const { city, cuisine, q, limit, offset, clientLat, clientLon, forDelivery } = req.query;
  const params = [];
  const wheres = ['is_published = TRUE'];

  if (city)    { params.push(city);    wheres.push(`city ILIKE $${params.length}`); }
  if (cuisine) { params.push(cuisine); wheres.push(`cuisine_type = $${params.length}`); }
  if (q)       { params.push(`%${q}%`); wheres.push(`(name ILIKE $${params.length} OR description ILIKE $${params.length})`); }

  // Si on a la position du client, on calcule la distance.
  // Si forDelivery=true, on filtre pour ne garder que les restos qui livrent.
  let selectExtra = '';
  let orderBy = 'created_at DESC';
  if (typeof clientLat === 'number' && typeof clientLon === 'number') {
    params.push(clientLat, clientLon);
    const latParam = `$${params.length - 1}`;
    const lonParam = `$${params.length}`;
    // Formule de Haversine en SQL (km)
    selectExtra = `,
      (
        6371 * 2 * asin(sqrt(
          power(sin(radians(latitude - ${latParam}) / 2), 2) +
          cos(radians(${latParam})) * cos(radians(latitude)) *
          power(sin(radians(longitude - ${lonParam}) / 2), 2)
        ))
      ) AS distance_km`;

    if (forDelivery) {
      // On veut les restos qui font la livraison ET dont le rayon couvre le client
      wheres.push(`offers_delivery = TRUE`);
      wheres.push(`latitude IS NOT NULL AND longitude IS NOT NULL`);
      wheres.push(`(
        6371 * 2 * asin(sqrt(
          power(sin(radians(latitude - ${latParam}) / 2), 2) +
          cos(radians(${latParam})) * cos(radians(latitude)) *
          power(sin(radians(longitude - ${lonParam}) / 2), 2)
        ))
      ) <= delivery_radius_km`);
    }
    orderBy = 'distance_km ASC';
  }

  params.push(limit, offset);
  const sql = `
    SELECT *${selectExtra}
    FROM restaurants
    WHERE ${wheres.join(' AND ')}
    ORDER BY ${orderBy}
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

  // Geocodage automatique de l'adresse pour avoir lat/lon
  const geo = await geocode({
    addressLine: b.addressLine1,
    city: b.city,
    postalCode: b.postalCode,
  });

  const { rows } = await query(
    `INSERT INTO restaurants
     (owner_id, name, slug, description, cuisine_type, address_line1, address_line2,
      city, postal_code, phone, email, offers_pickup, offers_delivery,
      delivery_fee_cents, min_order_cents, prep_time_min,
      delivery_radius_km, latitude, longitude,
      cover_image_url, logo_url)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
     RETURNING *`,
    [
      req.user.id, b.name, slug, b.description || null, b.cuisineType || null,
      b.addressLine1, b.addressLine2 || null, b.city, b.postalCode,
      b.phone || null, b.email || null,
      b.offersPickup, b.offersDelivery,
      b.deliveryFeeCents, b.minOrderCents, b.prepTimeMin,
      b.deliveryRadiusKm,
      geo?.lat || null, geo?.lon || null,
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
    prepTimeMin: 'prep_time_min', deliveryRadiusKm: 'delivery_radius_km',
    coverImageUrl: 'cover_image_url',
    logoUrl: 'logo_url', isPublished: 'is_published',
  };
  const sets = []; const values = [];
  for (const [k, col] of Object.entries(map)) {
    if (b[k] !== undefined) { values.push(b[k]); sets.push(`${col} = $${values.length}`); }
  }

  // Si l'adresse change, re-geocoder pour recalculer lat/lon
  if (b.addressLine1 !== undefined || b.city !== undefined || b.postalCode !== undefined) {
    // On a besoin de l'adresse complete pour geocoder
    const { rows: [current] } = await query('SELECT address_line1, city, postal_code FROM restaurants WHERE id = $1', [req.params.id]);
    const geo = await geocode({
      addressLine: b.addressLine1 ?? current.address_line1,
      city: b.city ?? current.city,
      postalCode: b.postalCode ?? current.postal_code,
    });
    if (geo) {
      values.push(geo.lat); sets.push(`latitude = $${values.length}`);
      values.push(geo.lon); sets.push(`longitude = $${values.length}`);
    }
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
