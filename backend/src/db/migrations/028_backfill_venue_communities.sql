-- Migration 028: Backfill communities for approved venue submissions
-- This creates communities for any approved venues that don't have one yet

DO $$
DECLARE
  venue_rec RECORD;
  new_slug TEXT;
  slug_counter INTEGER;
  community_exists BOOLEAN;
BEGIN
  -- Loop through all approved venue submissions
  FOR venue_rec IN
    SELECT vs.*, u.id as owner_id
    FROM venue_submissions vs
    LEFT JOIN users u ON vs.user_id = u.id
    WHERE vs.status = 'approved'
  LOOP
    -- Check if a community already exists with similar name
    SELECT EXISTS(
      SELECT 1 FROM communities
      WHERE LOWER(name) = LOWER(venue_rec.venue_name)
      AND type = 'venue'
    ) INTO community_exists;

    IF NOT community_exists THEN
      -- Generate slug
      new_slug := LOWER(REGEXP_REPLACE(venue_rec.venue_name, '[^a-zA-Z0-9]+', '-', 'g'));
      new_slug := TRIM(BOTH '-' FROM new_slug);

      -- Ensure unique slug
      slug_counter := 1;
      WHILE EXISTS(SELECT 1 FROM communities WHERE slug = new_slug) LOOP
        new_slug := LOWER(REGEXP_REPLACE(venue_rec.venue_name, '[^a-zA-Z0-9]+', '-', 'g'));
        new_slug := TRIM(BOTH '-' FROM new_slug) || '-' || slug_counter;
        slug_counter := slug_counter + 1;
      END LOOP;

      -- Insert the community
      INSERT INTO communities (
        name, slug, description, type, city, country,
        image, tags, is_private, owner_id, member_count, is_active, is_verified
      ) VALUES (
        venue_rec.venue_name,
        new_slug,
        venue_rec.description,
        'venue',
        venue_rec.city,
        venue_rec.country,
        venue_rec.image_url,
        ARRAY['venue', LOWER(COALESCE(venue_rec.venue_type, 'casual'))]::TEXT[],
        false,
        venue_rec.user_id,
        1,
        true,
        false
      );

      RAISE NOTICE 'Created community for venue: %', venue_rec.venue_name;
    ELSE
      RAISE NOTICE 'Community already exists for venue: %', venue_rec.venue_name;
    END IF;
  END LOOP;
END $$;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Migration 028: Backfilled communities for approved venues';
END $$;
