import { useNavigate } from 'react-router-dom';
import { Crown, Heart, MessageSquare, LogOut, User, LayoutDashboard, Building2 } from 'lucide-react';
import { useStore } from '../store';

const Navigation = () => {
  const navigate = useNavigate();
  const user = useStore((state) => state.user);
  const openAuthModal = useStore((state) => state.openAuthModal);
  const logout = useStore((state) => state.logout);

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
            <nav className="hidden md:flex items-center gap-4 text-sm">
              <button onClick={() => navigate('/locations')} className="text-white/70 hover:text-white transition-colors">
                Find a Game
              </button>
              <button onClick={() => navigate('/tournaments')} className="text-white/70 hover:text-white transition-colors">
                Tournaments
              </button>
              <button onClick={() => navigate('/masters')} className="text-white/70 hover:text-white transition-colors">
                Masters
              </button>
              <button onClick={() => navigate('/clubs')} className="text-white/70 hover:text-white transition-colors">
                Clubs
              </button>
              <button onClick={() => navigate('/register-venue')} className="px-3 py-1.5 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-lg hover:bg-orange-500/30 transition-colors">
                Add Your Venue
              </button>
            </nav>
          </div>

          {user ? (
            <div className="flex items-center gap-3 text-sm">
              <button onClick={() => navigate('/dashboard')} className="text-white/70 hover:text-white flex items-center gap-1">
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden md:inline">Dashboard</span>
              </button>
              {user.is_admin && (
                <button onClick={() => navigate('/admin/venues')} className="text-gold-400 hover:text-gold-300 flex items-center gap-1">
                  <Building2 className="w-4 h-4" />
                  <span className="hidden md:inline">Admin</span>
                </button>
              )}
              <button onClick={() => navigate('/favorites')} className="text-white/70 hover:text-white flex items-center gap-1">
                <Heart className="w-4 h-4" />
                <span className="hidden md:inline">Favorites</span>
              </button>
              <button onClick={() => navigate('/messages')} className="text-white/70 hover:text-white flex items-center gap-1">
                <MessageSquare className="w-4 h-4" />
                <span className="hidden md:inline">Messages</span>
              </button>
              <button onClick={() => navigate('/profile')} className="text-white/70 hover:text-white flex items-center gap-1">
                <User className="w-4 h-4" />
                <span className="hidden md:inline">{user.name}</span>
              </button>
              <button onClick={logout} className="text-white/70 hover:text-white flex items-center gap-1">
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-sm">
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
