-- Backfill communities from existing venues, clubs, and tournaments
-- This migrates all existing entities to the communities table for city bubbles

-- Insert communities from approved venue_submissions
INSERT INTO communities (name, slug, description, type, city, country, image, owner_id, is_active, is_verified, tags, member_count)
SELECT
    venue_name,
    LOWER(REGEXP_REPLACE(venue_name, '[^a-zA-Z0-9]+', '-', 'g')),
    description,
    'venue',
    city,
    country,
    image_url,
    user_id,
    true,
    true,
    ARRAY['venue', LOWER(COALESCE(venue_type, 'general'))],
    0
FROM venue_submissions
WHERE status = 'approved'
ON CONFLICT (slug) DO NOTHING;

-- Insert communities from clubs
INSERT INTO communities (name, slug, description, type, city, country, image, owner_id, is_active, is_verified, tags, member_count)
SELECT
    name,
    LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g')),
    description,
    'club',
    city,
    country,
    image,
    owner_id,
    is_active,
    false,
    ARRAY['club'],
    member_count
FROM clubs
WHERE is_active = true
ON CONFLICT (slug) DO NOTHING;

-- Insert communities from tournaments (get city from venue if available)
INSERT INTO communities (name, slug, description, type, city, country, image, owner_id, is_active, is_verified, tags, member_count)
SELECT
    t.name,
    LOWER(REGEXP_REPLACE(t.name, '[^a-zA-Z0-9]+', '-', 'g')),
    t.description,
    'tournament',
    COALESCE(v.city, 'Online'),
    v.country,
    t.image,
    t.organizer_id,
    true,
    false,
    ARRAY['tournament', LOWER(COALESCE(t.time_control, 'mixed')), LOWER(COALESCE(t.format, 'swiss'))],
    t.current_participants
FROM tournaments t
LEFT JOIN venues v ON t.venue_id = v.id
WHERE t.status IN ('upcoming', 'ongoing')
ON CONFLICT (slug) DO NOTHING;

-- Insert communities from venues table (the actual venues, not submissions)
INSERT INTO communities (name, slug, description, type, city, country, image, owner_id, is_active, is_verified, tags, member_count)
SELECT
    name,
    LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g')),
    description,
    'venue',
    city,
    country,
    image,
    owner_id,
    is_active,
    is_verified,
    ARRAY['venue'],
    0
FROM venues
WHERE is_active = true
ON CONFLICT (slug) DO NOTHING;
