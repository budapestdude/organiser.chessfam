// Script to seed all 37 FAQs from the FAQ page into the database
// Usage: node seed-all-faqs.js

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const allFAQs = [
  // Getting Started (4)
  {
    category: 'Getting Started',
    question: 'What is ChessFam?',
    answer: 'ChessFam is a comprehensive platform for chess enthusiasts to find tournaments, connect with local clubs, play games with other players, and track their chess journey. Whether you\'re a beginner or a master, ChessFam helps you engage with the chess community.',
    display_order: 1
  },
  {
    category: 'Getting Started',
    question: 'How do I create an account?',
    answer: 'Click the "Sign Up" button in the top navigation. Enter your name, email, and password. You\'ll receive a verification email to confirm your account. Once verified, you can start exploring tournaments, clubs, and connecting with players!',
    display_order: 2
  },
  {
    category: 'Getting Started',
    question: 'Is ChessFam free to use?',
    answer: 'Yes! ChessFam offers a free tier that includes access to tournaments, clubs, player profiles, and basic game features. We also offer a Premium subscription ($9.99/month) with additional features like priority tournament registration, advanced analytics, and ad-free experience.',
    display_order: 3
  },
  {
    category: 'Getting Started',
    question: 'How do I find tournaments near me?',
    answer: 'Go to the Tournaments page and use the location filter to search by city or postal code. You can also filter by date, format (classical, rapid, blitz), and entry fee. The map view shows all tournaments in your area visually.',
    display_order: 4
  },

  // Tournaments (5)
  {
    category: 'Tournaments',
    question: 'How do I register for a tournament?',
    answer: 'Find a tournament you\'re interested in, click "View Details", and then click "Register Now". If there\'s an entry fee, you\'ll be directed to payment. Once registered, you\'ll receive a confirmation email with all the details.',
    display_order: 5
  },
  {
    category: 'Tournaments',
    question: 'Can I get a refund if I cancel my tournament registration?',
    answer: 'Refund policies vary by tournament organizer. Generally, cancellations made 7+ days before the tournament receive a full refund. Cancellations within 7 days may receive a partial refund or no refund. Check the specific tournament\'s cancellation policy on its detail page.',
    display_order: 6
  },
  {
    category: 'Tournaments',
    question: 'How do I organize my own tournament?',
    answer: 'You need to be a verified user to organize tournaments. Go to your Profile, click "Verify Identity", and submit the required documents. Once verified, click "Create Tournament" from the Tournaments page and fill in all the details including date, location, format, and entry fee.',
    display_order: 7
  },
  {
    category: 'Tournaments',
    question: 'What happens if a tournament is cancelled?',
    answer: 'If a tournament is cancelled, all participants receive an email notification explaining the reason. Entry fees are automatically refunded within 5-7 business days. You can view the cancellation notice on the tournament page.',
    display_order: 8
  },
  {
    category: 'Tournaments',
    question: 'Can I participate in online tournaments?',
    answer: 'Yes! Many tournaments on ChessFam are online. Look for the "Online" tag when browsing. Online tournaments typically use popular chess platforms like Lichess or Chess.com. The tournament details will include the platform and joining instructions.',
    display_order: 9
  },

  // Clubs (4)
  {
    category: 'Clubs',
    question: 'How do I join a chess club?',
    answer: 'Browse clubs on the Clubs page, click on a club to view its details, and click "Join Club". Some clubs are free while others may have a membership fee. Once you join, you\'ll have access to club events, discussions, and exclusive tournaments.',
    display_order: 10
  },
  {
    category: 'Clubs',
    question: 'Can I create my own chess club?',
    answer: 'Yes! Verified users can create clubs. After identity verification, go to the Clubs page and click "Create Club". You\'ll need to provide club name, description, location, meeting schedule, and membership details. You\'ll be the club admin and can manage members and events.',
    display_order: 11
  },
  {
    category: 'Clubs',
    question: 'What are the benefits of joining a club?',
    answer: 'Club members get access to club-exclusive tournaments, regular meetups and practice sessions, training materials shared by the club, discounts on tournament entry fees, and a community of players at similar skill levels. Many clubs also organize social events and team competitions.',
    display_order: 12
  },
  {
    category: 'Clubs',
    question: 'How do I leave a club?',
    answer: 'Go to the club page and click "Leave Club". If you paid a membership fee, you may be eligible for a partial refund depending on how long you\'ve been a member. Check the club\'s refund policy on their page.',
    display_order: 13
  },

  // Games & Matching (5)
  {
    category: 'Games & Matching',
    question: 'How do I find players to play with?',
    answer: 'Use the "Find a Game" feature to match with players near you based on rating, preferred time control, and location. You can also browse player profiles and send direct game invitations. The matching algorithm finds players at similar skill levels for fair games.',
    display_order: 14
  },
  {
    category: 'Games & Matching',
    question: 'Can I play games online through ChessFam?',
    answer: 'ChessFam focuses on in-person chess experiences and connecting local players. However, we integrate with popular online platforms like Lichess and Chess.com. You can link your accounts and share your online games on ChessFam.',
    display_order: 15
  },
  {
    category: 'Games & Matching',
    question: 'How does the rating system work?',
    answer: 'ChessFam uses standard chess ratings (similar to FIDE/USCF ratings). Your rating starts at 1500 and adjusts based on game results. Win against higher-rated players to gain more points. Ratings help match you with players at similar skill levels.',
    display_order: 16
  },
  {
    category: 'Games & Matching',
    question: 'What if my opponent doesn\'t show up?',
    answer: 'If your opponent doesn\'t arrive within 15 minutes of the scheduled time, you can report a no-show. The system will note this on their profile. Repeated no-shows can result in restricted matching privileges. We encourage good sportsmanship and reliability.',
    display_order: 17
  },
  {
    category: 'Games & Matching',
    question: 'Can I record my game for analysis?',
    answer: 'Yes! After each game, you can enter the moves in PGN format or use our notation tool. Your games are saved to your profile for later review. Premium members get access to computer analysis and opening statistics.',
    display_order: 18
  },

  // Account & Profile (5)
  {
    category: 'Account & Profile',
    question: 'How do I edit my profile?',
    answer: 'Click on your profile picture in the navigation, then click "Profile". From there, you can edit your name, bio, location, preferred time controls, and upload a profile picture. Premium members can also customize their profile theme.',
    display_order: 19
  },
  {
    category: 'Account & Profile',
    question: 'What is identity verification?',
    answer: 'Identity verification confirms you\'re a real person and builds trust in the community. Verified users can organize tournaments, create clubs, and receive a verified badge on their profile. Submit a government ID and selfie through the "Verify Identity" page.',
    display_order: 20
  },
  {
    category: 'Account & Profile',
    question: 'How do I change my password?',
    answer: 'Go to your Profile, scroll to "Account Settings", and click "Change Password". Enter your current password and new password. You\'ll receive a confirmation email once it\'s changed. If you forgot your password, use the "Forgot Password" link on the login page.',
    display_order: 21
  },
  {
    category: 'Account & Profile',
    question: 'Can I delete my account?',
    answer: 'Yes. Go to Profile → Account Settings → Delete Account. This will permanently remove your profile, game history, and all associated data. Active tournament registrations and club memberships will be cancelled. This action cannot be undone.',
    display_order: 22
  },
  {
    category: 'Account & Profile',
    question: 'How do I change my email preferences?',
    answer: 'Go to Profile → Account Settings → Email Preferences. You can choose which notifications you want to receive: tournament reminders, new club notifications, game invitations, and more. You can also unsubscribe from all non-essential emails.',
    display_order: 23
  },

  // Premium & Payments (5)
  {
    category: 'Premium & Payments',
    question: 'What features does Premium include?',
    answer: 'Premium ($9.99/month) includes: ad-free experience, priority tournament registration, advanced game analysis with computer suggestions, unlimited game storage, custom profile themes, early access to new features, and premium support. See the Pricing page for full details.',
    display_order: 24
  },
  {
    category: 'Premium & Payments',
    question: 'How do I upgrade to Premium?',
    answer: 'Click "Go Premium" in the navigation or visit the Pricing page. Choose your plan (monthly or annual) and enter your payment details. Your Premium features activate immediately. You can cancel anytime from Account Settings.',
    display_order: 25
  },
  {
    category: 'Premium & Payments',
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, Mastercard, American Express, Discover) and debit cards through Stripe, our secure payment processor. We do not store your card details - Stripe handles all payment security.',
    display_order: 26
  },
  {
    category: 'Premium & Payments',
    question: 'Can I cancel my Premium subscription?',
    answer: 'Yes, you can cancel anytime from Profile → Subscription Management. You\'ll keep Premium access until the end of your current billing period. No refunds for partial months, but you won\'t be charged again after cancellation.',
    display_order: 27
  },
  {
    category: 'Premium & Payments',
    question: 'Do you offer refunds?',
    answer: 'For Premium subscriptions, we don\'t offer refunds for partial months, but you can cancel anytime. For tournament entry fees, refunds depend on the organizer\'s policy and how far in advance you cancel. Check each tournament\'s specific refund policy.',
    display_order: 28
  },

  // Safety & Community (4)
  {
    category: 'Safety & Community',
    question: 'How do you ensure player safety?',
    answer: 'We take safety seriously. All users must verify their email. Tournament organizers and club admins are identity-verified. We have a reporting system for inappropriate behavior. Meetups should be in public places. We recommend informing someone about your chess games.',
    display_order: 29
  },
  {
    category: 'Safety & Community',
    question: 'How do I report inappropriate behavior?',
    answer: 'Click the three dots on any profile, post, or comment and select "Report". Choose the reason (harassment, spam, inappropriate content, etc.) and provide details. Our moderation team reviews all reports within 24 hours. Serious violations result in immediate suspension.',
    display_order: 30
  },
  {
    category: 'Safety & Community',
    question: 'What happens if I violate community guidelines?',
    answer: 'Violations result in warnings, temporary suspensions, or permanent bans depending on severity. Serious violations (harassment, threats, cheating) result in immediate removal. You\'ll receive an email explaining the violation. You can appeal decisions through our support team.',
    display_order: 31
  },
  {
    category: 'Safety & Community',
    question: 'Can I block another user?',
    answer: 'Yes. Go to their profile, click the three dots, and select "Block User". They won\'t be able to send you messages, game invitations, or see your profile. You won\'t be matched with them. You can unblock users anytime from your Account Settings.',
    display_order: 32
  },

  // Technical Support (5)
  {
    category: 'Technical Support',
    question: 'The website isn\'t loading properly. What should I do?',
    answer: 'First, try refreshing the page or clearing your browser cache. Make sure you\'re using an up-to-date browser (Chrome, Firefox, Safari, or Edge). If issues persist, try logging out and back in. Contact support if problems continue.',
    display_order: 33
  },
  {
    category: 'Technical Support',
    question: 'I didn\'t receive the verification email. What now?',
    answer: 'Check your spam/junk folder. If it\'s not there, click "Resend Verification Email" on the verification notice. Make sure you entered your email correctly. Some email providers (especially school/work emails) may block automated emails. Try a personal email address.',
    display_order: 34
  },
  {
    category: 'Technical Support',
    question: 'I forgot my password. How do I reset it?',
    answer: 'Click "Forgot Password" on the login page. Enter your email address and you\'ll receive a password reset link. Click the link and enter your new password. The link expires in 1 hour for security. If you don\'t receive the email, check your spam folder.',
    display_order: 35
  },
  {
    category: 'Technical Support',
    question: 'Is ChessFam available on mobile?',
    answer: 'Yes! ChessFam is fully responsive and works great on mobile browsers (iOS Safari, Android Chrome). We\'re currently developing native iOS and Android apps with additional features. Sign up for our newsletter to be notified when they launch.',
    display_order: 36
  },
  {
    category: 'Technical Support',
    question: 'How do I contact support?',
    answer: 'For technical issues, email support@chessfam.com. For tournament-specific questions, contact the organizer directly through the tournament page. For general questions, check our Help Center or post in the Community Forum. We typically respond within 24 hours.',
    display_order: 37
  }
];

async function seedFAQs() {
  try {
    await pool.connect();
    console.log('Connected to database');

    // Check current count
    const countBefore = await pool.query('SELECT COUNT(*) FROM faqs');
    console.log(`\nFAQs in database before: ${countBefore.rows[0].count}`);

    // Get existing questions to avoid duplicates
    const existing = await pool.query('SELECT question FROM faqs');
    const existingQuestions = new Set(existing.rows.map(r => r.question));

    let inserted = 0;
    let skipped = 0;

    console.log('\nProcessing 37 FAQs...\n');

    for (const faq of allFAQs) {
      if (existingQuestions.has(faq.question)) {
        console.log(`⏭️  Skipping (exists): "${faq.question.substring(0, 60)}..."`);
        skipped++;
      } else {
        await pool.query(
          `INSERT INTO faqs (question, answer, category, display_order, is_published)
           VALUES ($1, $2, $3, $4, true)`,
          [faq.question, faq.answer, faq.category, faq.display_order]
        );
        console.log(`✅ Inserted: "${faq.question.substring(0, 60)}..."`);
        inserted++;
      }
    }

    const countAfter = await pool.query('SELECT COUNT(*) FROM faqs');
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`FAQs in database after: ${countAfter.rows[0].count}`);
    console.log(`Inserted: ${inserted}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    await pool.end();
    console.log('\n✨ FAQ seeding complete!\n');
  } catch (error) {
    console.error('Error seeding FAQs:', error);
    process.exit(1);
  }
}

seedFAQs();
