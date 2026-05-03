-- =====================================================================
-- TIF — Seed de démo (à n'exécuter qu'en dev)
-- Mots de passe : "password123" (hash bcrypt)
-- =====================================================================

-- Utilisateur client
INSERT INTO users (id, email, password_hash, role, first_name, last_name)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'client@tif.test',
  '$2b$12$KIXxPfp1A1oQUyGZhCwGn.VG8sQ0pjkz4oKXqQbN9V4y0zFxqJj1S',
  'client', 'Alice', 'Martin'
);

-- Propriétaire restaurant
INSERT INTO users (id, email, password_hash, role, first_name, last_name)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'resto@tif.test',
  '$2b$12$KIXxPfp1A1oQUyGZhCwGn.VG8sQ0pjkz4oKXqQbN9V4y0zFxqJj1S',
  'restaurant', 'Bob', 'Chef'
);

-- Restaurant
INSERT INTO restaurants (
  id, owner_id, name, slug, description, cuisine_type,
  cover_image_url, address_line1, city, postal_code,
  offers_pickup, offers_delivery, prep_time_min,
  subscription_plan, subscription_active, is_published
) VALUES (
  '33333333-3333-3333-3333-333333333333',
  '22222222-2222-2222-2222-222222222222',
  'Pizza Bella',
  'pizza-bella',
  'Pizza napolitaine au feu de bois, pâte affinée 48h.',
  'italien',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800',
  '12 rue de la République',
  'Lyon',
  '69002',
  TRUE, TRUE, 25,
  'growth', TRUE, TRUE
);

-- Menu
INSERT INTO menu_items (restaurant_id, name, description, category, price_cents, is_vegetarian, display_order) VALUES
('33333333-3333-3333-3333-333333333333', 'Margherita', 'Tomate, mozzarella di bufala, basilic frais.', 'Pizza', 1290, TRUE, 1),
('33333333-3333-3333-3333-333333333333', 'Diavola', 'Tomate, mozzarella, salami épicé, piment.', 'Pizza', 1490, FALSE, 2),
('33333333-3333-3333-3333-333333333333', 'Quattro Formaggi', 'Mozzarella, gorgonzola, parmesan, pecorino.', 'Pizza', 1590, TRUE, 3),
('33333333-3333-3333-3333-333333333333', 'Tiramisu maison', 'Recette traditionnelle au mascarpone.', 'Dessert', 690, TRUE, 10),
('33333333-3333-3333-3333-333333333333', 'Limonade artisanale', '33cl, citron de Sicile.', 'Boisson', 390, TRUE, 20);

-- Créneaux : tous les jours 11h-14h et 18h-22h
INSERT INTO availability_slots (restaurant_id, day_of_week, start_time, end_time, slot_minutes, max_orders_per_slot)
SELECT '33333333-3333-3333-3333-333333333333', d, '11:00', '14:00', 15, 5 FROM generate_series(0,6) d
UNION ALL
SELECT '33333333-3333-3333-3333-333333333333', d, '18:00', '22:00', 15, 8 FROM generate_series(0,6) d;

-- Code promo
INSERT INTO promo_codes (code, discount_type, discount_value, max_uses, valid_until)
VALUES ('BIENVENUE10', 'percent', 10, 1000, NOW() + INTERVAL '90 days');
