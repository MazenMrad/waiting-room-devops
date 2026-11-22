CREATE TABLE IF NOT EXISTS tickets (
  id BIGSERIAL PRIMARY KEY,
  client_id TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'served', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  served_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS tickets_status_id_idx ON tickets (status, id);
