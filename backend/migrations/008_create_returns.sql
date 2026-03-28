-- Migration 008: Returns — validated against 30-day window in backend
CREATE TABLE returns (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id       UUID NOT NULL REFERENCES sales (id) ON DELETE RESTRICT,
  sale_item_id  UUID NOT NULL REFERENCES sale_items (id) ON DELETE RESTRICT,
  quantity      INTEGER NOT NULL CHECK (quantity > 0),
  reason        TEXT NOT NULL,
  status        VARCHAR(20) NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','approved','rejected','completed')),
  requested_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at   TIMESTAMPTZ
);

CREATE INDEX idx_returns_sale   ON returns (sale_id);
CREATE INDEX idx_returns_status ON returns (status);
