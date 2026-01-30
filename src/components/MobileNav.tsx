import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Star, LayoutDashboard, MessageSquare, User } from 'lucide-react';
import { useStore } from '../store';

const MobileNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useStore((state) => state.user);
  const openAuthModal = useStore((state) => state.openAuthModal);

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Star, label: 'Locations', path: '/locations' },
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', requiresAuth: true },
    { icon: MessageSquare, label: 'Messages', path: '/messages', requiresAuth: true },
    { icon: User, label: 'Profile', path: '/profile', requiresAuth: true },
  ];

  const handleNavClick = (item: typeof navItems[0]) => {
    if (item.requiresAuth && !user) {
      openAuthModal('login');
      return;
    }
    navigate(item.path);
  };

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-chess-darker/95 backdrop-blur-xl border-t border-white/10 md:hidden">
      <div className="flex items-center justify-around py-2 px-2 safe-area-pb">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => handleNavClick(item)}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors
                      ${isActive(item.path)
                        ? 'text-gold-400'
                        : 'text-white/50 hover:text-white/70'
                      }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-xs">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default MobileNav;
