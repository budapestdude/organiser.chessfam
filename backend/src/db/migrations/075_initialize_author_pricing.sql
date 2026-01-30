-- Migration 075: Initialize Author Pricing and Ensure Backward Compatibility
-- This migration ensures all existing blogs remain free and creates disabled pricing records for all blog authors

-- Set all existing blogs to free (backward compatibility)
UPDATE blogs
SET is_paid = FALSE
WHERE is_paid IS NULL;

-- Create default disabled pricing records for all existing blog authors
INSERT INTO author_subscription_pricing (
  author_id,
  enabled,
  monthly_price_cents,
  annual_price_cents,
  default_preview_percent,
  created_at,
  updated_at
)
SELECT DISTINCT
  b.author_id,
  FALSE as enabled,  -- Disabled by default
  NULL as monthly_price_cents,  -- Authors must configure pricing
  NULL as annual_price_cents,
  30 as default_preview_percent,  -- 30% preview by default
  NOW() as created_at,
  NOW() as updated_at
FROM blogs b
WHERE NOT EXISTS (
  SELECT 1 FROM author_subscription_pricing asp
  WHERE asp.author_id = b.author_id
)
ON CONFLICT (author_id) DO NOTHING;

-- Comments
COMMENT ON TABLE author_subscription_pricing IS 'Initialization complete: All blog authors have pricing records (disabled by default)';
COMMENT ON TABLE blogs IS 'All existing blogs set to free (is_paid = FALSE) for backward compatibility';
