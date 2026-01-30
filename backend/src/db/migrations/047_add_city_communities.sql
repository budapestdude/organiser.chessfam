-- Add city-level communities for general chat in each city

-- Update the type enum to include 'city' if using enum, or just allow it in varchar
-- The communities table already has type VARCHAR(50), so we're good

-- Create city communities for major chess cities
INSERT INTO communities (name, slug, description, type, city, country, latitude, longitude, tags, is_active, is_verified, owner_id)
VALUES
    ('New York General Chat', 'new-york-general', 'General chat for chess players in New York', 'city', 'New York', 'US', 40.7128, -74.0060, ARRAY['general-chat'], true, true, NULL),
    ('London General Chat', 'london-general', 'General chat for chess players in London', 'city', 'London', 'GB', 51.5074, -0.1278, ARRAY['general-chat'], true, true, NULL),
    ('Paris General Chat', 'paris-general', 'General chat for chess players in Paris', 'city', 'Paris', 'FR', 48.8566, 2.3522, ARRAY['general-chat'], true, true, NULL),
    ('Barcelona General Chat', 'barcelona-general', 'General chat for chess players in Barcelona', 'city', 'Barcelona', 'ES', 41.3851, 2.1734, ARRAY['general-chat'], true, true, NULL),
    ('Berlin General Chat', 'berlin-general', 'General chat for chess players in Berlin', 'city', 'Berlin', 'DE', 52.5200, 13.4050, ARRAY['general-chat'], true, true, NULL),
    ('Moscow General Chat', 'moscow-general', 'General chat for chess players in Moscow', 'city', 'Moscow', 'RU', 55.7558, 37.6173, ARRAY['general-chat'], true, true, NULL),
    ('Oslo General Chat', 'oslo-general', 'General chat for chess players in Oslo', 'city', 'Oslo', 'NO', 59.9139, 10.7522, ARRAY['general-chat'], true, true, NULL),
    ('Mumbai General Chat', 'mumbai-general', 'General chat for chess players in Mumbai', 'city', 'Mumbai', 'IN', 19.0760, 72.8777, ARRAY['general-chat'], true, true, NULL),
    ('Los Angeles General Chat', 'los-angeles-general', 'General chat for chess players in Los Angeles', 'city', 'Los Angeles', 'US', 34.0522, -118.2437, ARRAY['general-chat'], true, true, NULL),
    ('Chicago General Chat', 'chicago-general', 'General chat for chess players in Chicago', 'city', 'Chicago', 'US', 41.8781, -87.6298, ARRAY['general-chat'], true, true, NULL),
    ('San Francisco General Chat', 'san-francisco-general', 'General chat for chess players in San Francisco', 'city', 'San Francisco', 'US', 37.7749, -122.4194, ARRAY['general-chat'], true, true, NULL),
    ('Toronto General Chat', 'toronto-general', 'General chat for chess players in Toronto', 'city', 'Toronto', 'CA', 43.6532, -79.3832, ARRAY['general-chat'], true, true, NULL),
    ('Amsterdam General Chat', 'amsterdam-general', 'General chat for chess players in Amsterdam', 'city', 'Amsterdam', 'NL', 52.3676, 4.9041, ARRAY['general-chat'], true, true, NULL),
    ('Madrid General Chat', 'madrid-general', 'General chat for chess players in Madrid', 'city', 'Madrid', 'ES', 40.4168, -3.7038, ARRAY['general-chat'], true, true, NULL),
    ('Rome General Chat', 'rome-general', 'General chat for chess players in Rome', 'city', 'Rome', 'IT', 41.9028, 12.4964, ARRAY['general-chat'], true, true, NULL),
    ('Tokyo General Chat', 'tokyo-general', 'General chat for chess players in Tokyo', 'city', 'Tokyo', 'JP', 35.6762, 139.6503, ARRAY['general-chat'], true, true, NULL),
    ('Seoul General Chat', 'seoul-general', 'General chat for chess players in Seoul', 'city', 'Seoul', 'KR', 37.5665, 126.9780, ARRAY['general-chat'], true, true, NULL),
    ('Sydney General Chat', 'sydney-general', 'General chat for chess players in Sydney', 'city', 'Sydney', 'AU', -33.8688, 151.2093, ARRAY['general-chat'], true, true, NULL),
    ('São Paulo General Chat', 'sao-paulo-general', 'General chat for chess players in São Paulo', 'city', 'São Paulo', 'BR', -23.5505, -46.6333, ARRAY['general-chat'], true, true, NULL),
    ('Mexico City General Chat', 'mexico-city-general', 'General chat for chess players in Mexico City', 'city', 'Mexico City', 'MX', 19.4326, -99.1332, ARRAY['general-chat'], true, true, NULL)
ON CONFLICT (slug) DO NOTHING;

-- Add index for city type communities
CREATE INDEX IF NOT EXISTS idx_communities_city_type ON communities(city, type) WHERE type = 'city';

-- Add a system message to each city community welcoming users
INSERT INTO community_messages (community_id, user_id, content, message_type)
SELECT
    c.id,
    1, -- System user ID (you may need to adjust this)
    'Welcome to ' || c.city || '! This is the general chat for all chess players in the city. Share games, events, and connect with the local chess community.',
    'system'
FROM communities c
WHERE c.type = 'city' AND c.slug LIKE '%-general'
ON CONFLICT DO NOTHING;
