import { Crown, Twitter, Instagram, Youtube, Linkedin, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const footerLinks = {
    'Experiences': [
      { name: 'Play a Master', href: '/masters' },
      { name: 'Tournaments', href: '/tournaments' },
      { name: 'Find a Club', href: '/clubs' },
      { name: 'Find Players', href: '/players' },
    ],
    'Community': [
      { name: 'Feed', href: '/feed' },
      { name: 'Locations', href: '/locations' },
      { name: 'Achievements', href: '/achievements' },
      { name: 'Premium', href: '/premium' },
    ],
    'Resources': [
      { name: 'FAQ', href: '/faq' },
      { name: 'Help Center', href: '/help' },
      { name: 'Getting Started', href: '/help/getting-started' },
      { name: 'Register Venue', href: '/register-venue' },
    ],
    'Legal': [
      { name: 'Privacy Policy', href: '#privacy' },
      { name: 'Terms of Service', href: '#terms' },
      { name: 'Cookie Policy', href: '#cookies' },
      { name: 'Refund Policy', href: '#refunds' },
    ],
  };

  const socialLinks = [
    { icon: Twitter, href: 'https://twitter.com/chessfam', label: 'Twitter' },
    { icon: Instagram, href: 'https://instagram.com/chessfam', label: 'Instagram' },
    { icon: Youtube, href: 'https://youtube.com/@chessfam', label: 'YouTube' },
    { icon: Linkedin, href: 'https://linkedin.com/company/chessfam', label: 'LinkedIn' },
  ];

  return (
    <footer className="relative bg-chess-darker border-t border-white/5">
      {/* Newsletter Section */}
      <div className="border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="text-center lg:text-left">
              <h3 className="text-2xl md:text-3xl font-display font-bold text-white mb-2">
                Stay in the Game
              </h3>
              <p className="text-white/50">
                Get exclusive updates on tournaments, new masters, and chess tips.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-xl border border-white/10
                           focus-within:border-gold-500/50 transition-colors">
                <Mail className="w-5 h-5 text-white/40" />
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="bg-transparent text-white placeholder-white/40 outline-none w-full sm:w-64"
                />
              </div>
              <button className="px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-chess-darker
                               font-semibold rounded-xl hover:from-gold-400 hover:to-gold-500 transition-all
                               whitespace-nowrap">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-6">
              <div className="relative">
                <Crown className="w-8 h-8 text-gold-400" />
                <div className="absolute inset-0 blur-lg bg-gold-400/30" />
              </div>
              <span className="text-2xl font-display font-bold text-white tracking-tight">
                Chess<span className="text-gold-400">Fam</span>
              </span>
            </Link>
            <p className="text-white/50 mb-6 max-w-sm">
              The premier platform for premium chess experiences. Connect with masters,
              compete in tournaments, and find your chess community.
            </p>
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center
                           text-white/50 hover:text-white hover:bg-white/10 transition-all"
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-white font-semibold mb-4">{category}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.name}>
                    {link.href.startsWith('#') ? (
                      <a
                        href={link.href}
                        className="text-white/50 hover:text-white transition-colors text-sm"
                      >
                        {link.name}
                      </a>
                    ) : (
                      <Link
                        to={link.href}
                        className="text-white/50 hover:text-white transition-colors text-sm"
                      >
                        {link.name}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/40">
            <p>&copy; {new Date().getFullYear()} ChessFam. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <a href="#privacy" className="hover:text-white transition-colors">Privacy</a>
              <a href="#terms" className="hover:text-white transition-colors">Terms</a>
              <Link to="/faq" className="hover:text-white transition-colors">FAQ</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
