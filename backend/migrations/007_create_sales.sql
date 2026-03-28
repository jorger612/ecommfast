-- Migration 007: Sales and sale items
CREATE TABLE sales (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id            UUID NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  total_amount       NUMERIC(10, 2) NOT NULL CHECK (total_amount > 0),
  status             VARCHAR(20) NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending','paid','shipped','delivered','refunded','cancelled')),
  payment_provider   VARCHAR(50),
  payment_reference  VARCHAR(255),
  paid_at            TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE sale_items (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id      UUID NOT NULL REFERENCES sales (id) ON DELETE CASCADE,
  product_id   UUID NOT NULL REFERENCES products (id) ON DELETE RESTRICT,
  quantity     INTEGER NOT NULL CHECK (quantity > 0),
  unit_price   NUMERIC(10, 2) NOT NULL CHECK (unit_price > 0),
  subtotal     NUMERIC(10, 2) NOT NULL GENERATED ALWAYS AS (quantity * unit_price) STORED
);

CREATE INDEX idx_sales_user       ON sales (user_id);
CREATE INDEX idx_sales_status     ON sales (status);
CREATE INDEX idx_sale_items_sale  ON sale_items (sale_id);
CREATE INDEX idx_sale_items_prod  ON sale_items (product_id);
