-- Create Tournaments table
CREATE TABLE IF NOT EXISTS tournaments (
  id SERIAL PRIMARY KEY,
  organizer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  venue_id INTEGER REFERENCES venues(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  tournament_type VARCHAR(50), -- swiss, round_robin, knockout, arena
  time_control VARCHAR(50),
  format VARCHAR(50), -- classical, rapid, blitz, bullet
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP,
  registration_deadline TIMESTAMP,
  max_participants INTEGER,
  current_participants INTEGER DEFAULT 0,
  entry_fee DECIMAL(10,2) DEFAULT 0,
  prize_pool DECIMAL(10,2),
  rating_min INTEGER,
  rating_max INTEGER,
  status VARCHAR(50) DEFAULT 'upcoming', -- upcoming, ongoing, completed, cancelled
  image TEXT,
  rules TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create Tournament Registrations table
CREATE TABLE IF NOT EXISTS tournament_registrations (
  id SERIAL PRIMARY KEY,
  tournament_id INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  registration_date TIMESTAMP DEFAULT NOW(),
  payment_status VARCHAR(50) DEFAULT 'pending', -- pending, paid, refunded
  status VARCHAR(50) DEFAULT 'registered', -- registered, confirmed, withdrawn, eliminated
  final_rank INTEGER,
  points DECIMAL(5,2),
  UNIQUE(tournament_id, user_id)
);

-- Create Clubs table
CREATE TABLE IF NOT EXISTS clubs (
  id SERIAL PRIMARY KEY,
  owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  venue_id INTEGER REFERENCES venues(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  city VARCHAR(100),
  country VARCHAR(100),
  founded_year INTEGER,
  member_count INTEGER DEFAULT 0,
  image TEXT,
  meeting_schedule TEXT,
  membership_fee DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  website TEXT,
  contact_email VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create Club Memberships table
CREATE TABLE IF NOT EXISTS club_memberships (
  id SERIAL PRIMARY KEY,
  club_id INTEGER NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member', -- member, officer, admin, owner
  joined_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'active', -- active, inactive, banned
  UNIQUE(club_id, user_id)
);

-- Indexes for performance
CREATE INDEX idx_tournaments_status ON tournaments(status);
CREATE INDEX idx_tournaments_start_date ON tournaments(start_date);
CREATE INDEX idx_tournaments_organizer_id ON tournaments(organizer_id);
CREATE INDEX idx_tournament_registrations_tournament_id ON tournament_registrations(tournament_id);
CREATE INDEX idx_tournament_registrations_user_id ON tournament_registrations(user_id);
CREATE INDEX idx_clubs_is_active ON clubs(is_active);
CREATE INDEX idx_clubs_city ON clubs(city);
CREATE INDEX idx_club_memberships_club_id ON club_memberships(club_id);
CREATE INDEX idx_club_memberships_user_id ON club_memberships(user_id);

-- Comments
COMMENT ON TABLE tournaments IS 'Chess tournaments';
COMMENT ON TABLE tournament_registrations IS 'Tournament participant registrations';
COMMENT ON TABLE clubs IS 'Chess clubs';
COMMENT ON TABLE club_memberships IS 'Club membership records';
