// Simple script to run database migrations
// Usage: node setup-db.js

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Split SQL into individual statements, preserving DO blocks and dollar-quoted strings
const splitStatements = (sql) => {
  // Remove comment lines first
  const lines = sql.split('\n');
  const sqlWithoutComments = lines
    .filter(line => {
      const trimmed = line.trim();
      // Keep line if it's not empty and not a comment-only line
      return trimmed.length > 0 && !trimmed.startsWith('--');
    })
    .join('\n');

  const statements = [];
  let current = '';
  let inDollarQuote = false;
  let dollarTag = null;
  let i = 0;

  while (i < sqlWithoutComments.length) {
    const char = sqlWithoutComments[i];
    const next = sqlWithoutComments[i + 1];

    // Check for dollar quote start/end
    if (char === '$') {
      // Try to match a dollar quote tag
      let tag = '$';
      let j = i + 1;
      while (j < sqlWithoutComments.length && sqlWithoutComments[j] !== '$') {
        tag += sqlWithoutComments[j];
        j++;
      }
      if (j < sqlWithoutComments.length) {
        tag += '$'; // closing $

        if (inDollarQuote && tag === dollarTag) {
          // End of dollar quote
          current += tag;
          i = j + 1;
          inDollarQuote = false;
          dollarTag = null;
          continue;
        } else if (!inDollarQuote) {
          // Start of dollar quote
          current += tag;
          i = j + 1;
          inDollarQuote = true;
          dollarTag = tag;
          continue;
        }
      }
    }

    // If we hit a semicolon outside of dollar quotes, end the statement
    if (char === ';' && !inDollarQuote) {
      current += char;
      const trimmed = current.trim();
      if (trimmed.length > 0) {
        statements.push(trimmed);
      }
      current = '';
      i++;
      continue;
    }

    current += char;
    i++;
  }

  // Add any remaining content
  const trimmed = current.trim();
  if (trimmed.length > 0) {
    statements.push(trimmed);
  }

  return statements;
};

const runMigration = async () => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Log migration path for debugging
    const migrationsDir = path.join(__dirname, 'src', 'db', 'migrations');
    console.log('Looking for migrations in:', migrationsDir);
    console.log('Directory exists:', fs.existsSync(migrationsDir));
    if (fs.existsSync(migrationsDir)) {
      console.log('Available migrations:', fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')));
    }

    // Run migrations in order - ensure venues comes before tournaments/clubs
    const migrations = [
      // Core tables
      '001_create_users_table.sql',
      '002_create_games_table.sql',
      '003_create_bookings_table.sql',
      '004_seed_masters_table.sql',
      '004_create_venues_table.sql',
      '005_create_tournaments_clubs_table.sql',
      '005_create_tournament_registrations_table.sql',
      '006_create_club_memberships_table.sql',
      '006_create_messages_table.sql',
      '007_create_venue_submissions_table.sql',
      '007_create_favorites_reviews_table.sql',
      '008_add_admin_role_to_users.sql',
      '009_create_player_reviews_table.sql',
      '010_create_venue_reviews_table.sql',
      '011_create_venue_checkins_table.sql',
      '012_create_achievements_tables.sql',
      '013_create_master_applications_table.sql',
      '013_create_challenges_table.sql',
      '014_add_profile_fields.sql',
      '014_add_online_status.sql',
      '015_create_club_reviews_table.sql',
      '016_create_tournament_reviews_table.sql',
      '017_create_ownership_system.sql',
      // New migrations
      '018_create_migration_tracking.sql',
      '019_create_payments_table.sql',
      '020_add_email_verification.sql',
      '021_add_user_ban_fields.sql',
      '021b_create_communities.sql',
      '022_backfill_communities.sql',
      '023_add_google_oauth.sql',
      '024_add_parent_bubble.sql',
      '025_fix_foreign_keys_and_indexes.sql',
      '026_schema_consolidation.sql',
      '027_remove_placeholder_data.sql',
      '028_backfill_venue_communities.sql',
      '029_enhance_game_system.sql',
      '030_gamification_enhancements.sql',
      '031_add_tournament_club_verification.sql',
      '031_create_theater_content.sql',
      '032_add_identity_verification.sql',
      '032_enhance_club_memberships.sql',
      '033_add_club_location_fields.sql',
      '034_add_club_payments.sql',
      '035_create_club_messages.sql',
      '036_create_club_events.sql',
      '037_add_review_moderation.sql',
      '038_add_image_galleries.sql',
      '038_fix_club_memberships_schema.sql',
      '039_allow_open_challenges.sql',
      '039_make_member_details_nullable.sql',
      '040_create_subscription_system.sql',
      '041_create_game_tournament_records.sql',
      '042_create_notification_system.sql',
      '043_fix_game_date_constraint.sql',
      '044_add_favorite_sections.sql',
      '045_add_tournament_categories.sql',
      '046_add_club_multi_venue_support.sql',
      '047_add_city_communities.sql',
      '048_add_fuzzy_search.sql',
      '049_add_series_parent_flag.sql',
      '050_add_external_registration_url.sql',
      '051_add_organizer_name_override.sql',
      '052_add_venue_submissions_geocoding.sql',
      '053_add_premium_discount_eligibility.sql',
      '054_add_discount_tracking.sql',
      '055_add_early_bird_pricing.sql',
      '056_create_social_feed.sql',
      '057_add_post_linked_entities.sql',
      '058_add_pgn_to_posts.sql',
      '059_add_series_parent_flag.sql',
      '060_add_images_array_to_posts.sql',
      '061_create_feed_algorithm_settings.sql',
      '062_fix_notification_preferences.sql',
      '062_create_analytics_events.sql',
      '063_add_variable_pricing_discounts.sql',
      '064_create_faq_table.sql',
      '065_create_email_templates_table.sql',
      '066_create_blogs_table.sql',
      '067_add_chess_features.sql',
      '068_add_chess_title_verification.sql',
      '069_auto_master_on_title_verification.sql',
      '070_add_titled_player_discounts.sql',
      '071_add_tournament_currency.sql',
      '072_add_festival_parent.sql',
      '073_create_author_subscriptions.sql',
      '074_add_paid_blogs.sql',
      '075_initialize_author_pricing.sql',
      '076_add_author_approval.sql',
      '077_create_platform_settings.sql',
      '078_create_professionals_system.sql',
      '079_add_masters_event_availability.sql',
      '080_create_hashtag_system.sql',
      '081_add_refund_policies.sql',
    ];

    for (const migration of migrations) {
      try {
        const migrationPath = path.join(__dirname, 'src', 'db', 'migrations', migration);

        if (!fs.existsSync(migrationPath)) {
          console.log(`Warning: Migration file ${migration} not found, skipping`);
          continue;
        }

        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        const statements = splitStatements(migrationSQL);

        let hasError = false;
        for (const statement of statements) {
          try {
            await client.query(statement);
          } catch (stmtError) {
            // Ignore "already exists" errors for tables (42P07), indexes (42P07), and constraints (42710)
            if (stmtError.code === '42P07' || stmtError.code === '42710') {
              // Silently continue - object already exists
              continue;
            }
            // Ignore "column already exists" errors (42701)
            if (stmtError.code === '42701') {
              continue;
            }
            // Log other errors but continue
            console.error(`Warning in ${migration} [${stmtError.code}]: ${stmtError.message}`);
            hasError = true;
          }
        }

        // Track migration in schema_migrations table if it exists
        try {
          await client.query(
            `INSERT INTO schema_migrations (migration_name, success) VALUES ($1, $2) ON CONFLICT (migration_name) DO NOTHING`,
            [migration, !hasError]
          );
        } catch {
          // Table might not exist yet
        }

        if (!hasError) {
          console.log(`Migration ${migration} completed`);
        } else {
          console.log(`Migration ${migration} completed with warnings`);
        }
      } catch (migrationError) {
        console.error(`Error reading migration ${migration}:`, migrationError.message);
        // Continue with next migration
      }
    }

    await client.end();
    console.log('Database setup complete!');
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
};

runMigration();
