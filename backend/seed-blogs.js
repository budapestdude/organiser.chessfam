// Seed script for sample blog articles
const { Client } = require('pg');
require('dotenv').config();

const sampleBlogs = [
  {
    title: 'The King\'s Gambit: A Bold Opening for Aggressive Players',
    subtitle: 'Explore one of chess\'s most romantic and attacking openings',
    content: `The King's Gambit (1.e4 e5 2.f4) is one of the oldest and most aggressive chess openings, dating back to the 16th century. While it has fallen somewhat out of favor at the highest levels of chess, it remains a powerful weapon for club players and those who enjoy sharp, tactical positions.

**Why Play the King's Gambit?**

The King's Gambit offers White immediate activity and attacking chances. By sacrificing the f-pawn, White aims to:
- Open the f-file for the rook
- Control the center with pawns on e4 and d4
- Develop pieces rapidly
- Create immediate threats against Black's king

**Main Lines**

After 1.e4 e5 2.f4, Black has three main options:

1. **Accept the gambit** (2...exf4) - The most common response, leading to sharp tactical play
2. **Decline with 2...Bc5** (Classical Defense) - A solid approach maintaining central control
3. **Decline with 2...d5** (Falkbeer Counter-Gambit) - An aggressive counter-strike

**Modern Relevance**

While top GMs rarely employ the King's Gambit in classical games, it remains popular in:
- Blitz and rapid chess
- Online chess platforms
- Club tournaments
- Games against lower-rated opponents

Players like Hikaru Nakamura have occasionally used it in online blitz, showing it still has surprise value.

**Tips for Playing the King's Gambit**

1. **Study tactics**: The opening leads to sharp positions requiring concrete calculation
2. **Don't fear the sacrifice**: The pawn sacrifice is sound and leads to compensation
3. **Castle queenside**: Often, O-O-O is stronger than kingside castling
4. **Keep the initiative**: Don't give Black time to consolidate

The King's Gambit embodies the romantic era of chess - bold, aggressive, and full of tactical fireworks. While it may not be the most objectively best opening, it's certainly one of the most fun to play!`,
    tags: ['opening', 'tactics', 'aggressive', 'kings-gambit'],
    cover_image: 'https://images.unsplash.com/photo-1528819622765-d6bcf132f793?w=1200&h=630&fit=crop',
  },
  {
    title: 'Mastering the Endgame: Rook and Pawn vs Rook',
    subtitle: 'Essential techniques every chess player should know',
    content: `The endgame of rook and pawn versus rook is one of the most common in chess, yet it's surprisingly complex. Understanding the key principles can turn drawn positions into wins and prevent losses in seemingly hopeless situations.

**The Lucena Position**

The Lucena position is the most important winning position to know. The key idea is to "build a bridge" - using your rook to shield checks while your king escorts the pawn to promotion.

Key steps:
1. Place your king on the queening square
2. Place your rook on the fourth rank
3. Use the rook to block checks from behind
4. March the king up the board

**The Philidor Position**

On the defensive side, the Philidor position shows how to draw even when your opponent has a pawn on the 5th rank or further. The key is to keep your rook on the third rank, preventing the enemy king from advancing.

Critical principles:
- Keep your rook on the third rank until the pawn advances to the 6th
- Only then should you start checking from behind
- Force the enemy king to block their own pawn

**Practical Tips**

1. **As the attacking side**: Try to cut off the defending king from the pawn
2. **As the defending side**: Keep your rook active and give checks from behind
3. **The 50-move rule**: Don't forget this can save seemingly lost positions
4. **Rook activity trumps pawn structure**: An active rook is worth more than a passive one protecting a pawn

**Training Exercises**

Set up the Lucena and Philidor positions against a computer or training partner. Practice both sides until the technique becomes second nature. These positions appear in over 10% of all endgames, making them essential knowledge.

Remember: In rook endgames, activity is everything. A passive rook is like having one less piece on the board!`,
    tags: ['endgame', 'technique', 'rook-endgame', 'training'],
    cover_image: 'https://images.unsplash.com/photo-1580541631950-7282082b53ce?w=1200&h=630&fit=crop',
  },
  {
    title: 'Chess Psychology: Managing Time Pressure',
    subtitle: 'How to make better decisions when the clock is ticking',
    content: `Time pressure is one of the most challenging aspects of competitive chess. Even the strongest players make mistakes when their clock is running low. Here's how to improve your time management and performance under pressure.

**Understanding Time Trouble**

Time trouble typically occurs when you have less than 5 minutes (without increment) to make multiple moves. Studies show that the error rate increases dramatically when players have less than 2 minutes remaining.

Common causes:
- Over-analyzing early in the game
- Inability to recognize familiar positions
- Perfectionism - seeking the "best" move instead of a "good" move
- Poor opening preparation

**Strategies for Better Time Management**

**1. The 40-40-20 Rule**
Allocate your time roughly as:
- 40% for the opening and early middlegame
- 40% for critical middlegame positions
- 20% for the endgame

**2. Develop Decision-Making Triggers**
Create mental shortcuts for time pressure:
- If you can't decide in 2 minutes, play your second-best option
- Use elimination: Remove obviously bad moves first
- Trust your intuition in tactical positions

**3. Recognize Critical Moments**
Not all moves require equal thought. Save time on:
- Forced sequences
- Recaptures
- "Obvious" developing moves

Spend time on:
- Pawn breaks
- Piece sacrifices
- Defensive decisions

**Training for Time Pressure**

1. **Play faster time controls**: Regular practice at 5+0 or 3+2 builds speed
2. **Blitz sessions**: Even 1+0 games help pattern recognition
3. **Post-game analysis**: Identify where you spent too much time
4. **Opening preparation**: Know your repertoire deeply to save time

**Mental Techniques**

- **Stay calm**: Anxiety increases error rates
- **Simplify**: Trade pieces when ahead to reduce complexity
- **Trust your preparation**: Rely on studied positions
- **Accept imperfection**: A good move played quickly beats a perfect move you don't have time to find

**The Increment Advantage**

In games with increment (like 10+0 or 15+10), remember that each move adds time. Plan to reach move 40 with 2-3 minutes remaining, then build time back with the increment.

Time management is a skill that improves with practice. The key is to balance speed with accuracy, recognizing when to think deeply and when to trust your instincts.`,
    tags: ['psychology', 'time-management', 'improvement', 'tournament'],
    cover_image: 'https://images.unsplash.com/photo-1533928298208-27ff66555d8d?w=1200&h=630&fit=crop',
  },
  {
    title: 'The Sicilian Defense: Understanding the Najdorf Variation',
    subtitle: 'A deep dive into one of chess\'s most popular openings',
    content: `The Najdorf Variation of the Sicilian Defense (1.e4 c5 2.Nf3 d6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3 a6) is one of the most complex and theoretically rich openings in chess. Named after Grandmaster Miguel Najdorf, it has been a favorite of world champions from Bobby Fischer to Garry Kasparov.

**Why is the Najdorf So Popular?**

The Najdorf offers Black:
1. **Flexibility**: Black keeps many pawn structure options open
2. **Counterplay**: Active piece play on both flanks
3. **Imbalance**: Asymmetrical positions with winning chances
4. **Theoretical richness**: Endless possibilities for preparation

**Key Ideas for Black**

The move 5...a6 serves multiple purposes:
- Prepares ...e5, gaining space in the center
- Prevents Nb5 ideas from White
- Enables ...b5, expanding on the queenside
- Provides a flight square for the bishop on b7

**White's Main Plans**

White has several aggressive options:

**1. The English Attack (6.Be3)**
Characterized by f3, Qd2, and O-O-O, leading to opposite-side castling and mutual attacks.

**2. The Classical (6.Be2)**
A more positional approach, maintaining flexibility and avoiding early commitments.

**3. The Poisoned Pawn (6.Bg5 e6 7.f4 Qb6)**
One of the sharpest lines in chess, where Black grabs the b2 pawn at considerable risk.

**Strategic Themes**

For Black:
- Control the d5 square
- Generate queenside counterplay with ...b5
- Create threats against White's king
- Maintain piece activity

For White:
- Exploit the d5 square
- Launch a kingside attack
- Maintain central control
- Prevent Black's counterplay

**Modern Understanding**

Recent engine analysis has influenced Najdorf theory significantly. Key developments include:
- The English Attack has become White's main weapon
- New resources in the Poisoned Pawn
- Improved defensive techniques for Black
- Fresh ideas in minor variations

**Study Recommendations**

1. Learn the English Attack first - it's White's most popular choice
2. Understand typical middlegame plans before memorizing theory
3. Study complete games by Najdorf specialists
4. Practice pawn breaks: ...e5, ...b5, and ...d5

The Najdorf rewards deep understanding over pure memorization. Focus on the ideas behind the moves, and you'll develop a repertoire that lasts a lifetime.`,
    tags: ['opening', 'sicilian', 'najdorf', 'theory'],
    cover_image: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=1200&h=630&fit=crop',
  },
  {
    title: 'Building a Study Routine: How to Improve at Chess',
    subtitle: 'A structured approach to reaching your next rating milestone',
    content: `Improving at chess requires more than just playing games. A structured study routine can accelerate your progress and help you reach your rating goals more efficiently.

**Assess Your Current Level**

Before building a routine, identify your weaknesses:
- Rating range: 0-1200, 1200-1800, 1800-2200, 2200+
- Problem areas: Tactics, strategy, openings, endgames
- Time management issues
- Tournament performance vs. online rating

**The Weekly Study Framework**

Here's a balanced approach for intermediate players (1200-1800):

**Monday - Tactics Day (1 hour)**
- Solve 20-30 tactical puzzles
- Focus on pattern recognition
- Review mistakes immediately
- Use apps like Chess.com or Lichess

**Tuesday - Opening Study (45 minutes)**
- Review your repertoire
- Study one new line deeply
- Analyze recent games in your openings
- Update your opening notes

**Wednesday - Game Analysis (1.5 hours)**
- Analyze 1-2 of your recent games
- Find critical moments and mistakes
- Compare your moves with engine suggestions
- Identify recurring themes

**Thursday - Endgame Training (1 hour)**
- Learn one endgame position
- Practice against a computer
- Drill key positions repeatedly
- Focus on technique, not theory

**Friday - Strategy Study (1 hour)**
- Study master games
- Focus on pawn structures
- Learn piece placement principles
- Understand typical plans

**Weekend - Playing Time**
- Saturday: Tournament or longer time control games (2-3 games)
- Sunday: Mixed practice - blitz for pattern recognition

**Key Principles**

1. **Quality over Quantity**: 30 focused minutes beats 2 distracted hours
2. **Spaced Repetition**: Review concepts multiple times over weeks
3. **Active Learning**: Solve problems before checking answers
4. **Track Progress**: Keep a training journal

**Adjustment by Level**

**Beginners (Under 1200):**
- 70% tactics, 20% basic endgames, 10% opening principles
- Focus on not hanging pieces
- Learn basic checkmates

**Intermediate (1200-1800):**
- 40% tactics, 25% strategy, 20% openings, 15% endgames
- Develop calculation skills
- Build an opening repertoire

**Advanced (1800+):**
- 30% tactics, 30% openings, 25% strategy, 15% endgames
- Deep opening preparation
- Study grandmaster games
- Focus on your style

**Tools and Resources**

Free:
- Lichess Studies
- Chess.com free puzzles
- YouTube instructional videos
- Free game databases

Paid (Worth it):
- Chess.com Premium
- Chessable courses
- Private coaching
- Opening databases

**Measuring Progress**

Track these metrics:
- Rating progression (monthly)
- Tactical puzzle rating
- Tournament performance
- Time management
- Blunder frequency

Remember: Improvement isn't linear. Plateaus are normal and often precede breakthroughs. Stay consistent, be patient, and enjoy the journey!`,
    tags: ['improvement', 'training', 'study-plan', 'rating'],
    cover_image: 'https://images.unsplash.com/photo-1560174038-da43ac74f01b?w=1200&h=630&fit=crop',
  },
];

async function seedBlogs() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Get a system/admin user to be the author
    // First, try to find an admin user
    const adminResult = await client.query(
      "SELECT id FROM users WHERE is_admin = true OR email LIKE '%admin%' LIMIT 1"
    );

    let authorId;
    if (adminResult.rows.length > 0) {
      authorId = adminResult.rows[0].id;
      console.log(`Using admin user ID: ${authorId}`);
    } else {
      // Create a ChessFam Blog author account if no admin exists
      const createAuthorResult = await client.query(
        `INSERT INTO users (name, email, password_hash, is_verified, is_admin, created_at)
         VALUES ($1, $2, $3, true, true, NOW())
         ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [
          'ChessFam Editorial',
          'editorial@chessfam.com',
          '$2a$10$SYSTEMUSER.NOLOGIN.HASH', // Can't login with this hash
        ]
      );
      authorId = createAuthorResult.rows[0].id;
      console.log(`Created editorial user ID: ${authorId}`);
    }

    console.log(`\nSeeding ${sampleBlogs.length} blog articles...\n`);

    for (const blog of sampleBlogs) {
      // Check if blog already exists
      const existingBlog = await client.query(
        'SELECT id FROM blogs WHERE title = $1',
        [blog.title]
      );

      if (existingBlog.rows.length > 0) {
        console.log(`⏭️  Skipping (exists): "${blog.title.substring(0, 50)}..."`);
        continue;
      }

      // Calculate read time
      const wordCount = blog.content.split(/\s+/).length;
      const readTime = Math.max(1, Math.ceil(wordCount / 200));

      // Generate slug
      const slug = blog.title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 200);

      // Insert blog
      const result = await client.query(
        `INSERT INTO blogs (
          author_id, title, subtitle, content, cover_image, tags,
          read_time_minutes, status, published_at, slug,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'published', NOW(), $8, NOW(), NOW())
        RETURNING id`,
        [
          authorId,
          blog.title,
          blog.subtitle,
          blog.content,
          blog.cover_image,
          blog.tags,
          readTime,
          slug,
        ]
      );

      // Update slug with ID
      const blogId = result.rows[0].id;
      const finalSlug = `${slug}-${blogId}`;
      await client.query('UPDATE blogs SET slug = $1 WHERE id = $2', [finalSlug, blogId]);

      console.log(`✅ Created: "${blog.title}"`);
      console.log(`   Slug: ${finalSlug}`);
      console.log(`   Read time: ${readTime} min\n`);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Blog seeding completed successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  } catch (error) {
    console.error('Error seeding blogs:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seedBlogs();
