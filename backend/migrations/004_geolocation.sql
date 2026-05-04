-- =====================================================================
-- Geolocalisation : adresses client + rayon de livraison restaurant
-- =====================================================================

-- Restaurant : rayon de livraison en kilometres
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS delivery_radius_km NUMERIC(5,2) NOT NULL DEFAULT 5.0
  CHECK (delivery_radius_km >= 0 AND delivery_radius_km <= 50);

-- User : adresse de livraison + coordonnees GPS
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS address_line1 VARCHAR(200),
  ADD COLUMN IF NOT EXISTS address_line2 VARCHAR(200),
  ADD COLUMN IF NOT EXISTS city          VARCHAR(120),
  ADD COLUMN IF NOT EXISTS postal_code   VARCHAR(20),
  ADD COLUMN IF NOT EXISTS country       VARCHAR(2) DEFAULT 'FR',
  ADD COLUMN IF NOT EXISTS latitude      NUMERIC(10, 7),
  ADD COLUMN IF NOT EXISTS longitude     NUMERIC(10, 7);

-- Index geospatial pour recherche par distance (Haversine)
-- (les colonnes lat/lon existaient deja sur restaurants depuis 001)
CREATE INDEX IF NOT EXISTS idx_restaurants_geo
  ON restaurants (latitude, longitude)
  WHERE is_published AND latitude IS NOT NULL;
