-- Função auxiliar para manter o campo updated_at sincronizado
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$;

-- Migração: criar tabela de cache de geocodificação
CREATE TABLE IF NOT EXISTS geocode_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type <> ''),
  short_name_normalized text NOT NULL,
  cep_normalized text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  state text NOT NULL DEFAULT '',
  lat double precision,
  lon double precision,
  provider text,
  confidence numeric,
  metadata jsonb,
  geocoded_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS geocode_cache_short_name_idx ON geocode_cache (short_name_normalized);
CREATE INDEX IF NOT EXISTS geocode_cache_cep_idx ON geocode_cache (cep_normalized);

ALTER TABLE geocode_cache
  ADD CONSTRAINT geocode_cache_unique_entry
  UNIQUE (entity_type, short_name_normalized, cep_normalized, address, city, state);

CREATE TRIGGER geocode_cache_update_timestamp
  BEFORE UPDATE ON geocode_cache
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_timestamp();

-- Rollback
DROP TRIGGER IF EXISTS geocode_cache_update_timestamp ON geocode_cache;
ALTER TABLE geocode_cache DROP CONSTRAINT IF EXISTS geocode_cache_unique_entry;
DROP TABLE IF EXISTS geocode_cache;

-- Rotas salvas
CREATE TABLE IF NOT EXISTS saved_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  route_data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TRIGGER saved_routes_update_timestamp
  BEFORE UPDATE ON saved_routes
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_timestamp();

CREATE TABLE IF NOT EXISTS saved_route_waypoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id uuid NOT NULL REFERENCES saved_routes(id) ON DELETE CASCADE,
  position integer NOT NULL,
  waypoint_data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE saved_route_waypoints
  ADD CONSTRAINT saved_route_waypoints_position_unique UNIQUE (route_id, position);

CREATE TRIGGER saved_route_waypoints_update_timestamp
  BEFORE UPDATE ON saved_route_waypoints
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_timestamp();

CREATE TABLE IF NOT EXISTS route_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id uuid NOT NULL REFERENCES saved_routes(id) ON DELETE CASCADE,
  total_distance numeric NOT NULL,
  total_duration numeric NOT NULL,
  waypoint_count integer NOT NULL,
  order_count integer NOT NULL,
  produzido_kg numeric NOT NULL,
  embalado_kg numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TRIGGER route_metrics_update_timestamp
  BEFORE UPDATE ON route_metrics
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_timestamp();

-- Rollback rotas salvas
DROP TRIGGER IF EXISTS route_metrics_update_timestamp ON route_metrics;
DROP TABLE IF EXISTS route_metrics;

DROP TRIGGER IF EXISTS saved_route_waypoints_update_timestamp ON saved_route_waypoints;
ALTER TABLE saved_route_waypoints DROP CONSTRAINT IF EXISTS saved_route_waypoints_position_unique;
DROP TABLE IF EXISTS saved_route_waypoints;

DROP TRIGGER IF EXISTS saved_routes_update_timestamp ON saved_routes;
DROP TABLE IF EXISTS saved_routes;
