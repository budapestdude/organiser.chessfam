-- Migration: Add refund policy system for tournaments
-- Description: Allows organizers to set refund policies with cut-off dates and automatic processing

-- Add refund policy fields to tournaments table
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS refund_policy_enabled BOOLEAN DEFAULT false;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS refund_100_percent_cutoff DATE; -- Cut-off date for 100% refund (minus Stripe fee)
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS refund_50_percent_cutoff DATE;  -- Cut-off date for 50% refund (minus Stripe fee)
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS refund_0_percent_cutoff DATE;   -- After this date, no refunds

-- Create refunds table to track all refund requests and processing
CREATE TABLE IF NOT EXISTS tournament_refunds (
  id SERIAL PRIMARY KEY,
  tournament_registration_id INTEGER NOT NULL REFERENCES tournament_registrations(id) ON DELETE CASCADE,
  tournament_id INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Payment details
  original_payment_id VARCHAR(255), -- Stripe payment intent ID
  original_amount DECIMAL(10, 2) NOT NULL,

  -- Refund calculation
  refund_percentage INTEGER NOT NULL CHECK (refund_percentage IN (0, 50, 100)),
  stripe_fee_amount DECIMAL(10, 2) DEFAULT 0,
  refund_amount DECIMAL(10, 2) NOT NULL, -- Amount actually refunded to user

  -- Processing status
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  stripe_refund_id VARCHAR(255), -- Stripe refund ID

  -- Reason and notes
  reason TEXT,
  admin_notes TEXT,
  error_message TEXT,

  -- Timestamps
  requested_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(tournament_registration_id)
);

-- Indexes for refunds table
CREATE INDEX IF NOT EXISTS idx_tournament_refunds_tournament_id ON tournament_refunds(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_refunds_user_id ON tournament_refunds(user_id);
CREATE INDEX IF NOT EXISTS idx_tournament_refunds_status ON tournament_refunds(status);
CREATE INDEX IF NOT EXISTS idx_tournament_refunds_requested_at ON tournament_refunds(requested_at DESC);

-- Function to calculate refund amount based on policy and current date
CREATE OR REPLACE FUNCTION calculate_refund_amount(
  p_tournament_id INTEGER,
  p_original_amount DECIMAL,
  p_request_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  refund_percentage INTEGER,
  stripe_fee_amount DECIMAL,
  refund_amount DECIMAL
) AS $$
DECLARE
  v_refund_policy_enabled BOOLEAN;
  v_refund_100_cutoff DATE;
  v_refund_50_cutoff DATE;
  v_refund_0_cutoff DATE;
  v_percentage INTEGER;
  v_stripe_fee DECIMAL;
  v_refund DECIMAL;
BEGIN
  -- Get tournament refund policy
  SELECT
    refund_policy_enabled,
    refund_100_percent_cutoff,
    refund_50_percent_cutoff,
    refund_0_percent_cutoff
  INTO
    v_refund_policy_enabled,
    v_refund_100_cutoff,
    v_refund_50_cutoff,
    v_refund_0_cutoff
  FROM tournaments
  WHERE id = p_tournament_id;

  -- If no refund policy enabled, return 0
  IF NOT v_refund_policy_enabled THEN
    RETURN QUERY SELECT 0, 0::DECIMAL, 0::DECIMAL;
    RETURN;
  END IF;

  -- Determine refund percentage based on cut-off dates
  IF p_request_date <= v_refund_100_cutoff THEN
    v_percentage := 100;
  ELSIF p_request_date <= v_refund_50_cutoff THEN
    v_percentage := 50;
  ELSIF p_request_date <= v_refund_0_cutoff THEN
    v_percentage := 0;
  ELSE
    -- After all cut-off dates, no refund
    v_percentage := 0;
  END IF;

  -- Calculate Stripe fee (2.9% + $0.30)
  -- This is the fee Stripe charged on the original payment
  v_stripe_fee := (p_original_amount * 0.029) + 0.30;

  -- Calculate refund amount
  IF v_percentage = 100 THEN
    -- 100% refund minus Stripe fee
    v_refund := p_original_amount - v_stripe_fee;
  ELSIF v_percentage = 50 THEN
    -- 50% refund minus Stripe fee
    v_refund := (p_original_amount * 0.5) - v_stripe_fee;
  ELSE
    -- No refund
    v_refund := 0;
  END IF;

  -- Ensure refund is not negative
  IF v_refund < 0 THEN
    v_refund := 0;
  END IF;

  RETURN QUERY SELECT v_percentage, v_stripe_fee, v_refund;
END;
$$ LANGUAGE plpgsql;

-- Add refund status to tournament registrations
ALTER TABLE tournament_registrations ADD COLUMN IF NOT EXISTS refund_requested BOOLEAN DEFAULT false;
ALTER TABLE tournament_registrations ADD COLUMN IF NOT EXISTS refund_status VARCHAR(50);
ALTER TABLE tournament_registrations ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP;

-- Create view for refund eligibility check
CREATE OR REPLACE VIEW refund_eligibility AS
SELECT
  tr.id as registration_id,
  tr.tournament_id,
  tr.user_id,
  t.name as tournament_name,
  t.start_date as tournament_start_date,
  tr.payment_status,
  tr.payment_amount,
  tr.created_at as registration_date,
  t.refund_policy_enabled,
  t.refund_100_percent_cutoff,
  t.refund_50_percent_cutoff,
  t.refund_0_percent_cutoff,
  tr.refund_requested,
  tr.refund_status,
  CASE
    WHEN NOT t.refund_policy_enabled THEN 'not_eligible'
    WHEN tr.payment_status != 'completed' THEN 'not_paid'
    WHEN tr.refund_requested THEN 'already_requested'
    WHEN CURRENT_DATE > t.refund_0_percent_cutoff THEN 'expired'
    ELSE 'eligible'
  END as eligibility_status
FROM tournament_registrations tr
JOIN tournaments t ON tr.tournament_id = t.id
WHERE tr.payment_status = 'completed';

-- Add comment explaining refund policy
COMMENT ON COLUMN tournaments.refund_policy_enabled IS 'Whether refund policy is enabled for this tournament';
COMMENT ON COLUMN tournaments.refund_100_percent_cutoff IS 'Last date to receive 100% refund (minus Stripe fee)';
COMMENT ON COLUMN tournaments.refund_50_percent_cutoff IS 'Last date to receive 50% refund (minus Stripe fee)';
COMMENT ON COLUMN tournaments.refund_0_percent_cutoff IS 'Last date to request refund (0% after this date)';
COMMENT ON TABLE tournament_refunds IS 'Tracks all refund requests and their processing status';
