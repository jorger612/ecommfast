-- Migration 005: Banners with temporal visibility
CREATE TABLE banners (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title      VARCHAR(255) NOT NULL,
  image_url  TEXT NOT NULL,
  link_url   TEXT,
  start_date DATE NOT NULL,
  end_date   DATE NOT NULL,
  is_active  BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_banner_dates CHECK (end_date >= start_date)
);

-- Index to efficiently query active banners for today
CREATE INDEX idx_banners_active_dates ON banners (is_active, start_date, end_date);
