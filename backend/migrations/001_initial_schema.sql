-- =====================================================================
-- TIF — Schema initial
-- PostgreSQL 14+
-- =====================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext"; -- email case-insensitive

-- Types ENUM
CREATE TYPE user_role AS ENUM ('client', 'restaurant', 'admin');
CREATE TYPE order_status AS ENUM (
  'pending',       -- créée, paiement non confirmé
  'paid',          -- paiement confirmé, en attente du restaurant
  'preparing',     -- restaurant a accepté + prépare
  'ready',         -- prêt à être récupéré/livré
  'completed',     -- récupéré/livré
  'cancelled',     -- annulé (avant prep)
  'refunded'       -- remboursé
);
CREATE TYPE order_type AS ENUM ('pickup', 'delivery');
CREATE TYPE payment_status AS ENUM ('pending', 'succeeded', 'failed', 'refunded');
CREATE TYPE subscription_plan AS ENUM ('starter', 'growth', 'pro');

-- =====================================================================
-- USERS
-- =====================================================================
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email           CITEXT UNIQUE NOT NULL,
  password_hash   TEXT NOT NULL,
  role            user_role NOT NULL DEFAULT 'client',
  first_name      VARCHAR(80),
  last_name       VARCHAR(80),
  phone           VARCHAR(30),
  refresh_token   TEXT,                 -- jeton de refresh actuel (rotatif)
  email_verified  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_role ON users(role);

-- =====================================================================
-- RESTAURANTS
-- =====================================================================
CREATE TABLE restaurants (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name               VARCHAR(120) NOT NULL,
  slug               VARCHAR(140) UNIQUE NOT NULL,
  description        TEXT,
  cuisine_type       VARCHAR(80),       -- ex: "italien", "asiatique"
  cover_image_url    TEXT,
  logo_url           TEXT,
  address_line1      VARCHAR(200) NOT NULL,
  address_line2      VARCHAR(200),
  city               VARCHAR(120) NOT NULL,
  postal_code        VARCHAR(20) NOT NULL,
  country            VARCHAR(2) NOT NULL DEFAULT 'FR',
  latitude           NUMERIC(10, 7),
  longitude          NUMERIC(10, 7),
  phone              VARCHAR(30),
  email              CITEXT,
  -- offre & paramètres
  offers_pickup      BOOLEAN NOT NULL DEFAULT TRUE,
  offers_delivery    BOOLEAN NOT NULL DEFAULT FALSE,
  delivery_fee_cents INTEGER NOT NULL DEFAULT 0,
  min_order_cents    INTEGER NOT NULL DEFAULT 0,
  prep_time_min      INTEGER NOT NULL DEFAULT 20,    -- minutes par défaut
  -- abonnement TIF
  subscription_plan  subscription_plan,
  subscription_active BOOLEAN NOT NULL DEFAULT FALSE,
  stripe_customer_id TEXT,
  is_published       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_restaurants_city ON restaurants(city) WHERE is_published;
CREATE INDEX idx_restaurants_owner ON restaurants(owner_id);
CREATE INDEX idx_restaurants_slug ON restaurants(slug);

-- =====================================================================
-- MENU ITEMS
-- =====================================================================
CREATE TABLE menu_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id   UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name            VARCHAR(140) NOT NULL,
  description     TEXT,
  category        VARCHAR(80),            -- ex: "Entrée", "Plat", "Dessert"
  price_cents     INTEGER NOT NULL CHECK (price_cents >= 0),
  image_url       TEXT,
  is_available    BOOLEAN NOT NULL DEFAULT TRUE,
  -- diététique
  is_vegetarian   BOOLEAN NOT NULL DEFAULT FALSE,
  is_vegan        BOOLEAN NOT NULL DEFAULT FALSE,
  is_gluten_free  BOOLEAN NOT NULL DEFAULT FALSE,
  allergens       TEXT[],                 -- ex: ARRAY['gluten','lactose']
  display_order   INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_menu_items_restaurant ON menu_items(restaurant_id, display_order);
CREATE INDEX idx_menu_items_available ON menu_items(restaurant_id) WHERE is_available;

-- =====================================================================
-- AVAILABILITY SLOTS  (créneaux configurables par restaurant)
-- =====================================================================
CREATE TABLE availability_slots (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id   UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  day_of_week     SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=dim
  start_time      TIME NOT NULL,
  end_time        TIME NOT NULL,
  slot_minutes    INTEGER NOT NULL DEFAULT 15,    -- granularité
  max_orders_per_slot INTEGER NOT NULL DEFAULT 5,
  CHECK (end_time > start_time)
);

CREATE INDEX idx_slots_restaurant ON availability_slots(restaurant_id, day_of_week);

-- =====================================================================
-- ORDERS
-- =====================================================================
CREATE TABLE orders (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number        VARCHAR(20) UNIQUE NOT NULL,    -- ex: TIF-2026-000123
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  restaurant_id       UUID NOT NULL REFERENCES restaurants(id) ON DELETE RESTRICT,
  status              order_status NOT NULL DEFAULT 'pending',
  type                order_type NOT NULL DEFAULT 'pickup',
  -- créneau choisi
  scheduled_for       TIMESTAMPTZ NOT NULL,
  -- adresse livraison (snapshot, si type=delivery)
  delivery_address    TEXT,
  delivery_notes      TEXT,
  customer_notes      TEXT,
  -- montants (snapshot, en cents)
  subtotal_cents      INTEGER NOT NULL,
  delivery_fee_cents  INTEGER NOT NULL DEFAULT 0,
  promo_discount_cents INTEGER NOT NULL DEFAULT 0,
  total_cents         INTEGER NOT NULL,
  promo_code_applied  VARCHAR(40),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cancelled_at        TIMESTAMPTZ,
  CHECK (total_cents = subtotal_cents + delivery_fee_cents - promo_discount_cents)
);

CREATE INDEX idx_orders_user ON orders(user_id, created_at DESC);
CREATE INDEX idx_orders_restaurant ON orders(restaurant_id, status, scheduled_for);
CREATE INDEX idx_orders_status ON orders(status, scheduled_for);

-- Séquence pour order_number (humanly readable)
CREATE SEQUENCE order_number_seq START 1000;

-- =====================================================================
-- ORDER ITEMS (snapshot de menu_items au moment de la commande)
-- =====================================================================
CREATE TABLE order_items (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id          UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id      UUID REFERENCES menu_items(id) ON DELETE SET NULL,
  -- snapshot au moment de la commande
  name_snapshot     VARCHAR(140) NOT NULL,
  price_cents_snapshot INTEGER NOT NULL,
  quantity          INTEGER NOT NULL CHECK (quantity > 0),
  notes             TEXT,
  line_total_cents  INTEGER GENERATED ALWAYS AS (price_cents_snapshot * quantity) STORED
);

CREATE INDEX idx_order_items_order ON order_items(order_id);

-- =====================================================================
-- PAYMENTS
-- =====================================================================
CREATE TABLE payments (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id                 UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_charge_id         TEXT,
  amount_cents             INTEGER NOT NULL,
  currency                 CHAR(3) NOT NULL DEFAULT 'EUR',
  status                   payment_status NOT NULL DEFAULT 'pending',
  failure_reason           TEXT,
  refunded_amount_cents    INTEGER NOT NULL DEFAULT 0,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_intent ON payments(stripe_payment_intent_id);

-- =====================================================================
-- PROMO CODES (bonus)
-- =====================================================================
CREATE TABLE promo_codes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code            VARCHAR(40) UNIQUE NOT NULL,
  restaurant_id   UUID REFERENCES restaurants(id) ON DELETE CASCADE, -- NULL = global
  discount_type   VARCHAR(10) NOT NULL CHECK (discount_type IN ('percent','amount')),
  discount_value  INTEGER NOT NULL,         -- percent: 10 = 10%, amount: cents
  min_order_cents INTEGER NOT NULL DEFAULT 0,
  max_uses        INTEGER,                  -- NULL = illimité
  uses_count      INTEGER NOT NULL DEFAULT 0,
  valid_from      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until     TIMESTAMPTZ,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_promo_code ON promo_codes(code) WHERE is_active;

-- =====================================================================
-- NOTIFICATIONS (bonus, simples & in-app)
-- =====================================================================
CREATE TABLE notifications (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type         VARCHAR(40) NOT NULL,    -- ex: 'order_status_changed'
  title        VARCHAR(160) NOT NULL,
  body         TEXT,
  data         JSONB,                   -- contexte (order_id, etc.)
  read_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC) WHERE read_at IS NULL;

-- =====================================================================
-- TRIGGERS — updated_at auto
-- =====================================================================
CREATE OR REPLACE FUNCTION trg_set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at      BEFORE UPDATE ON users      FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER restaurants_updated_at BEFORE UPDATE ON restaurants FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER menu_items_updated_at  BEFORE UPDATE ON menu_items  FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER orders_updated_at      BEFORE UPDATE ON orders      FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER payments_updated_at    BEFORE UPDATE ON payments    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
