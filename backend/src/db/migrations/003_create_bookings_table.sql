CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  master_id INTEGER NOT NULL,

  -- Booking details (from MasterDetail.tsx state)
  session_type VARCHAR(100) NOT NULL,
  booking_date DATE NOT NULL CHECK (booking_date >= CURRENT_DATE),
  booking_time TIME NOT NULL,
  time_control VARCHAR(50) DEFAULT 'rapid' CHECK (time_control IN ('bullet', 'blitz', 'rapid', 'classical')),
  number_of_games INTEGER DEFAULT 1 CHECK (number_of_games >= 1 AND number_of_games <= 10),
  location_type VARCHAR(20) DEFAULT 'online' CHECK (location_type IN ('online', 'in-person')),

  -- Pricing (calculated on frontend, stored for records)
  price_per_game DECIMAL(10, 2) NOT NULL CHECK (price_per_game > 0),
  total_price DECIMAL(10, 2) NOT NULL CHECK (total_price > 0),

  -- Status (auto-confirmed in Phase 1)
  status VARCHAR(50) DEFAULT 'confirmed' NOT NULL CHECK (status IN (
    'pending', 'confirmed', 'completed', 'cancelled'
  )),

  notes TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_master_id ON bookings(master_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
