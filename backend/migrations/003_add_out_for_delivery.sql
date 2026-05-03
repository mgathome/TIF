-- @no-transaction
-- Ajoute le statut "out_for_delivery" entre "ready" et "completed"
-- (en mode livraison, indique que le livreur est parti chez le client)
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'out_for_delivery' AFTER 'ready';
