-- Migration 077: Create platform settings table for site-wide configuration
-- Stores platform-wide settings like premium member discounts for author subscriptions

CREATE TABLE IF NOT EXISTS platform_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(255) UNIQUE NOT NULL,
  setting_value TEXT,
  data_type VARCHAR(50) NOT NULL DEFAULT 'string', -- string, number, boolean, json
  description TEXT,
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by INTEGER REFERENCES users(id)
);

-- Insert default premium member discount settings
INSERT INTO platform_settings (setting_key, setting_value, data_type, description)
VALUES
  ('author_subscription_premium_discount_percent', '20', 'number', 'Percentage discount on author subscriptions for platform premium members'),
  ('author_subscription_premium_discount_enabled', 'true', 'boolean', 'Enable/disable premium member discounts on author subscriptions')
ON CONFLICT (setting_key) DO NOTHING;

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_platform_settings_key ON platform_settings(setting_key);

-- Migration to remove per-author premium discount fields
-- Note: We keep the columns for backward compatibility but they won't be used
-- In a future migration, we can drop them after confirming the system works
COMMENT ON COLUMN author_subscription_pricing.monthly_premium_discount_percent IS 'DEPRECATED: Use platform_settings instead';
COMMENT ON COLUMN author_subscription_pricing.annual_premium_discount_percent IS 'DEPRECATED: Use platform_settings instead';
