-- Seed data for example tournament series
-- These are placeholder series for famous chess tournaments
-- Run this after migration 049 to create example series

-- Note: You'll need to replace organizer_id with actual user IDs from your database
-- For now, using organizer_id = 1 as placeholder

-- 1. Tata Steel Chess Tournament (Wijk aan Zee, Netherlands)
INSERT INTO tournaments (
  name,
  description,
  image,
  organizer_id,
  is_series_parent,
  tournament_category,
  status,
  current_participants,
  entry_fee,
  created_at,
  updated_at
) VALUES (
  'Tata Steel Chess Tournament',
  'One of the world''s most prestigious chess tournaments, held annually in Wijk aan Zee, Netherlands since 1938. The tournament attracts the world''s top grandmasters and has been won by legends like Magnus Carlsen, Garry Kasparov, and Viswanathan Anand. Known for its high-level play and beautiful seaside location.',
  'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=800',
  1,
  true,
  'series',
  'upcoming',
  0,
  0,
  NOW(),
  NOW()
) RETURNING id;

-- 2. Sligo Chess Festival (Sligo, Ireland)
INSERT INTO tournaments (
  name,
  description,
  image,
  organizer_id,
  is_series_parent,
  tournament_category,
  status,
  current_participants,
  entry_fee,
  created_at,
  updated_at
) VALUES (
  'Sligo Chess Festival',
  'Ireland''s premier chess festival held annually in the beautiful coastal town of Sligo. Features multiple tournaments across different rating categories, master classes, and simultaneous exhibitions. The festival combines competitive chess with Irish hospitality and stunning Atlantic coastline views.',
  'https://images.unsplash.com/photo-1560174038-da43ac74f01b?w=800',
  1,
  true,
  'series',
  'upcoming',
  0,
  0,
  NOW(),
  NOW()
) RETURNING id;

-- 3. GRENKE Chess Classic (Germany)
INSERT INTO tournaments (
  name,
  description,
  image,
  organizer_id,
  is_series_parent,
  tournament_category,
  status,
  current_participants,
  entry_fee,
  created_at,
  updated_at
) VALUES (
  'GRENKE Chess Classic',
  'Elite round-robin tournament held annually in Baden-Baden and Karlsruhe, Germany. Part of the Grand Chess Tour, this super-tournament features world-class grandmasters including multiple World Champions. Known for its strong field and classical time controls.',
  'https://images.unsplash.com/photo-1586165368502-1bad197a6461?w=800',
  1,
  true,
  'series',
  'upcoming',
  0,
  0,
  NOW(),
  NOW()
) RETURNING id;

-- 4. Isle of Wight Chess Festival (UK)
INSERT INTO tournaments (
  name,
  description,
  image,
  organizer_id,
  is_series_parent,
  tournament_category,
  status,
  current_participants,
  entry_fee,
  created_at,
  updated_at
) VALUES (
  'Isle of Wight Chess Festival',
  'Annual chess congress held on the scenic Isle of Wight, off the south coast of England. Features multiple tournaments including Open, Major, Intermediate, and Minor sections. Combines competitive chess with a holiday atmosphere, attracting players from across the UK and Europe.',
  'https://images.unsplash.com/photo-1611195974440-b55d6f1c0a0e?w=800',
  1,
  true,
  'series',
  'upcoming',
  0,
  0,
  NOW(),
  NOW()
) RETURNING id;

-- 5. Prague Chess Festival (Czech Republic)
INSERT INTO tournaments (
  name,
  description,
  image,
  organizer_id,
  is_series_parent,
  tournament_category,
  status,
  current_participants,
  entry_fee,
  created_at,
  updated_at
) VALUES (
  'Prague Chess Festival',
  'International open tournament held in the historic city of Prague, Czech Republic. Features multiple sections including Masters, Challengers, and various rating categories. The festival takes place in Prague''s beautiful historic center, offering players a unique combination of competitive chess and cultural tourism.',
  'https://images.unsplash.com/photo-1541849546-216549ae216d?w=800',
  1,
  true,
  'series',
  'upcoming',
  0,
  0,
  NOW(),
  NOW()
) RETURNING id;

-- Optional: Add example editions for Tata Steel (assuming series parent id = 1 from above)
-- You can uncomment and modify these after getting the actual series IDs

/*
-- Tata Steel 2024 Edition
INSERT INTO tournaments (
  name,
  description,
  tournament_type,
  time_control,
  format,
  start_date,
  end_date,
  max_participants,
  current_participants,
  entry_fee,
  prize_pool,
  status,
  image,
  organizer_id,
  parent_tournament_id,
  tournament_category,
  is_recurring,
  created_at,
  updated_at
) VALUES (
  'Tata Steel Chess Tournament 2024',
  '86th edition of the legendary Tata Steel Chess Tournament',
  'Classical',
  '100+0',
  'Round Robin',
  '2024-01-12',
  '2024-01-28',
  14,
  14,
  0,
  100000,
  'completed',
  'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=800',
  1,
  1, -- Replace with actual series parent ID
  'recurring',
  true,
  NOW(),
  NOW()
);

-- Tata Steel 2025 Edition
INSERT INTO tournaments (
  name,
  description,
  tournament_type,
  time_control,
  format,
  start_date,
  end_date,
  max_participants,
  current_participants,
  entry_fee,
  prize_pool,
  status,
  image,
  organizer_id,
  parent_tournament_id,
  tournament_category,
  is_recurring,
  created_at,
  updated_at
) VALUES (
  'Tata Steel Chess Tournament 2025',
  '87th edition of the legendary Tata Steel Chess Tournament',
  'Classical',
  '100+0',
  'Round Robin',
  '2025-01-17',
  '2025-02-02',
  14,
  12,
  0,
  100000,
  'upcoming',
  'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=800',
  1,
  1, -- Replace with actual series parent ID
  'recurring',
  true,
  NOW(),
  NOW()
);
*/

-- To use this seed file:
-- 1. Make sure migration 049 has been run
-- 2. Update organizer_id to a valid user ID from your users table
-- 3. Run: psql -d your_database -f tournament_series_examples.sql
-- 4. Note the returned IDs to create editions if needed
