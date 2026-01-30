import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, CheckCircle, ArrowRight, FileCheck, Users } from 'lucide-react';

const TournamentPending = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen py-8 px-4 md:px-8 max-w-3xl mx-auto flex flex-col items-center justify-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="w-24 h-24 rounded-full bg-gold-500/20 flex items-center justify-center mb-8"
      >
        <Clock className="w-12 h-12 text-gold-400" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
          Tournament Submitted Successfully!
        </h1>
        <p className="text-lg text-white/70 mb-2">
          Your tournament is now pending review by our team.
        </p>
        <p className="text-white/50">
          We'll review it shortly and notify you once it's approved.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="w-full bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 mb-8"
      >
        <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <FileCheck className="w-6 h-6 text-gold-400" />
          What happens next?
        </h2>

        <div className="space-y-6">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
              <span className="text-blue-400 font-bold">1</span>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Manual Review</h3>
              <p className="text-white/60 text-sm">
                Our team will review your tournament details to ensure quality and accuracy.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
              <span className="text-blue-400 font-bold">2</span>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Approval & Publication</h3>
              <p className="text-white/60 text-sm">
                Once approved, your tournament will be published and visible to all users.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
              <span className="text-blue-400 font-bold">3</span>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Email Notification</h3>
              <p className="text-white/60 text-sm">
                You'll receive an email confirmation when your tournament is live.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Players Can Register</h3>
              <p className="text-white/60 text-sm">
                Once live, players will be able to find and register for your tournament.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="w-full bg-gradient-to-br from-gold-500/10 to-gold-600/5 rounded-2xl p-6 border border-gold-500/20 mb-8"
      >
        <div className="flex items-start gap-3">
          <Users className="w-6 h-6 text-gold-400 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-white font-semibold mb-2">Review Time</h3>
            <p className="text-white/70 text-sm leading-relaxed">
              Most tournaments are reviewed within <strong className="text-gold-400">24 hours</strong>.
              Complex events or festivals may take slightly longer.
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex flex-col sm:flex-row gap-4 w-full"
      >
        <button
          onClick={() => navigate('/tournaments')}
          className="flex-1 px-8 py-4 bg-gold-500 text-chess-darker font-semibold rounded-xl
                   hover:bg-gold-400 transition-all shadow-lg hover:shadow-gold-500/20
                   flex items-center justify-center gap-2"
        >
          Browse Tournaments
          <ArrowRight className="w-5 h-5" />
        </button>

        <button
          onClick={() => navigate('/profile')}
          className="flex-1 px-8 py-4 bg-white/10 text-white font-semibold rounded-xl
                   hover:bg-white/20 transition-colors border border-white/10"
        >
          View My Profile
        </button>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-center text-white/40 text-sm mt-8"
      >
        Questions? Contact us at{' '}
        <a href="mailto:support@chessfam.com" className="text-gold-400 hover:text-gold-300 transition-colors">
          support@chessfam.com
        </a>
      </motion.p>
    </div>
  );
};

export default TournamentPending;
