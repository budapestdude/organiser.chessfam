// Simple script to run database migrations
// Usage: node setup-db.js

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const runMigration = async () => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Run migrations in order
    const migrations = [
      '001_create_users_table.sql',
      '002_create_games_table.sql',
      '003_create_bookings_table.sql',
      '004_seed_masters_table.sql',
      '005_create_tournament_registrations_table.sql',
      '006_create_club_memberships_table.sql',
      '007_create_venue_submissions_table.sql',
      '008_add_admin_role_to_users.sql',
      '009_create_player_reviews_table.sql',
      '010_create_venue_reviews_table.sql',
      '011_create_venue_checkins_table.sql',
      '012_create_achievements_tables.sql'
    ];

    for (const migration of migrations) {
      try {
        const migrationPath = path.join(__dirname, 'src', 'db', 'migrations', migration);
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        await client.query(migrationSQL);
        console.log(`✅ Migration ${migration} completed`);
      } catch (migrationError) {
        // Log the error but continue with other migrations
        console.error(`⚠️  Warning during migration ${migration}:`, migrationError.message);
        // Only fail on critical errors (not "already exists" errors)
        if (migrationError.code !== '42P07' && migrationError.code !== '42710') {
          throw migrationError;
        }
      }
    }

    await client.end();
    console.log('✅ Database setup complete!');
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    process.exit(1);
  }
};

runMigration();
