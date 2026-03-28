-- Migration 006: Payment providers configuration
CREATE TABLE payment_providers (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name              VARCHAR(50) NOT NULL UNIQUE CHECK (name IN ('stripe', 'openpay', 'paypal')),
  is_enabled        BOOLEAN NOT NULL DEFAULT false,
  apple_pay_enabled BOOLEAN NOT NULL DEFAULT false,
  google_pay_enabled BOOLEAN NOT NULL DEFAULT false,
  config            JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default providers (disabled by default — admin enables from panel)
INSERT INTO payment_providers (name, is_enabled, apple_pay_enabled, google_pay_enabled, config)
VALUES
  ('stripe',  false, false, false, '{"public_key": ""}'),
  ('openpay', false, false, false, '{"merchant_id": "", "public_key": ""}'),
  ('paypal',  false, false, false, '{"client_id": ""}');
