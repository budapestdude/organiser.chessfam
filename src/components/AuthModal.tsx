import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, Crown, Loader2 } from 'lucide-react';
import { useStore } from '../store';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

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
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

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

  const handleGoogleSignIn = () => {
    setIsGoogleLoading(true);
    setLocalError('');
    // Redirect to backend Google OAuth endpoint
    window.location.href = `${API_URL}/auth/google`;
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
                disabled={isLoading || isGoogleLoading}
                className="w-full py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-chess-darker
                         font-semibold rounded-xl hover:from-gold-400 hover:to-gold-500 transition-all
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Loading...' : (authMode === 'login' ? 'Sign In' : 'Create Account')}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-white/40 text-sm">or</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Google Sign-In */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading || isGoogleLoading}
              className="w-full py-3 bg-white text-gray-800 font-semibold rounded-xl
                       hover:bg-gray-100 transition-all flex items-center justify-center gap-3
                       disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGoogleLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              {isGoogleLoading ? 'Redirecting...' : 'Continue with Google'}
            </button>

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
