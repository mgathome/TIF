const { z } = require('zod');
const { query } = require('../config/database');
const { NotFound, Forbidden } = require('../utils/errors');

const itemSchema = z.object({
  name: z.string().min(1).max(140),
  description: z.string().max(2000).optional(),
  category: z.string().max(80).optional(),
  priceCents: z.number().int().nonnegative(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  isAvailable: z.boolean().default(true),
  isVegetarian: z.boolean().default(false),
  isVegan: z.boolean().default(false),
  isGlutenFree: z.boolean().default(false),
  allergens: z.array(z.string()).default([]),
  displayOrder: z.number().int().default(0),
});

const updateItemSchema = itemSchema.partial();

function rowToItem(r) {
  return {
    id: r.id,
    restaurantId: r.restaurant_id,
    name: r.name,
    description: r.description,
    category: r.category,
    priceCents: r.price_cents,
    imageUrl: r.image_url,
    isAvailable: r.is_available,
    isVegetarian: r.is_vegetarian,
    isVegan: r.is_vegan,
    isGlutenFree: r.is_gluten_free,
    allergens: r.allergens || [],
    displayOrder: r.display_order,
  };
}

async function assertOwnership(restaurantId, userId, role) {
  const { rows } = await query('SELECT owner_id FROM restaurants WHERE id = $1', [restaurantId]);
  if (rows.length === 0) throw new NotFound('Restaurant not found');
  if (rows[0].owner_id !== userId && role !== 'admin') throw new Forbidden();
}

// === GET /api/menu/restaurant/:restaurantId ===
async function listForRestaurant(req, res) {
  const { rows } = await query(
    `SELECT * FROM menu_items
     WHERE restaurant_id = $1 AND is_available = TRUE
     ORDER BY display_order ASC, name ASC`,
    [req.params.restaurantId]
  );
  res.json({ items: rows.map(rowToItem) });
}

// === GET /api/menu/restaurant/:restaurantId/all  (incluant indispos, owner only) ===
async function listAllForOwner(req, res) {
  await assertOwnership(req.params.restaurantId, req.user.id, req.user.role);
  const { rows } = await query(
    'SELECT * FROM menu_items WHERE restaurant_id = $1 ORDER BY display_order ASC, name ASC',
    [req.params.restaurantId]
  );
  res.json({ items: rows.map(rowToItem) });
}

// === POST /api/menu/restaurant/:restaurantId ===
async function create(req, res) {
  await assertOwnership(req.params.restaurantId, req.user.id, req.user.role);
  const b = req.body;
  const { rows } = await query(
    `INSERT INTO menu_items
     (restaurant_id, name, description, category, price_cents, image_url,
      is_available, is_vegetarian, is_vegan, is_gluten_free, allergens, display_order)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     RETURNING *`,
    [
      req.params.restaurantId, b.name, b.description || null, b.category || null,
      b.priceCents, b.imageUrl || null, b.isAvailable,
      b.isVegetarian, b.isVegan, b.isGlutenFree, b.allergens, b.displayOrder,
    ]
  );
  res.status(201).json({ item: rowToItem(rows[0]) });
}

// === PATCH /api/menu/:itemId ===
async function update(req, res) {
  const { rows: existing } = await query(
    'SELECT m.*, r.owner_id FROM menu_items m JOIN restaurants r ON r.id = m.restaurant_id WHERE m.id = $1',
    [req.params.itemId]
  );
  if (existing.length === 0) throw new NotFound();
  if (existing[0].owner_id !== req.user.id && req.user.role !== 'admin') throw new Forbidden();

  const b = req.body;
  const map = {
    name: 'name', description: 'description', category: 'category',
    priceCents: 'price_cents', imageUrl: 'image_url', isAvailable: 'is_available',
    isVegetarian: 'is_vegetarian', isVegan: 'is_vegan', isGlutenFree: 'is_gluten_free',
    allergens: 'allergens', displayOrder: 'display_order',
  };
  const sets = []; const values = [];
  for (const [k, col] of Object.entries(map)) {
    if (b[k] !== undefined) { values.push(b[k]); sets.push(`${col} = $${values.length}`); }
  }
  if (sets.length === 0) return res.status(400).json({ error: 'No fields to update' });
  values.push(req.params.itemId);

  const { rows } = await query(
    `UPDATE menu_items SET ${sets.join(', ')} WHERE id = $${values.length} RETURNING *`,
    values
  );
  res.json({ item: rowToItem(rows[0]) });
}

// === DELETE /api/menu/:itemId ===
async function remove(req, res) {
  const { rows: existing } = await query(
    'SELECT m.id, r.owner_id FROM menu_items m JOIN restaurants r ON r.id = m.restaurant_id WHERE m.id = $1',
    [req.params.itemId]
  );
  if (existing.length === 0) throw new NotFound();
  if (existing[0].owner_id !== req.user.id && req.user.role !== 'admin') throw new Forbidden();

  // soft-disable plutôt que delete : préserve les commandes passées
  await query('UPDATE menu_items SET is_available = FALSE WHERE id = $1', [req.params.itemId]);
  res.status(204).end();
}

module.exports = { listForRestaurant, listAllForOwner, create, update, remove, itemSchema, updateItemSchema };
