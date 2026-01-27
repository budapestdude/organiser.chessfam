import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useStore } from '../../store';
import NotificationCenter from '../NotificationCenter';
import {
  LayoutDashboard,
  Trophy,
  Building2,
  BarChart3,
  Euro,
  LogOut,
  User,
  ChevronLeft,
  Menu,
  X,
  TestTube2,
} from 'lucide-react';

export default function OrganizerSidebar() {
  const location = useLocation();
  const { user, logout } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { path: '/tournaments', icon: Trophy, label: 'Tournaments' },
    { path: '/clubs', icon: Building2, label: 'Clubs' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/financials', icon: Euro, label: 'Financials' },
    { path: '/pairings-test', icon: TestTube2, label: 'Pairings Test' },
  ];

  const isActive = (path: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    await logout();
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#1a1a2e] border-b border-white/10 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-white">Organizer Hub</h1>
          <div className="flex items-center gap-2">
            <NotificationCenter />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`w-64 bg-[#1a1a2e] border-r border-white/10 min-h-screen flex flex-col fixed left-0 top-0 z-40 transition-transform duration-300 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <a
              href={import.meta.env.VITE_MAIN_APP_URL || 'https://chessfam.com'}
              className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="text-sm">Back to ChessFam</span>
            </a>
            <div className="hidden lg:block">
              <NotificationCenter />
            </div>
          </div>
          <h1 className="text-xl font-bold text-white">Organizer Hub</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={closeMobileMenu}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive(item.path, item.exact)
                      ? 'bg-gold-500/20 text-gold-400'
                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="flex-1">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-gold-500 to-gold-600 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-chess-darker" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-white/50 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 rounded-lg text-white/60 hover:bg-white/5 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
