-- Migration 009: Inventory logs for audit and statistics
CREATE TABLE inventory_logs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id   UUID NOT NULL REFERENCES products (id) ON DELETE RESTRICT,
  sale_id      UUID REFERENCES sales (id) ON DELETE SET NULL,
  return_id    UUID REFERENCES returns (id) ON DELETE SET NULL,
  delta        INTEGER NOT NULL CHECK (delta != 0),
  stock_after  INTEGER NOT NULL CHECK (stock_after >= 0),
  reason       VARCHAR(50) NOT NULL
                 CHECK (reason IN ('sale','return','manual_adjustment')),
  performed_by UUID NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_inv_logs_product ON inventory_logs (product_id, created_at DESC);
CREATE INDEX idx_inv_logs_sale    ON inventory_logs (sale_id) WHERE sale_id IS NOT NULL;
