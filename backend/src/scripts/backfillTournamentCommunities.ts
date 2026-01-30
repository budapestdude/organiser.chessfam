/**
 * Backfill script to create communities for existing tournaments
 * Run with: npx ts-node src/scripts/backfillTournamentCommunities.ts
 */

import { query } from '../config/database';
import * as communitiesService from '../services/communitiesService';

async function backfillTournamentCommunities() {
  try {
    console.log('Starting tournament communities backfill...');

    // Get all tournaments
    const tournamentsResult = await query(`
      SELECT t.*,
             v.city,
             v.country,
             (v.coordinates->>'lat')::DECIMAL as venue_latitude,
             (v.coordinates->>'lng')::DECIMAL as venue_longitude
      FROM tournaments t
      LEFT JOIN venues v ON t.venue_id = v.id
      WHERE t.organizer_id IS NOT NULL
      ORDER BY t.created_at DESC
    `);

    const tournaments = tournamentsResult.rows;
    console.log(`Found ${tournaments.length} tournaments`);

    let created = 0;
    let skipped = 0;
    let failed = 0;

    for (const tournament of tournaments) {
      try {
        // Check if community already exists for this tournament
        const existingCommunity = await query(
          `SELECT id FROM communities WHERE name = $1 AND type = 'tournament'`,
          [tournament.name]
        );

        if (existingCommunity.rows.length > 0) {
          console.log(`⏭️  Skipping "${tournament.name}" - community already exists`);
          skipped++;
          continue;
        }

        // Prepare community data
        const tags: string[] = ['tournament'];
        if (tournament.time_control) tags.push(tournament.time_control.toLowerCase());
        if (tournament.format) tags.push(tournament.format.toLowerCase());

        // Get location from venue
        const city = tournament.city;
        const country = tournament.country;
        const latitude = tournament.venue_latitude;
        const longitude = tournament.venue_longitude;

        // Create community
        console.log(`Creating community for tournament "${tournament.name}" (ID: ${tournament.id}, Organizer: ${tournament.organizer_id})`);
        const community = await communitiesService.createCommunity(tournament.organizer_id, {
          name: tournament.name,
          description: tournament.description,
          type: 'tournament',
          city,
          country,
          latitude,
          longitude,
          image: tournament.image,
          tags,
        });

        if (community) {
          console.log(`✅ Created community "${tournament.name}" (Community ID: ${community.id}, Owner ID: ${community.owner_id}) in ${city || 'unknown city'}`);
          created++;
        } else {
          console.log(`⚠️  Could not create community for "${tournament.name}" - createCommunity returned null/undefined`);
          failed++;
        }
      } catch (err) {
        console.error(`❌ Error creating community for tournament "${tournament.name}":`, err);
        failed++;
      }
    }

    console.log('\n📊 Backfill Summary:');
    console.log(`  ✅ Created: ${created}`);
    console.log(`  ⏭️  Skipped (already exist): ${skipped}`);
    console.log(`  ❌ Failed: ${failed}`);
    console.log(`  📋 Total processed: ${tournaments.length}`);

  } catch (err) {
    console.error('Fatal error during backfill:', err);
    process.exit(1);
  }

  process.exit(0);
}

// Run the backfill
backfillTournamentCommunities();
