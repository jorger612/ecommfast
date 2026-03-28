-- Migration 004: Products with stock constraint and JSONB photos
CREATE TABLE products (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id  UUID NOT NULL REFERENCES categories (id) ON DELETE RESTRICT,
  name         VARCHAR(255) NOT NULL,
  slug         VARCHAR(255) NOT NULL UNIQUE,
  description  TEXT,
  price        NUMERIC(10, 2) NOT NULL CHECK (price > 0),
  stock        INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  photos       JSONB NOT NULL DEFAULT '[]'::jsonb
                 CHECK (jsonb_typeof(photos) = 'array' AND jsonb_array_length(photos) <= 5),
  is_active    BOOLEAN NOT NULL DEFAULT true,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Composite index: only active products in active categories (core query pattern)
CREATE INDEX idx_products_category_active ON products (category_id, is_active, sort_order);
CREATE INDEX idx_products_slug            ON products (slug);
CREATE INDEX idx_products_stock           ON products (stock) WHERE stock > 0;
