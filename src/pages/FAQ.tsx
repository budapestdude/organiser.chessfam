import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search, HelpCircle, Mail, MessageCircle } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQItem[] = [
  // Getting Started
  {
    category: 'Getting Started',
    question: 'What is ChessFam?',
    answer: 'ChessFam is a comprehensive platform for chess enthusiasts to find tournaments, connect with local clubs, play games with other players, and track their chess journey. Whether you\'re a beginner or a master, ChessFam helps you engage with the chess community.'
  },
  {
    category: 'Getting Started',
    question: 'How do I create an account?',
    answer: 'Click the "Sign Up" button in the top navigation. Enter your name, email, and password. You\'ll receive a verification email to confirm your account. Once verified, you can start exploring tournaments, clubs, and connecting with players!'
  },
  {
    category: 'Getting Started',
    question: 'Is ChessFam free to use?',
    answer: 'Yes! ChessFam offers a free tier that includes access to tournaments, clubs, player profiles, and basic game features. We also offer a Premium subscription ($9.99/month) with additional features like priority tournament registration, advanced analytics, and ad-free experience.'
  },
  {
    category: 'Getting Started',
    question: 'How do I find tournaments near me?',
    answer: 'Go to the Tournaments page and use the location filter to search by city or postal code. You can also filter by date, format (classical, rapid, blitz), and entry fee. The map view shows all tournaments in your area visually.'
  },

  // Tournaments
  {
    category: 'Tournaments',
    question: 'How do I register for a tournament?',
    answer: 'Find a tournament you\'re interested in, click "View Details", and then click "Register Now". If there\'s an entry fee, you\'ll be directed to payment. Once registered, you\'ll receive a confirmation email with all the details.'
  },
  {
    category: 'Tournaments',
    question: 'Can I get a refund if I cancel my tournament registration?',
    answer: 'Refund policies vary by tournament organizer. Generally, cancellations made 7+ days before the tournament receive a full refund. Cancellations within 7 days may receive a partial refund or no refund. Check the specific tournament\'s cancellation policy on its detail page.'
  },
  {
    category: 'Tournaments',
    question: 'How do I organize my own tournament?',
    answer: 'You need to be a verified user to organize tournaments. Go to your Profile, click "Verify Identity", and submit the required documents. Once verified, click "Create Tournament" from the Tournaments page and fill in all the details including date, location, format, and entry fee.'
  },
  {
    category: 'Tournaments',
    question: 'What happens if a tournament is cancelled?',
    answer: 'If a tournament is cancelled, all participants receive an email notification explaining the reason. Entry fees are automatically refunded within 5-7 business days. You can view the cancellation notice on the tournament page.'
  },
  {
    category: 'Tournaments',
    question: 'Can I participate in online tournaments?',
    answer: 'Yes! Many tournaments on ChessFam are online. Look for the "Online" tag when browsing. Online tournaments typically use popular chess platforms like Lichess or Chess.com. The tournament details will include the platform and joining instructions.'
  },

  // Clubs
  {
    category: 'Clubs',
    question: 'How do I join a chess club?',
    answer: 'Browse clubs on the Clubs page, click on a club to view its details, and click "Join Club". Some clubs are free while others may have a membership fee. Once you join, you\'ll have access to club events, discussions, and exclusive tournaments.'
  },
  {
    category: 'Clubs',
    question: 'Can I create my own chess club?',
    answer: 'Yes! Verified users can create clubs. After identity verification, go to the Clubs page and click "Create Club". You\'ll need to provide club name, description, location, meeting schedule, and membership details. You\'ll be the club admin and can manage members and events.'
  },
  {
    category: 'Clubs',
    question: 'What are the benefits of joining a club?',
    answer: 'Club members get access to club-exclusive tournaments, regular meetups and practice sessions, training materials shared by the club, discounts on tournament entry fees, and a community of players at similar skill levels. Many clubs also organize social events and team competitions.'
  },
  {
    category: 'Clubs',
    question: 'How do I leave a club?',
    answer: 'Go to the club page and click "Leave Club". If you paid a membership fee, you may be eligible for a partial refund depending on how long you\'ve been a member. Check the club\'s refund policy on their page.'
  },

  // Games & Matching
  {
    category: 'Games & Matching',
    question: 'How do I find players to play with?',
    answer: 'Use the "Find a Game" feature to match with players near you based on rating, preferred time control, and location. You can also browse player profiles and send direct game invitations. The matching algorithm finds players at similar skill levels for fair games.'
  },
  {
    category: 'Games & Matching',
    question: 'Can I play games online through ChessFam?',
    answer: 'ChessFam focuses on in-person chess experiences and connecting local players. However, we integrate with popular online platforms like Lichess and Chess.com. You can link your accounts and share your online games on ChessFam.'
  },
  {
    category: 'Games & Matching',
    question: 'How does the rating system work?',
    answer: 'ChessFam uses standard chess ratings (similar to FIDE/USCF ratings). Your rating starts at 1500 and adjusts based on game results. Win against higher-rated players to gain more points. Ratings help match you with players at similar skill levels.'
  },
  {
    category: 'Games & Matching',
    question: 'What if my opponent doesn\'t show up?',
    answer: 'If your opponent doesn\'t arrive within 15 minutes of the scheduled time, you can report a no-show. The system will note this on their profile. Repeated no-shows can result in restricted matching privileges. We encourage good sportsmanship and reliability.'
  },
  {
    category: 'Games & Matching',
    question: 'Can I record my game for analysis?',
    answer: 'Yes! After each game, you can enter the moves in PGN format or use our notation tool. Your games are saved to your profile for later review. Premium members get access to computer analysis and opening statistics.'
  },

  // Account & Profile
  {
    category: 'Account & Profile',
    question: 'How do I edit my profile?',
    answer: 'Click on your profile picture in the navigation, then click "Profile". From there, you can edit your name, bio, location, preferred time controls, and upload a profile picture. Premium members can also customize their profile theme.'
  },
  {
    category: 'Account & Profile',
    question: 'What is identity verification?',
    answer: 'Identity verification confirms you\'re a real person and builds trust in the community. Verified users can organize tournaments, create clubs, and receive a verified badge on their profile. Submit a government ID and selfie through the "Verify Identity" page.'
  },
  {
    category: 'Account & Profile',
    question: 'How do I change my password?',
    answer: 'Go to your Profile, scroll to "Account Settings", and click "Change Password". Enter your current password and new password. You\'ll receive a confirmation email once it\'s changed. If you forgot your password, use the "Forgot Password" link on the login page.'
  },
  {
    category: 'Account & Profile',
    question: 'Can I delete my account?',
    answer: 'Yes. Go to Profile → Account Settings → Delete Account. This will permanently remove your profile, game history, and all associated data. Active tournament registrations and club memberships will be cancelled. This action cannot be undone.'
  },
  {
    category: 'Account & Profile',
    question: 'How do I change my email preferences?',
    answer: 'Go to Profile → Account Settings → Email Preferences. You can choose which notifications you want to receive: tournament reminders, new club notifications, game invitations, and more. You can also unsubscribe from all non-essential emails.'
  },

  // Premium & Payments
  {
    category: 'Premium & Payments',
    question: 'What features does Premium include?',
    answer: 'Premium ($9.99/month) includes: ad-free experience, priority tournament registration, advanced game analysis with computer suggestions, unlimited game storage, custom profile themes, early access to new features, and premium support. See the Pricing page for full details.'
  },
  {
    category: 'Premium & Payments',
    question: 'How do I upgrade to Premium?',
    answer: 'Click "Go Premium" in the navigation or visit the Pricing page. Choose your plan (monthly or annual) and enter your payment details. Your Premium features activate immediately. You can cancel anytime from Account Settings.'
  },
  {
    category: 'Premium & Payments',
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, Mastercard, American Express, Discover) and debit cards through Stripe, our secure payment processor. We do not store your card details - Stripe handles all payment security.'
  },
  {
    category: 'Premium & Payments',
    question: 'Can I cancel my Premium subscription?',
    answer: 'Yes, you can cancel anytime from Profile → Subscription Management. You\'ll keep Premium access until the end of your current billing period. No refunds for partial months, but you won\'t be charged again after cancellation.'
  },
  {
    category: 'Premium & Payments',
    question: 'Do you offer refunds?',
    answer: 'For Premium subscriptions, we don\'t offer refunds for partial months, but you can cancel anytime. For tournament entry fees, refunds depend on the organizer\'s policy and how far in advance you cancel. Check each tournament\'s specific refund policy.'
  },

  // Safety & Community
  {
    category: 'Safety & Community',
    question: 'How do you ensure player safety?',
    answer: 'We take safety seriously. All users must verify their email. Tournament organizers and club admins are identity-verified. We have a reporting system for inappropriate behavior. Meetups should be in public places. We recommend informing someone about your chess games.'
  },
  {
    category: 'Safety & Community',
    question: 'How do I report inappropriate behavior?',
    answer: 'Click the three dots on any profile, post, or comment and select "Report". Choose the reason (harassment, spam, inappropriate content, etc.) and provide details. Our moderation team reviews all reports within 24 hours. Serious violations result in immediate suspension.'
  },
  {
    category: 'Safety & Community',
    question: 'What happens if I violate community guidelines?',
    answer: 'Violations result in warnings, temporary suspensions, or permanent bans depending on severity. Serious violations (harassment, threats, cheating) result in immediate removal. You\'ll receive an email explaining the violation. You can appeal decisions through our support team.'
  },
  {
    category: 'Safety & Community',
    question: 'Can I block another user?',
    answer: 'Yes. Go to their profile, click the three dots, and select "Block User". They won\'t be able to send you messages, game invitations, or see your profile. You won\'t be matched with them. You can unblock users anytime from your Account Settings.'
  },

  // Technical Support
  {
    category: 'Technical Support',
    question: 'The website isn\'t loading properly. What should I do?',
    answer: 'First, try refreshing the page or clearing your browser cache. Make sure you\'re using an up-to-date browser (Chrome, Firefox, Safari, or Edge). If issues persist, try logging out and back in. Contact support if problems continue.'
  },
  {
    category: 'Technical Support',
    question: 'I didn\'t receive the verification email. What now?',
    answer: 'Check your spam/junk folder. If it\'s not there, click "Resend Verification Email" on the verification notice. Make sure you entered your email correctly. Some email providers (especially school/work emails) may block automated emails. Try a personal email address.'
  },
  {
    category: 'Technical Support',
    question: 'I forgot my password. How do I reset it?',
    answer: 'Click "Forgot Password" on the login page. Enter your email address and you\'ll receive a password reset link. Click the link and enter your new password. The link expires in 1 hour for security. If you don\'t receive the email, check your spam folder.'
  },
  {
    category: 'Technical Support',
    question: 'Is ChessFam available on mobile?',
    answer: 'Yes! ChessFam is fully responsive and works great on mobile browsers (iOS Safari, Android Chrome). We\'re currently developing native iOS and Android apps with additional features. Sign up for our newsletter to be notified when they launch.'
  },
  {
    category: 'Technical Support',
    question: 'How do I contact support?',
    answer: 'For technical issues, email support@chessfam.com. For tournament-specific questions, contact the organizer directly through the tournament page. For general questions, check our Help Center or post in the Community Forum. We typically respond within 24 hours.'
  },
];

const categories = Array.from(new Set(faqs.map(f => f.category)));

const FAQ = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const navigate = useNavigate();

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleQuestion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <>
      <Helmet>
        <title>FAQ - Frequently Asked Questions | ChessFam</title>
        <meta name="description" content="Find answers to common questions about ChessFam - tournaments, clubs, games, account settings, and more." />
      </Helmet>

      <div className="min-h-screen py-8 px-4 md:px-8 max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-500/20 rounded-full mb-4">
            <HelpCircle className="w-8 h-8 text-primary-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">
            Find answers to common questions about ChessFam. Can't find what you're looking for? Visit our Help Center or contact support.
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl
                       text-white placeholder:text-white/40 focus:outline-none focus:border-primary-500
                       transition-colors"
            />
          </div>
        </motion.div>

        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedCategory === 'All'
                  ? 'bg-primary-500 text-white'
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              All
            </button>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedCategory === category
                    ? 'bg-primary-500 text-white'
                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </motion.div>

        {/* FAQ List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3 mb-12"
        >
          {filteredFAQs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-white/50 text-lg">No questions found matching your search.</p>
              <button
                onClick={() => setSearchQuery('')}
                className="mt-4 text-primary-400 hover:text-primary-300 transition-colors"
              >
                Clear search
              </button>
            </div>
          ) : (
            filteredFAQs.map((faq, index) => (
              <div
                key={index}
                className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10
                         hover:border-primary-500/30 transition-all overflow-hidden"
              >
                <button
                  onClick={() => toggleQuestion(index)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left
                           hover:bg-white/5 transition-colors"
                >
                  <div className="flex-1 pr-4">
                    <span className="text-xs text-primary-400 font-medium mb-1 block">
                      {faq.category}
                    </span>
                    <h3 className="text-white font-semibold text-lg">
                      {faq.question}
                    </h3>
                  </div>
                  <ChevronDown
                    className={`w-6 h-6 text-white/60 flex-shrink-0 transition-transform ${
                      openIndex === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="px-6 pb-5 border-t border-white/10">
                        <p className="text-white/70 leading-relaxed pt-4">
                          {faq.answer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))
          )}
        </motion.div>

        {/* Help Center CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-primary-500/20 via-primary-600/10 to-transparent
                   border border-primary-500/30 rounded-2xl p-8 text-center"
        >
          <h2 className="text-2xl font-bold text-white mb-3">
            Still have questions?
          </h2>
          <p className="text-white/70 mb-6 max-w-2xl mx-auto">
            Visit our comprehensive Help Center for detailed guides, tutorials, and documentation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/help')}
              className="px-8 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold
                       rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              Visit Help Center
            </button>
            <a
              href="mailto:support@chessfam.com"
              className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold
                       rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Mail className="w-5 h-5" />
              Contact Support
            </a>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default FAQ;
