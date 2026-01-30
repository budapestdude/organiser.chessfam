import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Heart, MessageSquare, LogOut, User, LayoutDashboard, Building2, Menu, X, Trophy, Gamepad2, Brain, HelpCircle, Users } from 'lucide-react';
import { useStore } from '../store';

const Navigation = () => {
  const navigate = useNavigate();
  const user = useStore((state) => state.user);
  const openAuthModal = useStore((state) => state.openAuthModal);
  const logout = useStore((state) => state.logout);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavigate = (path: string) => {
    navigate(path);
    setMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
  };

  return (
    <header className="bg-white/5 border-b border-white/10 sticky top-0 z-50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button onClick={() => navigate('/')} className="flex items-center gap-2">
              <Crown className="w-6 h-6 text-gold-400" />
              <h1 className="text-xl font-display font-bold text-white">
                Chess<span className="text-gold-400">Fam</span>
              </h1>
            </button>
          </div>

          {user ? (
            <div className="relative" ref={menuRef}>
              {/* Burger Menu Button */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-medium text-sm">
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <span className="hidden md:inline text-white text-sm">{user.name}</span>
                {menuOpen ? (
                  <X className="w-4 h-4 text-white/70" />
                ) : (
                  <Menu className="w-4 h-4 text-white/70" />
                )}
              </button>

              {/* Dropdown Menu */}
              {menuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-[#1a1a2e] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                  <div className="p-3 border-b border-white/10">
                    <p className="text-white font-medium">{user.name}</p>
                    <p className="text-white/50 text-sm">{user.email}</p>
                  </div>
                  <div className="py-2">
                    <button
                      onClick={() => handleNavigate('/dashboard')}
                      className="w-full px-4 py-2.5 text-left text-white/80 hover:bg-white/5 hover:text-white flex items-center gap-3 transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </button>
                    <button
                      onClick={() => handleNavigate('/profile')}
                      className="w-full px-4 py-2.5 text-left text-white/80 hover:bg-white/5 hover:text-white flex items-center gap-3 transition-colors"
                    >
                      <User className="w-4 h-4" />
                      Profile
                    </button>
                    <button
                      onClick={() => handleNavigate('/premium')}
                      className="w-full px-4 py-2.5 text-left text-yellow-400 hover:bg-white/5 hover:text-yellow-300 flex items-center gap-3 transition-colors"
                    >
                      <Crown className="w-4 h-4" />
                      Upgrade to Premium
                    </button>
                    {user.is_admin && (
                      <button
                        onClick={() => handleNavigate('/admin/venues')}
                        className="w-full px-4 py-2.5 text-left text-gold-400 hover:bg-white/5 hover:text-gold-300 flex items-center gap-3 transition-colors"
                      >
                        <Building2 className="w-4 h-4" />
                        Admin
                      </button>
                    )}
                    <button
                      onClick={() => handleNavigate('/favorites')}
                      className="w-full px-4 py-2.5 text-left text-white/80 hover:bg-white/5 hover:text-white flex items-center gap-3 transition-colors"
                    >
                      <Heart className="w-4 h-4" />
                      Favorites
                    </button>
                    <button
                      onClick={() => handleNavigate('/messages')}
                      className="w-full px-4 py-2.5 text-left text-white/80 hover:bg-white/5 hover:text-white flex items-center gap-3 transition-colors"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Messages
                    </button>
                    <button
                      onClick={() => handleNavigate('/my-games')}
                      className="w-full px-4 py-2.5 text-left text-white/80 hover:bg-white/5 hover:text-white flex items-center gap-3 transition-colors"
                    >
                      <Gamepad2 className="w-4 h-4" />
                      My Games
                    </button>
                    <button
                      onClick={() => handleNavigate('/analysis')}
                      className="w-full px-4 py-2.5 text-left text-white/80 hover:bg-white/5 hover:text-white flex items-center gap-3 transition-colors"
                    >
                      <Brain className="w-4 h-4" />
                      Analysis Board
                    </button>
                    <button
                      onClick={() => handleNavigate('/my-tournaments')}
                      className="w-full px-4 py-2.5 text-left text-white/80 hover:bg-white/5 hover:text-white flex items-center gap-3 transition-colors"
                    >
                      <Trophy className="w-4 h-4" />
                      My Tournaments
                    </button>
                    <button
                      onClick={() => handleNavigate('/professionals')}
                      className="w-full px-4 py-2.5 text-left text-white/80 hover:bg-white/5 hover:text-white flex items-center gap-3 transition-colors"
                    >
                      <Users className="w-4 h-4" />
                      Hire a Pro
                    </button>
                  </div>
                  <div className="py-2 border-t border-white/10">
                    <button
                      onClick={() => handleNavigate('/help')}
                      className="w-full px-4 py-2.5 text-left text-white/80 hover:bg-white/5 hover:text-white flex items-center gap-3 transition-colors"
                    >
                      <HelpCircle className="w-4 h-4" />
                      Help Center
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2.5 text-left text-red-400 hover:bg-white/5 hover:text-red-300 flex items-center gap-3 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3 text-sm">
              <button
                onClick={() => navigate('/help')}
                className="hidden md:inline text-white/70 hover:text-white transition-colors"
              >
                Help
              </button>
              <button
                onClick={() => navigate('/premium')}
                className="hidden md:inline text-white/70 hover:text-white transition-colors"
              >
                Premium
              </button>
              <button
                onClick={() => openAuthModal('login')}
                className="text-white/70 hover:text-white transition-colors"
              >
                Log in
              </button>
              <button
                onClick={() => openAuthModal('signup')}
                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-400 hover:to-orange-500 transition-all"
              >
                Sign up
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navigation;
