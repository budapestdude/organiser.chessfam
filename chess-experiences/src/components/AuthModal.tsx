import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, Crown } from 'lucide-react';
import { useStore } from '../store';

const AuthModal = () => {
  const isAuthModalOpen = useStore((state) => state.isAuthModalOpen);
  const authMode = useStore((state) => state.authMode);
  const closeAuthModal = useStore((state) => state.closeAuthModal);
  const login = useStore((state) => state.login);
  const signup = useStore((state) => state.signup);
  const openAuthModal = useStore((state) => state.openAuthModal);
  const isLoading = useStore((state) => state.isLoading);
  const storeError = useStore((state) => state.error);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    // Basic validation
    if (!email || !password || (authMode === 'signup' && !name)) {
      setLocalError('Please fill in all fields');
      return;
    }

    try {
      if (authMode === 'signup') {
        await signup(name, email, password);
      } else {
        await login(email, password);
      }
      // Success - modal will close automatically via store
      setEmail('');
      setPassword('');
      setName('');
    } catch (error) {
      // Error is already set in store
      console.error('Auth error:', error);
    }
  };

  const displayError = localError || storeError;

  return (
    <AnimatePresence>
      {isAuthModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeAuthModal}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-chess-dark border border-white/10 rounded-2xl p-8"
          >
            {/* Close Button */}
            <button
              onClick={closeAuthModal}
              className="absolute top-4 right-4 p-2 text-white/50 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Crown className="w-8 h-8 text-gold-400" />
                <span className="text-2xl font-display font-bold text-white">
                  Chess<span className="text-gold-400">Fam</span>
                </span>
              </div>
              <h2 className="text-xl font-semibold text-white">
                {authMode === 'login' ? 'Welcome back' : 'Create your account'}
              </h2>
              <p className="text-white/50 text-sm mt-1">
                {authMode === 'login'
                  ? 'Sign in to book experiences'
                  : 'Join the chess community'}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {authMode === 'signup' && (
                <div>
                  <label className="block text-sm text-white/70 mb-2">Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      disabled={isLoading}
                      className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl
                               text-white placeholder-white/30 focus:border-gold-500 focus:outline-none
                               transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm text-white/70 mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    disabled={isLoading}
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl
                             text-white placeholder-white/30 focus:border-gold-500 focus:outline-none
                             transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={isLoading}
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl
                             text-white placeholder-white/30 focus:border-gold-500 focus:outline-none
                             transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {displayError && (
                <p className="text-red-400 text-sm text-center">{displayError}</p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-chess-darker
                         font-semibold rounded-xl hover:from-gold-400 hover:to-gold-500 transition-all
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Loading...' : (authMode === 'login' ? 'Sign In' : 'Create Account')}
              </button>
            </form>

            {/* Toggle Mode */}
            <p className="text-center text-white/50 text-sm mt-6">
              {authMode === 'login' ? "Don't have an account?" : 'Already have an account?'}
              <button
                onClick={() => openAuthModal(authMode === 'login' ? 'signup' : 'login')}
                className="text-gold-400 hover:text-gold-300 ml-1 font-medium"
              >
                {authMode === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;
