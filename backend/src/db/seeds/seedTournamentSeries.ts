import { query } from '../../config/database';

/**
 * Seed example tournament series
 * Creates placeholder series for famous chess tournaments
 */

const tournamentSeriesData = [
  {
    name: 'Tata Steel Chess Tournament',
    description: 'One of the world\'s most prestigious chess tournaments, held annually in Wijk aan Zee, Netherlands since 1938. The tournament attracts the world\'s top grandmasters and has been won by legends like Magnus Carlsen, Garry Kasparov, and Viswanathan Anand. Known for its high-level play and beautiful seaside location.',
    image: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=800',
    location: 'Wijk aan Zee, Netherlands'
  },
  {
    name: 'Sligo Chess Festival',
    description: 'Ireland\'s premier chess festival held annually in the beautiful coastal town of Sligo. Features multiple tournaments across different rating categories, master classes, and simultaneous exhibitions. The festival combines competitive chess with Irish hospitality and stunning Atlantic coastline views.',
    image: 'https://images.unsplash.com/photo-1560174038-da43ac74f01b?w=800',
    location: 'Sligo, Ireland'
  },
  {
    name: 'GRENKE Chess Classic',
    description: 'Elite round-robin tournament held annually in Baden-Baden and Karlsruhe, Germany. Part of the Grand Chess Tour, this super-tournament features world-class grandmasters including multiple World Champions. Known for its strong field and classical time controls.',
    image: 'https://images.unsplash.com/photo-1586165368502-1bad197a6461?w=800',
    location: 'Baden-Baden, Germany'
  },
  {
    name: 'Isle of Wight Chess Festival',
    description: 'Annual chess congress held on the scenic Isle of Wight, off the south coast of England. Features multiple tournaments including Open, Major, Intermediate, and Minor sections. Combines competitive chess with a holiday atmosphere, attracting players from across the UK and Europe.',
    image: 'https://images.unsplash.com/photo-1611195974440-b55d6f1c0a0e?w=800',
    location: 'Isle of Wight, UK'
  },
  {
    name: 'Prague Chess Festival',
    description: 'International open tournament held in the historic city of Prague, Czech Republic. Features multiple sections including Masters, Challengers, and various rating categories. The festival takes place in Prague\'s beautiful historic center, offering players a unique combination of competitive chess and cultural tourism.',
    image: 'https://images.unsplash.com/photo-1541849546-216549ae216d?w=800',
    location: 'Prague, Czech Republic'
  }
];

async function seedTournamentSeries() {
  try {
    console.log('Starting tournament series seed...');

    // Get a valid organizer ID (first user in the system)
    const userResult = await query('SELECT id FROM users LIMIT 1');

    if (userResult.rows.length === 0) {
      console.error('No users found. Please create a user first.');
      return;
    }

    const organizerId = userResult.rows[0].id;
    console.log(`Using organizer ID: ${organizerId}`);

    // Check if series already exist
    for (const series of tournamentSeriesData) {
      const existingResult = await query(
        'SELECT id FROM tournaments WHERE name = $1 AND is_series_parent = true',
        [series.name]
      );

      if (existingResult.rows.length > 0) {
        console.log(`Series "${series.name}" already exists, skipping...`);
        continue;
      }

      // Insert series parent
      const result = await query(
        `INSERT INTO tournaments (
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
        ) VALUES ($1, $2, $3, $4, true, 'series', 'upcoming', 0, 0, NOW(), NOW())
        RETURNING id, name`,
        [series.name, series.description, series.image, organizerId]
      );

      console.log(`✓ Created series: ${result.rows[0].name} (ID: ${result.rows[0].id})`);
    }

    console.log('\n✓ Tournament series seeding completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Visit /tournaments in your app');
    console.log('2. Create individual tournament editions and link them to these series');
    console.log('3. Or use the series IDs to create editions programmatically');

  } catch (error) {
    console.error('Error seeding tournament series:', error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  seedTournamentSeries()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default seedTournamentSeries;
