-- Migration: Add discount tracking columns for premium member discounts
-- Tracks original price, discount applied, and final price paid for audit purposes

-- Tournament registrations discount tracking
ALTER TABLE tournament_registrations
ADD COLUMN original_entry_fee DECIMAL(10, 2),
ADD COLUMN discount_applied DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN discount_type VARCHAR(50);

COMMENT ON COLUMN tournament_registrations.original_entry_fee IS
  'Original entry fee before any discounts were applied';
COMMENT ON COLUMN tournament_registrations.discount_applied IS
  'Amount discounted (e.g., 5.00 for $5 off). Positive number.';
COMMENT ON COLUMN tournament_registrations.discount_type IS
  'Type of discount applied (e.g., premium_member, early_bird, promo_code)';

-- Club memberships discount tracking
-- First add membership_fee if it doesn't exist (for tracking what user actually paid)
ALTER TABLE club_memberships
ADD COLUMN IF NOT EXISTS membership_fee DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS original_fee DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS discount_applied DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_type VARCHAR(50);

COMMENT ON COLUMN club_memberships.original_fee IS
  'Original membership fee before any discounts were applied';
COMMENT ON COLUMN club_memberships.discount_applied IS
  'Amount discounted (e.g., 5.00 for $5 off). Positive number.';
COMMENT ON COLUMN club_memberships.discount_type IS
  'Type of discount applied (e.g., premium_member, early_bird, promo_code)';

-- Master bookings discount tracking
ALTER TABLE bookings
ADD COLUMN original_price DECIMAL(10, 2),
ADD COLUMN discount_applied DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN discount_type VARCHAR(50);

COMMENT ON COLUMN bookings.original_price IS
  'Original price before any discounts were applied';
COMMENT ON COLUMN bookings.discount_applied IS
  'Amount discounted (e.g., 5.00 for $5 off). Positive number.';
COMMENT ON COLUMN bookings.discount_type IS
  'Type of discount applied (e.g., premium_member, early_bird, promo_code)';
