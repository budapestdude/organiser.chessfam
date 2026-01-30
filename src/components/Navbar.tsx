import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Crown } from 'lucide-react';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Play a Master', href: '#play-master' },
    { name: 'Tournaments', href: '#tournaments' },
    { name: 'Find a Club', href: '#find-club' },
    { name: 'Find a Game', href: '#find-game' },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? 'bg-chess-darker/90 backdrop-blur-xl shadow-2xl shadow-black/20'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <a href="#" className="flex items-center gap-3 group">
            <div className="relative">
              <Crown className="w-8 h-8 text-gold-400 group-hover:text-gold-300 transition-colors" />
              <div className="absolute inset-0 blur-lg bg-gold-400/30 group-hover:bg-gold-300/40 transition-colors" />
            </div>
            <span className="text-2xl font-display font-bold text-white tracking-tight">
              Chess<span className="text-gold-400">Fam</span>
            </span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="px-5 py-2.5 text-sm font-medium text-white/80 hover:text-white
                         rounded-lg hover:bg-white/5 transition-all duration-300"
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* CTA Button */}
          <div className="hidden md:flex items-center gap-4">
            <button className="px-6 py-2.5 text-sm font-medium text-white/80 hover:text-white transition-colors">
              Sign In
            </button>
            <button className="px-6 py-2.5 bg-gradient-to-r from-gold-500 to-gold-600 text-chess-darker
                             font-semibold rounded-lg hover:from-gold-400 hover:to-gold-500
                             transition-all duration-300 transform hover:scale-105 shadow-lg shadow-gold-500/25">
              Get Started
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-white/80 hover:text-white"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-chess-darker/95 backdrop-blur-xl border-t border-white/10"
          >
            <div className="px-6 py-4 space-y-2">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-4 py-3 text-white/80 hover:text-white hover:bg-white/5
                           rounded-lg transition-colors"
                >
                  {link.name}
                </a>
              ))}
              <div className="pt-4 space-y-2">
                <button className="w-full px-4 py-3 text-white/80 hover:text-white text-left rounded-lg
                                 hover:bg-white/5 transition-colors">
                  Sign In
                </button>
                <button className="w-full px-4 py-3 bg-gradient-to-r from-gold-500 to-gold-600
                                 text-chess-darker font-semibold rounded-lg">
                  Get Started
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
