-- Create feed algorithm settings table
CREATE TABLE IF NOT EXISTS feed_algorithm_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by INTEGER REFERENCES users(id)
);

-- Create index for faster lookups
CREATE INDEX idx_feed_algorithm_settings_key ON feed_algorithm_settings(setting_key);

-- Insert default algorithm settings
INSERT INTO feed_algorithm_settings (setting_key, setting_value, updated_at) VALUES
('weights', '{"likes": 1.0, "comments": 1.5, "recency": 2.0, "engagement": 1.2}', NOW()),
('boost_factors', '{"tournament_posts": 1.3, "pgn_posts": 1.2, "image_posts": 1.1, "verified_users": 1.15}', NOW()),
('time_decay', '{"half_life_hours": 24, "enabled": true}', NOW()),
('filters', '{"min_content_length": 10, "hide_deleted": true, "hide_flagged": true}', NOW())
ON CONFLICT (setting_key) DO NOTHING;

-- Add comment
COMMENT ON TABLE feed_algorithm_settings IS 'Stores configurable settings for the feed ranking algorithm';
