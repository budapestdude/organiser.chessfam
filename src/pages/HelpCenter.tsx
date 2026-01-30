import { motion } from 'framer-motion';
import {
  BookOpen,
  Trophy,
  Users,
  Gamepad2,
  User,
  Crown,
  Shield,
  MessageCircle,
  Mail,
  HelpCircle,
  ArrowRight
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';

interface HelpTopic {
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  color: string;
}

const helpTopics: HelpTopic[] = [
  {
    title: 'Getting Started',
    description: 'New to ChessFam? Learn the basics of creating an account, setting up your profile, and navigating the platform.',
    icon: <BookOpen className="w-6 h-6" />,
    path: '/help/getting-started',
    color: 'from-blue-500/20 to-blue-600/10'
  },
  {
    title: 'Tournaments',
    description: 'Everything about finding, registering for, and organizing chess tournaments on ChessFam.',
    icon: <Trophy className="w-6 h-6" />,
    path: '/help/tournaments',
    color: 'from-gold-500/20 to-gold-600/10'
  },
  {
    title: 'Clubs',
    description: 'Join chess clubs, create your own, and connect with local chess communities.',
    icon: <Users className="w-6 h-6" />,
    path: '/help/clubs',
    color: 'from-green-500/20 to-green-600/10'
  },
  {
    title: 'Games & Matching',
    description: 'Find opponents, arrange games, record results, and track your chess progress.',
    icon: <Gamepad2 className="w-6 h-6" />,
    path: '/help/games',
    color: 'from-purple-500/20 to-purple-600/10'
  },
  {
    title: 'Account & Profile',
    description: 'Manage your account settings, update your profile, and customize your experience.',
    icon: <User className="w-6 h-6" />,
    path: '/help/account',
    color: 'from-pink-500/20 to-pink-600/10'
  },
  {
    title: 'Premium',
    description: 'Learn about Premium features, billing, and how to get the most out of your subscription.',
    icon: <Crown className="w-6 h-6" />,
    path: '/help/premium',
    color: 'from-yellow-500/20 to-yellow-600/10'
  },
  {
    title: 'Safety & Community',
    description: 'Community guidelines, safety tips, and how to report issues or inappropriate behavior.',
    icon: <Shield className="w-6 h-6" />,
    path: '/help/safety',
    color: 'from-red-500/20 to-red-600/10'
  },
];

const HelpCenter = () => {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Help Center | ChessFam</title>
        <meta name="description" content="Find comprehensive guides and answers to all your ChessFam questions. Learn about tournaments, clubs, games, and more." />
      </Helmet>

      <div className="min-h-screen py-8 px-4 md:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-500/20 rounded-full mb-6">
            <HelpCircle className="w-10 h-10 text-primary-400" />
          </div>
          <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-4">
            How can we help you?
          </h1>
          <p className="text-white/70 text-xl max-w-2xl mx-auto">
            Find guides, tutorials, and answers to common questions about ChessFam.
          </p>
        </motion.div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12"
        >
          <button
            onClick={() => navigate('/faq')}
            className="p-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl
                     text-left transition-all group"
          >
            <MessageCircle className="w-8 h-8 text-primary-400 mb-3" />
            <h3 className="text-white font-semibold text-lg mb-2 group-hover:text-primary-400 transition-colors">
              FAQ
            </h3>
            <p className="text-white/60 text-sm">
              Quick answers to frequently asked questions
            </p>
          </button>

          <a
            href="mailto:support@chessfam.com"
            className="p-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl
                     text-left transition-all group"
          >
            <Mail className="w-8 h-8 text-primary-400 mb-3" />
            <h3 className="text-white font-semibold text-lg mb-2 group-hover:text-primary-400 transition-colors">
              Contact Support
            </h3>
            <p className="text-white/60 text-sm">
              Get help from our support team
            </p>
          </a>

          <button
            onClick={() => navigate('/tournaments')}
            className="p-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl
                     text-left transition-all group"
          >
            <BookOpen className="w-8 h-8 text-primary-400 mb-3" />
            <h3 className="text-white font-semibold text-lg mb-2 group-hover:text-primary-400 transition-colors">
              Video Tutorials
            </h3>
            <p className="text-white/60 text-sm">
              Watch step-by-step video guides (coming soon)
            </p>
          </button>
        </motion.div>

        {/* Help Topics Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-white mb-6">Browse by Topic</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {helpTopics.map((topic, index) => (
              <motion.button
                key={topic.path}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                onClick={() => navigate(topic.path)}
                className={`p-6 bg-gradient-to-br ${topic.color} border border-white/10
                         rounded-xl text-left transition-all hover:scale-[1.02] group`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center text-white">
                    {topic.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold text-xl mb-2 flex items-center justify-between">
                      {topic.title}
                      <ArrowRight className="w-5 h-5 text-white/40 group-hover:text-white group-hover:translate-x-1 transition-all" />
                    </h3>
                    <p className="text-white/70 leading-relaxed">
                      {topic.description}
                    </p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Popular Articles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-white mb-6">Popular Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { title: 'How to Register for a Tournament', path: '/help/tournaments' },
              { title: 'Understanding Chess Ratings', path: '/help/games' },
              { title: 'Becoming a Verified User', path: '/help/account' },
              { title: 'Creating Your First Club', path: '/help/clubs' },
              { title: 'Premium Features Explained', path: '/help/premium' },
              { title: 'Community Safety Guidelines', path: '/help/safety' },
            ].map((article, index) => (
              <button
                key={index}
                onClick={() => navigate(article.path)}
                className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg
                         text-left transition-all group flex items-center justify-between"
              >
                <span className="text-white font-medium">{article.title}</span>
                <ArrowRight className="w-5 h-5 text-white/40 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </button>
            ))}
          </div>
        </motion.div>

        {/* Still Need Help CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-br from-primary-500/20 via-primary-600/10 to-transparent
                   border border-primary-500/30 rounded-2xl p-8 text-center"
        >
          <h2 className="text-2xl font-bold text-white mb-3">
            Can't find what you're looking for?
          </h2>
          <p className="text-white/70 mb-6 max-w-2xl mx-auto">
            Our support team is here to help. Send us an email and we'll get back to you within 24 hours.
          </p>
          <a
            href="mailto:support@chessfam.com"
            className="inline-flex items-center gap-2 px-8 py-3 bg-primary-500 hover:bg-primary-600
                     text-white font-semibold rounded-lg transition-colors"
          >
            <Mail className="w-5 h-5" />
            Contact Support
          </a>
        </motion.div>
      </div>
    </>
  );
};

export default HelpCenter;
