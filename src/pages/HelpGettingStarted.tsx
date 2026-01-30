import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, CheckCircle } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';

const HelpGettingStarted = () => {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Getting Started Guide | ChessFam Help Center</title>
        <meta name="description" content="Learn how to get started with ChessFam - create an account, set up your profile, and start exploring tournaments and clubs." />
      </Helmet>

      <div className="min-h-screen py-8 px-4 md:px-8 max-w-4xl mx-auto">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate('/help')}
          className="flex items-center gap-2 text-white/60 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Help Center
        </motion.button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded-full mb-6">
            <BookOpen className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
            Getting Started with ChessFam
          </h1>
          <p className="text-white/70 text-lg">
            Welcome to ChessFam! This guide will help you create an account, set up your profile, and start exploring the platform.
          </p>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="prose prose-invert max-w-none"
        >
          <div className="space-y-8">
            {/* Section 1 */}
            <section className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 bg-primary-500/20 rounded-full text-primary-400 text-sm font-bold">
                  1
                </span>
                Creating Your Account
              </h2>
              <div className="text-white/80 space-y-4">
                <p>
                  Getting started with ChessFam is quick and easy:
                </p>
                <ul className="space-y-2 list-none pl-0">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Click the <strong>"Sign Up"</strong> button in the top navigation</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Enter your <strong>name</strong>, <strong>email address</strong>, and create a <strong>password</strong></span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Check your email inbox for a <strong>verification email</strong></span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Click the verification link to <strong>activate your account</strong></span>
                  </li>
                </ul>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mt-4">
                  <p className="text-sm text-blue-200 mb-0">
                    <strong>Tip:</strong> If you don't receive the verification email within a few minutes, check your spam folder. You can also click "Resend Verification Email" on the notice banner.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 2 */}
            <section className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 bg-primary-500/20 rounded-full text-primary-400 text-sm font-bold">
                  2
                </span>
                Setting Up Your Profile
              </h2>
              <div className="text-white/80 space-y-4">
                <p>
                  Make a great first impression by completing your profile:
                </p>
                <ul className="space-y-2 list-none pl-0">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span><strong>Upload a profile picture</strong> - Shows you're a real person</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span><strong>Add your location</strong> - Find local tournaments and clubs near you</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span><strong>Write a bio</strong> - Tell others about your chess journey</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span><strong>Set your chess rating</strong> - Helps match you with appropriate opponents</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span><strong>Add preferred time controls</strong> - Blitz, rapid, or classical</span>
                  </li>
                </ul>
                <p>
                  To edit your profile, click on your profile picture in the navigation and select <strong>"Profile"</strong>.
                </p>
              </div>
            </section>

            {/* Section 3 */}
            <section className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 bg-primary-500/20 rounded-full text-primary-400 text-sm font-bold">
                  3
                </span>
                Exploring Tournaments
              </h2>
              <div className="text-white/80 space-y-4">
                <p>
                  ChessFam makes it easy to find and register for chess tournaments:
                </p>
                <ul className="space-y-2 list-none pl-0">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Browse tournaments on the <strong>Tournaments</strong> page</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Use filters to find tournaments by <strong>location, date, format</strong>, and <strong>entry fee</strong></span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Click on a tournament to see details like venue, prize pool, and participants</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Click <strong>"Register Now"</strong> to sign up (payment if there's an entry fee)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Receive a <strong>confirmation email</strong> with all tournament details</span>
                  </li>
                </ul>
                <p>
                  You'll get a reminder email 24 hours before the tournament starts!
                </p>
              </div>
            </section>

            {/* Section 4 */}
            <section className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 bg-primary-500/20 rounded-full text-primary-400 text-sm font-bold">
                  4
                </span>
                Joining Chess Clubs
              </h2>
              <div className="text-white/80 space-y-4">
                <p>
                  Connect with local chess players by joining clubs:
                </p>
                <ul className="space-y-2 list-none pl-0">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Go to the <strong>Clubs</strong> page to browse available clubs</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Filter by location to find clubs near you</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Click on a club to read about their activities, meeting schedule, and members</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Click <strong>"Join Club"</strong> to become a member</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Access club-exclusive tournaments, events, and discussions</span>
                  </li>
                </ul>
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mt-4">
                  <p className="text-sm text-green-200 mb-0">
                    <strong>Benefits:</strong> Club members often get discounts on tournament entry fees, access to training materials, and invitations to special events!
                  </p>
                </div>
              </div>
            </section>

            {/* Section 5 */}
            <section className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 bg-primary-500/20 rounded-full text-primary-400 text-sm font-bold">
                  5
                </span>
                Finding Games
              </h2>
              <div className="text-white/80 space-y-4">
                <p>
                  ChessFam helps you find opponents for casual or competitive games:
                </p>
                <ul className="space-y-2 list-none pl-0">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Click <strong>"Find a Game"</strong> to see available players</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Filter by rating range, location, and time control preference</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Send a game invitation with a message</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Coordinate a meeting time and location</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Record the game result to update both players' ratings</span>
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 6 */}
            <section className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 bg-primary-500/20 rounded-full text-primary-400 text-sm font-bold">
                  6
                </span>
                Next Steps
              </h2>
              <div className="text-white/80 space-y-4">
                <p>
                  Now that you're set up, here are some things you can do:
                </p>
                <ul className="space-y-2 list-none pl-0">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span><strong>Explore the Feed</strong> to see what other players are up to</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span><strong>Follow players</strong> to stay updated on their games and tournaments</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span><strong>Favorite tournaments and clubs</strong> to easily find them later</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span><strong>Consider Premium</strong> for ad-free experience and advanced features</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span><strong>Get verified</strong> to organize your own tournaments and create clubs</span>
                  </li>
                </ul>
              </div>
            </section>
          </div>
        </motion.div>

        {/* Help Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-12 bg-gradient-to-br from-primary-500/20 via-primary-600/10 to-transparent
                   border border-primary-500/30 rounded-xl p-6"
        >
          <h3 className="text-xl font-bold text-white mb-4">Need more help?</h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => navigate('/faq')}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold
                       rounded-lg transition-colors"
            >
              View FAQ
            </button>
            <button
              onClick={() => navigate('/help')}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold
                       rounded-lg transition-colors"
            >
              Back to Help Center
            </button>
            <a
              href="mailto:support@chessfam.com"
              className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold
                       rounded-lg transition-colors text-center"
            >
              Contact Support
            </a>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default HelpGettingStarted;
