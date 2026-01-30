CREATE TABLE IF NOT EXISTS masters (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  title VARCHAR(100) NOT NULL,
  rating INTEGER NOT NULL,
  price_rapid DECIMAL(10, 2) NOT NULL,
  price_blitz DECIMAL(10, 2),
  price_bullet DECIMAL(10, 2),
  price_classical DECIMAL(10, 2),
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Seed 3 masters for MVP (from data/index.ts)
INSERT INTO masters (id, name, title, rating, price_rapid, price_blitz, price_bullet, price_classical, available) VALUES
(1, 'GM Alexandra Kosteniuk', 'Grandmaster', 2495, 150, 100, 75, 200, true),
(2, 'GM Hikaru Nakamura', 'Grandmaster', 2736, 300, 300, 300, 300, true),
(9, 'IM Levy Rozman', 'International Master', 2350, 200, 200, 200, 200, true)
ON CONFLICT (id) DO NOTHING;
