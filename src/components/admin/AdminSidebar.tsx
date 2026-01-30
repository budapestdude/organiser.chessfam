import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  MapPin,
  Award,
  MessageSquare,
  CreditCard,
  ShieldCheck,
  ChevronLeft,
  Trophy,
  Building2,
  UserCheck,
  Layers,
  Sliders,
  BarChart3,
  HelpCircle,
  Mail,
  BookOpen,
  Settings,
  Briefcase,
} from 'lucide-react';

interface AdminSidebarProps {
  pendingCounts?: {
    venues: number;
    masters: number;
    professionals: number;
    claims: number;
    verifications: number;
    chessTitleVerifications: number;
  };
}

export default function AdminSidebar({ pendingCounts }: AdminSidebarProps) {
  const location = useLocation();

  const navItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { path: '/admin/users', icon: Users, label: 'Users' },
    {
      path: '/admin/venues',
      icon: MapPin,
      label: 'Venues',
      badge: pendingCounts?.venues,
    },
    {
      path: '/admin/clubs',
      icon: Building2,
      label: 'Clubs',
    },
    {
      path: '/admin/tournaments',
      icon: Trophy,
      label: 'Tournaments',
    },
    {
      path: '/admin/series',
      icon: Layers,
      label: 'Series',
    },
    {
      path: '/admin/blogs',
      icon: BookOpen,
      label: 'Blogs',
    },
    {
      path: '/admin/masters',
      icon: Award,
      label: 'Masters',
      badge: pendingCounts?.masters,
    },
    {
      path: '/admin/professional-applications',
      icon: Briefcase,
      label: 'Professionals',
      badge: pendingCounts?.professionals,
    },
    {
      path: '/admin/ownership',
      icon: ShieldCheck,
      label: 'Ownership',
      badge: pendingCounts?.claims,
    },
    {
      path: '/admin/verifications',
      icon: UserCheck,
      label: 'Verifications',
      badge: pendingCounts?.verifications,
    },
    {
      path: '/admin/chess-title-verifications',
      icon: Award,
      label: 'Chess Titles',
      badge: pendingCounts?.chessTitleVerifications,
    },
    { path: '/admin/reviews', icon: MessageSquare, label: 'Reviews' },
    { path: '/admin/payments', icon: CreditCard, label: 'Payments' },
    { path: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/admin/feed-algorithm', icon: Sliders, label: 'Feed Algorithm' },
    { path: '/admin/faq', icon: HelpCircle, label: 'FAQ' },
    { path: '/admin/email-templates', icon: Mail, label: 'Email Templates' },
  ];

  const settingsItems = [
    { path: '/admin/settings', icon: Settings, label: 'Platform Settings' },
    { path: '/admin/email-test', icon: Mail, label: 'Test Email' },
  ];

  const isActive = (path: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="w-64 bg-[#1a1a2e] border-r border-white/10 min-h-screen flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <Link to="/" className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
          <ChevronLeft className="w-4 h-4" />
          <span className="text-sm">Back to Site</span>
        </Link>
        <h1 className="text-xl font-bold text-white mt-4">Admin Panel</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive(item.path, item.exact)
                    ? 'bg-purple-500/20 text-purple-400'
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="flex-1">{item.label}</span>
                {item.badge && item.badge > 0 && (
                  <span className="px-2 py-0.5 text-xs bg-yellow-500/20 text-yellow-400 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>

        {/* Settings Section */}
        <div className="mt-8 pt-4 border-t border-white/10">
          <p className="px-4 text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
            Settings
          </p>
          <ul className="space-y-1">
            {settingsItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive(item.path)
                      ? 'bg-purple-500/20 text-purple-400'
                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="flex-1">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <p className="text-xs text-white/40 text-center">ChessFam Admin v1.0</p>
      </div>
    </aside>
  );
}
