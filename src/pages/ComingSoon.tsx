import { motion } from 'framer-motion';
import { Crown, Users, Trophy, MapPin, Calendar, Mail, Bell } from 'lucide-react';
import { useState } from 'react';

const ComingSoon = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Add email subscription API call here
    setSubscribed(true);
    setEmail('');
    setTimeout(() => setSubscribed(false), 5000);
  };

  const features = [
    {
      icon: <Users className="w-8 h-8" />,
      title: 'Find Chess Players',
      description: 'Connect with chess players of all skill levels in your area'
    },
    {
      icon: <Trophy className="w-8 h-8" />,
      title: 'Join Tournaments',
      description: 'Participate in local and online chess tournaments'
    },
    {
      icon: <MapPin className="w-8 h-8" />,
      title: 'Discover Venues',
      description: 'Find chess clubs, cafes, and playing locations near you'
    },
    {
      icon: <Calendar className="w-8 h-8" />,
      title: 'Schedule Games',
      description: 'Book games with players and track your match history'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-chess-darker via-[#0f0f1f] to-chess-darker overflow-hidden">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L30 60M0 30L60 30' stroke='%23d4af37' stroke-width='0.5' fill='none'/%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }} />
      </div>

      {/* Floating Chess Pieces */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-gold-400/10 text-8xl"
            initial={{
              x: Math.random() * window.innerWidth,
              y: -100,
              rotate: 0
            }}
            animate={{
              y: window.innerHeight + 100,
              rotate: 360,
              x: Math.random() * window.innerWidth
            }}
            transition={{
              duration: 20 + Math.random() * 10,
              repeat: Infinity,
              delay: i * 2,
              ease: 'linear'
            }}
          >
            {['♔', '♕', '♖', '♗', '♘', '♙'][i]}
          </motion.div>
        ))}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-20">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          {/* Logo/Brand */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="mb-8"
          >
            <div className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-gold-500 to-gold-600 rounded-3xl shadow-2xl mb-6 transform hover:rotate-6 transition-transform duration-300">
              <Crown className="w-16 h-16 text-chess-darker" />
            </div>
            <h1 className="text-5xl md:text-7xl font-display font-bold text-white mb-4">
              ChessFam
            </h1>
            <p className="text-2xl md:text-3xl text-gold-400 font-semibold">
              Find Your Perfect Chess Experience
            </p>
          </motion.div>

          {/* Coming Soon Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gold-500/20 border border-gold-500/30 rounded-full mb-8"
          >
            <Bell className="w-5 h-5 text-gold-400 animate-pulse" />
            <span className="text-gold-400 font-semibold text-lg">Launching Soon</span>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-xl text-white/70 max-w-3xl mx-auto mb-12 leading-relaxed"
          >
            We're building the ultimate platform to connect chess players, discover venues,
            join tournaments, and schedule games with players around the world.
          </motion.p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.2 + index * 0.1 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all group"
            >
              <div className="text-gold-400 mb-4 group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-white/60 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Email Subscription */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.6 }}
          className="max-w-2xl mx-auto"
        >
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg border border-white/20 rounded-3xl p-8 md:p-12 shadow-2xl">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 text-center">
              Get Early Access
            </h2>
            <p className="text-white/70 text-center mb-8 text-lg">
              Be the first to know when we launch. Join our waitlist for exclusive early access and updates.
            </p>

            {subscribed ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-green-500/20 border border-green-500/30 rounded-xl p-6 text-center"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-500/20 rounded-full mb-3">
                  <Mail className="w-6 h-6 text-green-400" />
                </div>
                <p className="text-green-400 font-semibold text-lg mb-1">Thank you for subscribing!</p>
                <p className="text-white/60">We'll notify you when we launch.</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="flex-1 px-6 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-gold-500 focus:bg-white/15 transition-all text-lg"
                />
                <button
                  type="submit"
                  className="px-8 py-4 bg-gradient-to-r from-gold-500 to-gold-600 text-chess-darker font-bold rounded-xl hover:from-gold-400 hover:to-gold-500 transition-all shadow-lg whitespace-nowrap text-lg"
                >
                  Notify Me
                </button>
              </form>
            )}
          </div>
        </motion.div>

        {/* Stats Counter */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 2 }}
          className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
        >
          {[
            { number: '10K+', label: 'Players Waiting' },
            { number: '500+', label: 'Venues Listed' },
            { number: '100+', label: 'Tournaments' },
            { number: '50+', label: 'Countries' }
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 2 + index * 0.1 }}
              className="group"
            >
              <div className="text-4xl md:text-5xl font-bold text-gold-400 mb-2 group-hover:scale-110 transition-transform">
                {stat.number}
              </div>
              <div className="text-white/60 text-sm md:text-base">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Footer Links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 2.4 }}
          className="mt-20 text-center"
        >
          <div className="flex flex-wrap justify-center gap-8 text-white/50 text-sm">
            <a href="#" className="hover:text-gold-400 transition-colors">About</a>
            <a href="#" className="hover:text-gold-400 transition-colors">Features</a>
            <a href="#" className="hover:text-gold-400 transition-colors">Contact</a>
            <a href="#" className="hover:text-gold-400 transition-colors">Privacy</a>
            <a href="#" className="hover:text-gold-400 transition-colors">Terms</a>
          </div>
          <p className="mt-8 text-white/30 text-sm">
            © {new Date().getFullYear()} ChessFam. All rights reserved.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default ComingSoon;
