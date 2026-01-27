import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { clubsAPI } from '../../api/clubs';
import type { Club } from '../../types';
import { ChevronLeft, Users, BarChart3, Calendar, MapPin, Building2 } from 'lucide-react';
import ClubAnalytics from './ClubAnalytics';

export default function ClubDetail() {
  const { id } = useParams<{ id: string }>();
  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'events' | 'analytics'>('overview');

  useEffect(() => {
    const fetchClub = async () => {
      if (!id) return;
      try {
        const data = await clubsAPI.getClubById(parseInt(id));
        setClub(data);
      } catch (error) {
        console.error('Failed to fetch club:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClub();
  }, [id]);

  const formatCurrency = (amount: number) => {
    if (!amount) return '€0';
    return new Intl.NumberFormat('en-IE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="w-12 h-12 border-4 border-gold-400/30 border-t-gold-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!club) {
    return (
      <div className="glass-card p-12 text-center">
        <h3 className="text-xl font-semibold text-white mb-2">Club not found</h3>
        <p className="text-white/60 mb-6">This club may have been deleted or you don't have access to it.</p>
        <Link
          to="/clubs"
          className="inline-flex px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-chess-darker font-semibold rounded-lg hover:from-gold-400 hover:to-gold-500 transition-all"
        >
          Back to Clubs
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Back Button */}
      <Link
        to="/clubs"
        className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Back to Clubs</span>
      </Link>

      {/* Header */}
      <div className="glass-card p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-white">{club.name}</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                club.is_active
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-gray-500/20 text-gray-400'
              }`}>
                {club.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-white/60">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{club.city}{club.country && `, ${club.country}`}</span>
              </div>
              {club.founded_year && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Founded {club.founded_year}</span>
                </div>
              )}
            </div>
          </div>
          <a
            href={`${import.meta.env.VITE_MAIN_APP_URL}/clubs/${club.id}/edit`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors"
          >
            Edit
          </a>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
          <div>
            <p className="text-xs text-white/40 mb-1">Members</p>
            <p className="text-lg font-semibold text-white">{club.member_count || 0}</p>
          </div>
          <div>
            <p className="text-xs text-white/40 mb-1">Membership Fee</p>
            <p className="text-lg font-semibold text-white">
              {club.membership_fee ? formatCurrency(club.membership_fee / 100) : 'Free'}
            </p>
          </div>
          <div>
            <p className="text-xs text-white/40 mb-1">Location</p>
            <p className="text-lg font-semibold text-white">{club.city}</p>
          </div>
          <div>
            <p className="text-xs text-white/40 mb-1">Status</p>
            <p className="text-lg font-semibold text-white">{club.is_active ? 'Active' : 'Inactive'}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/10 mb-6">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-gold-500 text-gold-500'
                : 'border-transparent text-white/60 hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Overview</span>
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors ${
              activeTab === 'members'
                ? 'border-gold-500 text-gold-500'
                : 'border-transparent text-white/60 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Members</span>
            <span className="px-2 py-0.5 bg-white/10 rounded-full text-xs">
              {club.member_count || 0}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors ${
              activeTab === 'events'
                ? 'border-gold-500 text-gold-500'
                : 'border-transparent text-white/60 hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Events</span>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors ${
              activeTab === 'analytics'
                ? 'border-gold-500 text-gold-500'
                : 'border-transparent text-white/60 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Analytics</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="glass-card p-6">
          <h2 className="text-xl font-bold text-white mb-4">Club Details</h2>

          {club.description && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-white/60 mb-2">Description</h3>
              <p className="text-white">{club.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-white/60 mb-2">Full Address</h3>
              <p className="text-white">
                {club.address || 'Not specified'}
              </p>
            </div>
            {club.website && (
              <div>
                <h3 className="text-sm font-medium text-white/60 mb-2">Website</h3>
                <a
                  href={club.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gold-400 hover:text-gold-300 transition-colors"
                >
                  {club.website}
                </a>
              </div>
            )}
            {club.contact_email && (
              <div>
                <h3 className="text-sm font-medium text-white/60 mb-2">Contact Email</h3>
                <a
                  href={`mailto:${club.contact_email}`}
                  className="text-gold-400 hover:text-gold-300 transition-colors"
                >
                  {club.contact_email}
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'members' && (
        <div className="glass-card p-6">
          <h2 className="text-xl font-bold text-white mb-4">Members</h2>
          <p className="text-white/60 mb-6">Manage club members, roles, and permissions.</p>
          <Link
            to={`/clubs/${id}/members`}
            className="inline-flex px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-chess-darker font-semibold rounded-lg hover:from-gold-400 hover:to-gold-500 transition-all duration-300 transform hover:scale-105"
          >
            View & Manage Members
          </Link>
        </div>
      )}

      {activeTab === 'events' && (
        <div className="glass-card p-6">
          <h2 className="text-xl font-bold text-white mb-4">Club Events</h2>
          <p className="text-white/60">Event management coming soon...</p>
        </div>
      )}

      {activeTab === 'analytics' && (
        <ClubAnalytics clubId={parseInt(id!)} />
      )}
    </div>
  );
}
