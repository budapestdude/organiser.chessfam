/**
 * Seed Tournament Series - Simple standalone script
 * Creates placeholder series for famous chess tournaments
 *
 * Usage: node seed-series.js
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const tournamentSeriesData = [
  {
    name: 'Tata Steel Chess Tournament',
    description: 'One of the world\'s most prestigious chess tournaments, held annually in Wijk aan Zee, Netherlands since 1938. The tournament attracts the world\'s top grandmasters and has been won by legends like Magnus Carlsen, Garry Kasparov, and Viswanathan Anand. Known for its high-level play and beautiful seaside location.',
    image: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=800',
  },
  {
    name: 'Sligo Chess Festival',
    description: 'Ireland\'s premier chess festival held annually in the beautiful coastal town of Sligo. Features multiple tournaments across different rating categories, master classes, and simultaneous exhibitions. The festival combines competitive chess with Irish hospitality and stunning Atlantic coastline views.',
    image: 'https://images.unsplash.com/photo-1560174038-da43ac74f01b?w=800',
  },
  {
    name: 'GRENKE Chess Classic',
    description: 'Elite round-robin tournament held annually in Baden-Baden and Karlsruhe, Germany. Part of the Grand Chess Tour, this super-tournament features world-class grandmasters including multiple World Champions. Known for its strong field and classical time controls.',
    image: 'https://images.unsplash.com/photo-1586165368502-1bad197a6461?w=800',
  },
  {
    name: 'Isle of Wight Chess Festival',
    description: 'Annual chess congress held on the scenic Isle of Wight, off the south coast of England. Features multiple tournaments including Open, Major, Intermediate, and Minor sections. Combines competitive chess with a holiday atmosphere, attracting players from across the UK and Europe.',
    image: 'https://images.unsplash.com/photo-1611195974440-b55d6f1c0a0e?w=800',
  },
  {
    name: 'Prague Chess Festival',
    description: 'International open tournament held in the historic city of Prague, Czech Republic. Features multiple sections including Masters, Challengers, and various rating categories. The festival takes place in Prague\'s beautiful historic center, offering players a unique combination of competitive chess and cultural tourism.',
    image: 'https://images.unsplash.com/photo-1541849546-216549ae216d?w=800',
  },
  {
    name: 'Reykjavik Open',
    description: 'Iceland\'s premier international chess tournament, held annually in the capital city of Reykjavik. Founded in 1964, this prestigious open attracts hundreds of players from around the world. The tournament is known for its strong field, excellent organization, and unique midnight sun atmosphere during its February/March dates.',
    image: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800',
  },
  {
    name: 'Menorca Open',
    description: 'Beautiful open tournament held on the Mediterranean island of Menorca, Spain. This popular festival combines competitive chess with a holiday atmosphere in one of Spain\'s most scenic locations. Features multiple sections and attracts players from across Europe seeking both strong competition and island relaxation.',
    image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800',
  },
  {
    name: 'Sunway Formentera Chess Festival',
    description: 'One of Spain\'s most beautiful chess festivals, held on the stunning island of Formentera in the Balearic Islands. The tournament features open and amateur sections, with play taking place in a beachside setting. Known for combining high-level chess with a relaxed holiday atmosphere and pristine beaches.',
    image: 'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=800',
  },
  {
    name: 'Biel Chess Festival',
    description: 'Switzerland\'s most important chess event, held annually in the bilingual city of Biel/Bienne. Features both a Grandmaster tournament and open sections. With a history dating back to 1968, the festival has hosted many world-class players and is known for its professional organization and beautiful lakeside location.',
    image: 'https://images.unsplash.com/photo-1605726045928-5156b1f54aeb?w=800',
  },
  {
    name: 'Rilton Cup',
    description: 'Traditional New Year chess tournament held in Stockholm, Sweden. Running since 1966, the Rilton Cup has become a beloved tradition for players who celebrate the holiday season with competitive chess. The tournament attracts strong international players and features excellent playing conditions in Sweden\'s capital.',
    image: 'https://images.unsplash.com/photo-1509356843151-3e7d96241e11?w=800',
  },
  {
    name: 'London Chess Classic',
    description: 'Elite chess tournament formerly part of the Grand Chess Tour, held in London, England. Founded in 2009, the Classic featured the world\'s top grandmasters competing in rapid and blitz formats. Known for its professional presentation, strong field, and importance in the chess calendar before going on hiatus.',
    image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800',
  },
  {
    name: 'Dortmund Chess Days',
    description: 'Germany\'s longest-running chess festival, held in the city of Dortmund. Previously known as the Dortmund Sparkassen Chess Meeting, this tournament has a rich history dating back to 1973. Features both elite round-robin tournaments and open sections, attracting top GMs and thousands of amateur players.',
    image: 'https://images.unsplash.com/photo-1595867818082-083862f3d630?w=800',
  },
  {
    name: 'Las Vegas International Chess Festival',
    description: 'One of America\'s largest open chess tournaments, held annually in Las Vegas, Nevada. The festival features multiple sections accommodating all skill levels, from beginners to masters. Known for its substantial prize fund, Vegas atmosphere, and convenient summer timing that attracts players nationwide.',
    image: 'https://images.unsplash.com/photo-1605833556294-ea5c7a74f57d?w=800',
  },
  {
    name: 'US Open Chess Championship',
    description: 'The United States Chess Federation\'s flagship event, running since 1900. One of the oldest and most prestigious open tournaments in America, the US Open crowns the national open champion annually. Features a massive prize fund, attracts hundreds of players, and moves to different cities each year.',
    image: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800',
  },
  {
    name: 'Sunway Sitges Chess Festival',
    description: 'Premier chess festival held in the beautiful coastal town of Sitges, just south of Barcelona, Spain. One of the strongest open tournaments in Europe, featuring multiple sections including an elite Grandmaster group. The festival combines top-level chess with Mediterranean beaches and vibrant nightlife.',
    image: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800',
  }
];

async function seedSeries() {
  const client = await pool.connect();

  try {
    console.log('🎯 Starting tournament series seed...\n');

    // Get a valid organizer ID
    const userResult = await client.query('SELECT id FROM users LIMIT 1');

    if (userResult.rows.length === 0) {
      console.error('❌ No users found. Please create a user first.');
      return;
    }

    const organizerId = userResult.rows[0].id;
    console.log(`✓ Using organizer ID: ${organizerId}\n`);

    const createdSeriesIds = [];

    // Insert series
    for (const series of tournamentSeriesData) {
      // Check if exists
      const existingResult = await client.query(
        'SELECT id FROM tournaments WHERE name = $1 AND is_series_parent = true',
        [series.name]
      );

      if (existingResult.rows.length > 0) {
        console.log(`⏭️  Series "${series.name}" already exists (ID: ${existingResult.rows[0].id})`);
        createdSeriesIds.push({ name: series.name, id: existingResult.rows[0].id });
        continue;
      }

      // Insert (series parents need a dummy start_date due to NOT NULL constraint)
      const result = await client.query(
        `INSERT INTO tournaments (
          name, description, image, organizer_id,
          is_series_parent, tournament_category,
          status, current_participants, entry_fee,
          start_date, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, true, 'series', 'upcoming', 0, 0, '2099-12-31', NOW(), NOW())
        RETURNING id, name`,
        [series.name, series.description, series.image, organizerId]
      );

      console.log(`✓ Created: ${result.rows[0].name} (ID: ${result.rows[0].id})`);
      createdSeriesIds.push({ name: result.rows[0].name, id: result.rows[0].id });
    }

    // Create example editions for all series
    const seriesEditions = [
      {
        series: 'Tata Steel Chess Tournament',
        editions: [
          {
            name: 'Tata Steel Chess Tournament 2024',
            start_date: '2024-01-12',
            end_date: '2024-01-28',
            status: 'completed',
            current_participants: 14,
            prize_pool: 100000,
            venue_city: 'Wijk aan Zee, Netherlands'
          },
          {
            name: 'Tata Steel Chess Tournament 2025',
            start_date: '2025-01-17',
            end_date: '2025-02-02',
            status: 'completed',
            current_participants: 14,
            prize_pool: 100000,
            venue_city: 'Wijk aan Zee, Netherlands'
          },
          {
            name: 'Tata Steel Chess Tournament 2026',
            start_date: '2026-01-16',
            end_date: '2026-02-01',
            status: 'upcoming',
            current_participants: 8,
            prize_pool: 100000,
            venue_city: 'Wijk aan Zee, Netherlands'
          }
        ]
      },
      {
        series: 'Sligo Chess Festival',
        editions: [
          {
            name: 'Sligo Chess Festival 2024',
            start_date: '2024-08-10',
            end_date: '2024-08-17',
            status: 'completed',
            current_participants: 86,
            prize_pool: 5000,
            venue_city: 'Sligo, Ireland'
          },
          {
            name: 'Sligo Chess Festival 2025',
            start_date: '2025-08-09',
            end_date: '2025-08-16',
            status: 'completed',
            current_participants: 92,
            prize_pool: 5000,
            venue_city: 'Sligo, Ireland'
          },
          {
            name: 'Sligo Chess Festival 2026',
            start_date: '2026-08-08',
            end_date: '2026-08-15',
            status: 'upcoming',
            current_participants: 45,
            prize_pool: 5500,
            venue_city: 'Sligo, Ireland'
          }
        ]
      },
      {
        series: 'GRENKE Chess Classic',
        editions: [
          {
            name: 'GRENKE Chess Classic 2024',
            start_date: '2024-03-30',
            end_date: '2024-04-09',
            status: 'completed',
            current_participants: 10,
            prize_pool: 170000,
            venue_city: 'Baden-Baden, Germany'
          },
          {
            name: 'GRENKE Chess Classic 2025',
            start_date: '2025-03-29',
            end_date: '2025-04-08',
            status: 'completed',
            current_participants: 10,
            prize_pool: 175000,
            venue_city: 'Karlsruhe, Germany'
          },
          {
            name: 'GRENKE Chess Classic 2026',
            start_date: '2026-04-04',
            end_date: '2026-04-14',
            status: 'upcoming',
            current_participants: 6,
            prize_pool: 180000,
            venue_city: 'Baden-Baden, Germany'
          }
        ]
      },
      {
        series: 'Isle of Wight Chess Festival',
        editions: [
          {
            name: 'Isle of Wight Chess Festival 2024',
            start_date: '2024-09-27',
            end_date: '2024-09-29',
            status: 'completed',
            current_participants: 124,
            prize_pool: 3000,
            venue_city: 'Isle of Wight, England'
          },
          {
            name: 'Isle of Wight Chess Festival 2025',
            start_date: '2025-09-26',
            end_date: '2025-09-28',
            status: 'completed',
            current_participants: 118,
            prize_pool: 3000,
            venue_city: 'Isle of Wight, England'
          },
          {
            name: 'Isle of Wight Chess Festival 2026',
            start_date: '2026-09-25',
            end_date: '2026-09-27',
            status: 'upcoming',
            current_participants: 67,
            prize_pool: 3200,
            venue_city: 'Isle of Wight, England'
          }
        ]
      },
      {
        series: 'Prague Chess Festival',
        editions: [
          {
            name: 'Prague Chess Festival 2024',
            start_date: '2024-06-13',
            end_date: '2024-06-23',
            status: 'completed',
            current_participants: 156,
            prize_pool: 15000,
            venue_city: 'Prague, Czech Republic'
          },
          {
            name: 'Prague Chess Festival 2025',
            start_date: '2025-06-12',
            end_date: '2025-06-22',
            status: 'completed',
            current_participants: 162,
            prize_pool: 15000,
            venue_city: 'Prague, Czech Republic'
          },
          {
            name: 'Prague Chess Festival 2026',
            start_date: '2026-06-11',
            end_date: '2026-06-21',
            status: 'upcoming',
            current_participants: 89,
            prize_pool: 16000,
            venue_city: 'Prague, Czech Republic'
          }
        ]
      },
      {
        series: 'Reykjavik Open',
        editions: [
          {
            name: 'Reykjavik Open 2024',
            start_date: '2024-02-20',
            end_date: '2024-02-27',
            status: 'completed',
            current_participants: 234,
            prize_pool: 25000,
            venue_city: 'Reykjavik, Iceland'
          },
          {
            name: 'Reykjavik Open 2025',
            start_date: '2025-02-19',
            end_date: '2025-02-26',
            status: 'completed',
            current_participants: 248,
            prize_pool: 25000,
            venue_city: 'Reykjavik, Iceland'
          },
          {
            name: 'Reykjavik Open 2026',
            start_date: '2026-02-18',
            end_date: '2026-02-25',
            status: 'upcoming',
            current_participants: 142,
            prize_pool: 27000,
            venue_city: 'Reykjavik, Iceland'
          }
        ]
      },
      {
        series: 'Menorca Open',
        editions: [
          {
            name: 'Menorca Open 2024',
            start_date: '2024-07-15',
            end_date: '2024-07-23',
            status: 'completed',
            current_participants: 178,
            prize_pool: 8000,
            venue_city: 'Menorca, Spain'
          },
          {
            name: 'Menorca Open 2025',
            start_date: '2025-07-14',
            end_date: '2025-07-22',
            status: 'completed',
            current_participants: 186,
            prize_pool: 8500,
            venue_city: 'Menorca, Spain'
          },
          {
            name: 'Menorca Open 2026',
            start_date: '2026-07-13',
            end_date: '2026-07-21',
            status: 'upcoming',
            current_participants: 94,
            prize_pool: 9000,
            venue_city: 'Menorca, Spain'
          }
        ]
      },
      {
        series: 'Sunway Formentera Chess Festival',
        editions: [
          {
            name: 'Sunway Formentera Chess Festival 2024',
            start_date: '2024-10-19',
            end_date: '2024-10-27',
            status: 'completed',
            current_participants: 312,
            prize_pool: 20000,
            venue_city: 'Formentera, Spain'
          },
          {
            name: 'Sunway Formentera Chess Festival 2025',
            start_date: '2025-10-18',
            end_date: '2025-10-26',
            status: 'completed',
            current_participants: 328,
            prize_pool: 22000,
            venue_city: 'Formentera, Spain'
          },
          {
            name: 'Sunway Formentera Chess Festival 2026',
            start_date: '2026-10-17',
            end_date: '2026-10-25',
            status: 'upcoming',
            current_participants: 176,
            prize_pool: 24000,
            venue_city: 'Formentera, Spain'
          }
        ]
      },
      {
        series: 'Biel Chess Festival',
        editions: [
          {
            name: 'Biel Chess Festival 2024',
            start_date: '2024-07-13',
            end_date: '2024-07-25',
            status: 'completed',
            current_participants: 198,
            prize_pool: 50000,
            venue_city: 'Biel/Bienne, Switzerland'
          },
          {
            name: 'Biel Chess Festival 2025',
            start_date: '2025-07-12',
            end_date: '2025-07-24',
            status: 'completed',
            current_participants: 206,
            prize_pool: 52000,
            venue_city: 'Biel/Bienne, Switzerland'
          },
          {
            name: 'Biel Chess Festival 2026',
            start_date: '2026-07-11',
            end_date: '2026-07-23',
            status: 'upcoming',
            current_participants: 112,
            prize_pool: 55000,
            venue_city: 'Biel/Bienne, Switzerland'
          }
        ]
      },
      {
        series: 'Rilton Cup',
        editions: [
          {
            name: 'Rilton Cup 2023/2024',
            start_date: '2023-12-27',
            end_date: '2024-01-05',
            status: 'completed',
            current_participants: 142,
            prize_pool: 12000,
            venue_city: 'Stockholm, Sweden'
          },
          {
            name: 'Rilton Cup 2024/2025',
            start_date: '2024-12-27',
            end_date: '2025-01-05',
            status: 'completed',
            current_participants: 156,
            prize_pool: 12000,
            venue_city: 'Stockholm, Sweden'
          },
          {
            name: 'Rilton Cup 2025/2026',
            start_date: '2025-12-27',
            end_date: '2026-01-05',
            status: 'upcoming',
            current_participants: 78,
            prize_pool: 13000,
            venue_city: 'Stockholm, Sweden'
          }
        ]
      },
      {
        series: 'London Chess Classic',
        editions: [
          {
            name: 'London Chess Classic 2024',
            start_date: '2024-11-28',
            end_date: '2024-12-08',
            status: 'completed',
            current_participants: 10,
            prize_pool: 300000,
            venue_city: 'London, England'
          },
          {
            name: 'London Chess Classic 2025',
            start_date: '2025-11-27',
            end_date: '2025-12-07',
            status: 'completed',
            current_participants: 10,
            prize_pool: 300000,
            venue_city: 'London, England'
          },
          {
            name: 'London Chess Classic 2026',
            start_date: '2026-11-26',
            end_date: '2026-12-06',
            status: 'upcoming',
            current_participants: 8,
            prize_pool: 320000,
            venue_city: 'London, England'
          }
        ]
      },
      {
        series: 'Dortmund Chess Days',
        editions: [
          {
            name: 'Dortmund Chess Days 2024',
            start_date: '2024-07-06',
            end_date: '2024-07-14',
            status: 'completed',
            current_participants: 268,
            prize_pool: 18000,
            venue_city: 'Dortmund, Germany'
          },
          {
            name: 'Dortmund Chess Days 2025',
            start_date: '2025-07-05',
            end_date: '2025-07-13',
            status: 'completed',
            current_participants: 284,
            prize_pool: 18000,
            venue_city: 'Dortmund, Germany'
          },
          {
            name: 'Dortmund Chess Days 2026',
            start_date: '2026-07-04',
            end_date: '2026-07-12',
            status: 'upcoming',
            current_participants: 148,
            prize_pool: 20000,
            venue_city: 'Dortmund, Germany'
          }
        ]
      },
      {
        series: 'Las Vegas International Chess Festival',
        editions: [
          {
            name: 'Las Vegas International Chess Festival 2024',
            start_date: '2024-06-05',
            end_date: '2024-06-09',
            status: 'completed',
            current_participants: 342,
            prize_pool: 45000,
            venue_city: 'Las Vegas, Nevada'
          },
          {
            name: 'Las Vegas International Chess Festival 2025',
            start_date: '2025-06-04',
            end_date: '2025-06-08',
            status: 'completed',
            current_participants: 368,
            prize_pool: 50000,
            venue_city: 'Las Vegas, Nevada'
          },
          {
            name: 'Las Vegas International Chess Festival 2026',
            start_date: '2026-06-03',
            end_date: '2026-06-07',
            status: 'upcoming',
            current_participants: 186,
            prize_pool: 55000,
            venue_city: 'Las Vegas, Nevada'
          }
        ]
      },
      {
        series: 'US Open Chess Championship',
        editions: [
          {
            name: 'US Open Chess Championship 2024',
            start_date: '2024-07-27',
            end_date: '2024-08-04',
            status: 'completed',
            current_participants: 428,
            prize_pool: 60000,
            venue_city: 'Orlando, Florida'
          },
          {
            name: 'US Open Chess Championship 2025',
            start_date: '2025-08-02',
            end_date: '2025-08-10',
            status: 'completed',
            current_participants: 456,
            prize_pool: 65000,
            venue_city: 'Columbus, Ohio'
          },
          {
            name: 'US Open Chess Championship 2026',
            start_date: '2026-08-01',
            end_date: '2026-08-09',
            status: 'upcoming',
            current_participants: 234,
            prize_pool: 70000,
            venue_city: 'Philadelphia, Pennsylvania'
          }
        ]
      },
      {
        series: 'Sunway Sitges Chess Festival',
        editions: [
          {
            name: 'Sunway Sitges Chess Festival 2024',
            start_date: '2024-12-14',
            end_date: '2024-12-22',
            status: 'completed',
            current_participants: 298,
            prize_pool: 30000,
            venue_city: 'Sitges, Spain'
          },
          {
            name: 'Sunway Sitges Chess Festival 2025',
            start_date: '2025-12-13',
            end_date: '2025-12-21',
            status: 'upcoming',
            current_participants: 176,
            prize_pool: 32000,
            venue_city: 'Sitges, Spain'
          },
          {
            name: 'Sunway Sitges Chess Festival 2026',
            start_date: '2026-12-12',
            end_date: '2026-12-20',
            status: 'upcoming',
            current_participants: 142,
            prize_pool: 35000,
            venue_city: 'Sitges, Spain'
          }
        ]
      }
    ];

    let totalEditionsCreated = 0;

    for (const seriesData of seriesEditions) {
      const series = createdSeriesIds.find(s => s.name === seriesData.series);
      if (!series) continue;

      console.log(`\n🏆 Creating example editions for ${seriesData.series}...`);

      for (const edition of seriesData.editions) {
        const existingEdition = await client.query(
          'SELECT id FROM tournaments WHERE name = $1',
          [edition.name]
        );

        if (existingEdition.rows.length > 0) {
          console.log(`  ⏭️  Edition "${edition.name}" already exists`);
          continue;
        }

        await client.query(
          `INSERT INTO tournaments (
            name, description, tournament_type, time_control, format,
            start_date, end_date, max_participants, current_participants,
            entry_fee, prize_pool, status, image, organizer_id,
            parent_tournament_id, tournament_category, is_recurring,
            created_at, updated_at, approval_status
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW(), 'approved'
          )`,
          [
            edition.name,
            `${edition.name.split(' ').pop()} edition of the ${seriesData.series}. Location: ${edition.venue_city}`,
            'Classical',
            '90+30',
            'Swiss System',
            edition.start_date,
            edition.end_date,
            edition.current_participants + 50,
            edition.current_participants,
            25,
            edition.prize_pool,
            edition.status,
            tournamentSeriesData.find(t => t.name === seriesData.series)?.image || 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=800',
            organizerId,
            series.id,
            'recurring',
            true
          ]
        );

        console.log(`  ✓ Created edition: ${edition.name}`);
        totalEditionsCreated++;
      }
    }

    console.log('\n✅ Seeding completed successfully!\n');
    console.log('📝 Summary:');
    console.log(`   - Created ${createdSeriesIds.length} tournament series`);
    console.log(`   - Created ${totalEditionsCreated} tournament editions across all series\n`);
    console.log('🎯 Next steps:');
    console.log('   1. Visit https://chessfam.com/tournaments');
    console.log('   2. Click any tournament to view details');
    console.log('   3. Click "View Series" banner to see the series homepage\n');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run
seedSeries()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
