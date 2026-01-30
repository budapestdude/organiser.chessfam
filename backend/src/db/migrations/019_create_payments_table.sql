-- Payments table for Stripe integration
-- Tracks all payments for bookings and tournaments

CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  booking_id INTEGER REFERENCES bookings(id) ON DELETE SET NULL,
  tournament_id INTEGER REFERENCES tournaments(id) ON DELETE SET NULL,

  -- Stripe identifiers
  stripe_payment_intent_id VARCHAR(255) UNIQUE,
  stripe_checkout_session_id VARCHAR(255) UNIQUE,
  stripe_customer_id VARCHAR(255),

  -- Payment details
  amount INTEGER NOT NULL, -- Amount in cents
  currency VARCHAR(3) DEFAULT 'usd',
  status VARCHAR(50) DEFAULT 'pending', -- pending, processing, succeeded, failed, refunded, partially_refunded
  payment_type VARCHAR(50) NOT NULL, -- master_booking, tournament_entry, donation, subscription

  -- Refund tracking
  refund_id VARCHAR(255),
  refund_amount INTEGER,
  refund_reason TEXT,
  refunded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  refunded_at TIMESTAMP,

  -- Metadata
  description TEXT,
  metadata JSONB,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_tournament ON payments(tournament_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_intent ON payments(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_session ON payments(stripe_checkout_session_id);
CREATE INDEX IF NOT EXISTS idx_payments_created ON payments(created_at DESC);

-- Add payment_status to bookings if not exists
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS payment_id INTEGER REFERENCES payments(id) ON DELETE SET NULL;

-- Add entry_fee_status to tournament_registrations if not exists
ALTER TABLE tournament_registrations
  ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS payment_id INTEGER REFERENCES payments(id) ON DELETE SET NULL;

COMMENT ON TABLE payments IS 'Stripe payment records for bookings and tournament entries';
COMMENT ON COLUMN payments.amount IS 'Amount in cents (e.g., 1000 = $10.00)';
COMMENT ON COLUMN payments.status IS 'Payment lifecycle: pending -> processing -> succeeded/failed, or refunded';
