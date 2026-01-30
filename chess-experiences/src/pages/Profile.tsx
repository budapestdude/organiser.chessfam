import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, User, Trophy, MapPin, Settings,
  Edit2, Save, X, Mail, Eye, EyeOff,
  CheckCircle, Loader2, ExternalLink, Shield, Key
} from 'lucide-react';
import { useStore } from '../store';
import { profileApi, type UserProfile, type UpdateProfileInput } from '../api/profile';

const CHESS_TITLES = [
  { value: '', label: 'No Title' },
  { value: 'GM', label: 'GM - Grandmaster' },
  { value: 'IM', label: 'IM - International Master' },
  { value: 'FM', label: 'FM - FIDE Master' },
  { value: 'NM', label: 'NM - National Master' },
  { value: 'CM', label: 'CM - Candidate Master' },
  { value: 'WGM', label: 'WGM - Woman Grandmaster' },
  { value: 'WIM', label: 'WIM - Woman International Master' },
  { value: 'WFM', label: 'WFM - Woman FIDE Master' },
];

const TIME_CONTROLS = [
  { value: '', label: 'No Preference' },
  { value: 'bullet', label: 'Bullet (< 3 min)' },
  { value: 'blitz', label: 'Blitz (3-10 min)' },
  { value: 'rapid', label: 'Rapid (10-30 min)' },
  { value: 'classical', label: 'Classical (> 30 min)' },
];

const COUNTRIES = [
  'United States', 'United Kingdom', 'Canada', 'Germany', 'France', 'Spain',
  'Italy', 'Russia', 'China', 'India', 'Brazil', 'Australia', 'Japan',
  'South Korea', 'Netherlands', 'Sweden', 'Norway', 'Poland', 'Hungary',
  'Czech Republic', 'Ukraine', 'Armenia', 'Azerbaijan', 'Israel', 'Turkey', 'Other'
];

const Profile = () => {
  const navigate = useNavigate();
  const { user, openAuthModal, setUser } = useStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'chess' | 'preferences' | 'security'>('profile');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<UpdateProfileInput>({});

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await profileApi.getMyProfile();
      setProfile(response.data);
      setFormData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      const response = await profileApi.updateMyProfile(formData);
      setProfile(response.data);
      setEditing(false);
      setSuccess('Profile updated successfully');
      // Update store user
      if (response.data.name !== user?.name || response.data.rating !== user?.rating) {
        setUser({ ...user!, name: response.data.name, rating: response.data.rating });
      }
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await profileApi.changePassword(passwordData.currentPassword, passwordData.newPassword);
      setSuccess('Password changed successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(profile ? { ...profile } as UpdateProfileInput : {});
    setEditing(false);
    setError(null);
  };

  if (!user) {
    return (
      <div className="min-h-screen py-8 px-4 md:px-8 max-w-4xl mx-auto flex flex-col items-center justify-center">
        <User className="w-16 h-16 text-white/20 mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Sign in to view your profile</h2>
        <p className="text-white/50 mb-6">Access your bookings and account settings</p>
        <button
          onClick={() => openAuthModal('login')}
          className="px-6 py-3 bg-gold-500 text-chess-darker font-semibold rounded-xl hover:bg-gold-400 transition-colors"
        >
          Sign In
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
      </div>
    );
  }

  if (!profile && error) {
    return (
      <div className="min-h-screen py-8 px-4 md:px-8 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-2xl font-display font-bold text-white">My Profile</h1>
          <div className="w-16" />
        </motion.div>
        <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-6 text-center">
          <X className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Failed to load profile</h2>
          <p className="text-white/60 mb-4">{error}</p>
          <button
            onClick={fetchProfile}
            className="px-6 py-3 bg-gold-500 text-chess-darker font-semibold rounded-xl hover:bg-gold-400 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 md:px-8 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <h1 className="text-2xl font-display font-bold text-white">My Profile</h1>
        <div className="w-16" />
      </motion.div>

      {/* Alerts */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 flex items-center gap-2"
        >
          <X className="w-5 h-5" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-xl text-green-400 flex items-center gap-2"
        >
          <CheckCircle className="w-5 h-5" />
          {success}
        </motion.div>
      )}

      {/* Profile Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 rounded-2xl p-6 mb-6 border border-white/10"
      >
        <div className="flex items-start gap-4">
          <div className="relative">
            {profile?.avatar ? (
              <img src={profile.avatar} alt={profile.name} className="w-24 h-24 rounded-2xl object-cover" />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center">
                <span className="text-4xl font-bold text-chess-darker">
                  {profile?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            {profile?.chess_title && (
              <span className="absolute -top-2 -right-2 px-2 py-1 bg-gold-500 text-chess-darker text-xs font-bold rounded-lg">
                {profile.chess_title}
              </span>
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-semibold text-white">{profile?.name}</h2>
            <p className="text-white/50">{profile?.email}</p>
            {profile?.location && (
              <p className="text-white/40 text-sm flex items-center gap-1 mt-1">
                <MapPin className="w-3 h-3" />
                {profile.location}{profile.country && `, ${profile.country}`}
              </p>
            )}
            <div className="flex items-center gap-4 mt-3">
              {profile?.show_rating !== false && (
                <span className="text-sm text-white/60">
                  Rating: <span className="text-gold-400 font-semibold">{profile?.rating || 1500}</span>
                </span>
              )}
              {profile?.peak_rating && (
                <span className="text-sm text-white/60">
                  Peak: <span className="text-white font-semibold">{profile.peak_rating}</span>
                </span>
              )}
              {profile?.is_master && (
                <span className="px-2 py-1 bg-gold-500/20 text-gold-400 text-xs font-medium rounded-full">
                  Master
                </span>
              )}
            </div>
          </div>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors flex items-center gap-2"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </button>
          )}
        </div>
        {profile?.bio && !editing && (
          <p className="mt-4 text-white/70 border-t border-white/10 pt-4">{profile.bio}</p>
        )}
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {[
          { id: 'profile', label: 'Basic Info', icon: User },
          { id: 'chess', label: 'Chess Info', icon: Trophy },
          { id: 'preferences', label: 'Preferences', icon: Settings },
          { id: 'security', label: 'Security', icon: Shield },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl font-medium flex items-center gap-2 whitespace-nowrap transition-colors
              ${activeTab === tab.id
                ? 'bg-gold-500 text-chess-darker'
                : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 rounded-2xl p-6 border border-white/10"
      >
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/70 mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={!editing}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white
                           placeholder-white/30 focus:border-gold-500 focus:outline-none disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">Location</label>
                <input
                  type="text"
                  value={formData.location || ''}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  disabled={!editing}
                  placeholder="City"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white
                           placeholder-white/30 focus:border-gold-500 focus:outline-none disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">Country</label>
                <select
                  value={formData.country || ''}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  disabled={!editing}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white
                           focus:border-gold-500 focus:outline-none disabled:opacity-50"
                >
                  <option value="">Select Country</option>
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">Phone</label>
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={!editing}
                  placeholder="+1 555 123 4567"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white
                           placeholder-white/30 focus:border-gold-500 focus:outline-none disabled:opacity-50"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-white/70 mb-2">Website</label>
                <input
                  type="url"
                  value={formData.website || ''}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  disabled={!editing}
                  placeholder="https://yourwebsite.com"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white
                           placeholder-white/30 focus:border-gold-500 focus:outline-none disabled:opacity-50"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-white/70 mb-2">Bio</label>
                <textarea
                  value={formData.bio || ''}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  disabled={!editing}
                  rows={4}
                  placeholder="Tell us about yourself..."
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white
                           placeholder-white/30 focus:border-gold-500 focus:outline-none disabled:opacity-50 resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'chess' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/70 mb-2">Chess Title</label>
                <select
                  value={formData.chess_title || ''}
                  onChange={(e) => setFormData({ ...formData, chess_title: e.target.value })}
                  disabled={!editing}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white
                           focus:border-gold-500 focus:outline-none disabled:opacity-50"
                >
                  {CHESS_TITLES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">Current Rating</label>
                <input
                  type="number"
                  value={formData.rating || ''}
                  onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) || undefined })}
                  disabled={!editing}
                  min={100}
                  max={3500}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white
                           placeholder-white/30 focus:border-gold-500 focus:outline-none disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">Peak Rating</label>
                <input
                  type="number"
                  value={formData.peak_rating || ''}
                  onChange={(e) => setFormData({ ...formData, peak_rating: parseInt(e.target.value) || undefined })}
                  disabled={!editing}
                  min={100}
                  max={3500}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white
                           placeholder-white/30 focus:border-gold-500 focus:outline-none disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">Preferred Time Control</label>
                <select
                  value={formData.preferred_time_control || ''}
                  onChange={(e) => setFormData({ ...formData, preferred_time_control: e.target.value })}
                  disabled={!editing}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white
                           focus:border-gold-500 focus:outline-none disabled:opacity-50"
                >
                  {TIME_CONTROLS.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">FIDE ID</label>
                <input
                  type="text"
                  value={formData.fide_id || ''}
                  onChange={(e) => setFormData({ ...formData, fide_id: e.target.value })}
                  disabled={!editing}
                  placeholder="e.g., 12345678"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white
                           placeholder-white/30 focus:border-gold-500 focus:outline-none disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">Lichess Username</label>
                <input
                  type="text"
                  value={formData.lichess_username || ''}
                  onChange={(e) => setFormData({ ...formData, lichess_username: e.target.value })}
                  disabled={!editing}
                  placeholder="Your Lichess username"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white
                           placeholder-white/30 focus:border-gold-500 focus:outline-none disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">Chess.com Username</label>
                <input
                  type="text"
                  value={formData.chesscom_username || ''}
                  onChange={(e) => setFormData({ ...formData, chesscom_username: e.target.value })}
                  disabled={!editing}
                  placeholder="Your Chess.com username"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white
                           placeholder-white/30 focus:border-gold-500 focus:outline-none disabled:opacity-50"
                />
              </div>
            </div>

            {/* External Links */}
            {!editing && (formData.lichess_username || formData.chesscom_username || formData.fide_id) && (
              <div className="border-t border-white/10 pt-4">
                <h4 className="text-sm text-white/50 mb-3">View Profiles</h4>
                <div className="flex flex-wrap gap-2">
                  {formData.lichess_username && (
                    <a
                      href={`https://lichess.org/@/${formData.lichess_username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-white/5 rounded-lg text-white/70 hover:bg-white/10 transition-colors flex items-center gap-2"
                    >
                      Lichess <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {formData.chesscom_username && (
                    <a
                      href={`https://www.chess.com/member/${formData.chesscom_username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-white/5 rounded-lg text-white/70 hover:bg-white/10 transition-colors flex items-center gap-2"
                    >
                      Chess.com <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {formData.fide_id && (
                    <a
                      href={`https://ratings.fide.com/profile/${formData.fide_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-white/5 rounded-lg text-white/70 hover:bg-white/10 transition-colors flex items-center gap-2"
                    >
                      FIDE Profile <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'preferences' && (
          <div className="space-y-6">
            <div>
              <h4 className="text-white font-medium mb-4">What are you looking for?</h4>
              <div className="space-y-3">
                {[
                  { key: 'looking_for_games', label: 'Looking for games', desc: 'Find opponents to play with' },
                  { key: 'looking_for_coach', label: 'Looking for a coach', desc: 'Improve with professional guidance' },
                  { key: 'looking_for_students', label: 'Available to teach', desc: 'Offer coaching to other players' },
                ].map((item) => (
                  <label key={item.key} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
                    <input
                      type="checkbox"
                      checked={!!formData[item.key as keyof UpdateProfileInput]}
                      onChange={(e) => setFormData({ ...formData, [item.key]: e.target.checked })}
                      disabled={!editing}
                      className="w-5 h-5 rounded border-white/20 bg-white/5 text-gold-500 focus:ring-gold-500"
                    />
                    <div>
                      <span className="text-white">{item.label}</span>
                      <p className="text-sm text-white/50">{item.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="border-t border-white/10 pt-6">
              <h4 className="text-white font-medium mb-4">Privacy Settings</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-white/70 mb-2">Profile Visibility</label>
                  <select
                    value={formData.profile_visibility || 'public'}
                    onChange={(e) => setFormData({ ...formData, profile_visibility: e.target.value })}
                    disabled={!editing}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white
                             focus:border-gold-500 focus:outline-none disabled:opacity-50"
                  >
                    <option value="public">Public - Anyone can see</option>
                    <option value="members">Members Only - Registered users</option>
                    <option value="private">Private - Only you</option>
                  </select>
                </div>
                <label className="flex items-center gap-3 p-3 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.show_rating !== false}
                    onChange={(e) => setFormData({ ...formData, show_rating: e.target.checked })}
                    disabled={!editing}
                    className="w-5 h-5 rounded border-white/20 bg-white/5 text-gold-500 focus:ring-gold-500"
                  />
                  <div className="flex items-center gap-2">
                    {formData.show_rating !== false ? <Eye className="w-4 h-4 text-white/50" /> : <EyeOff className="w-4 h-4 text-white/50" />}
                    <span className="text-white">Show my rating on profile</span>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
                  <input
                    type="checkbox"
                    checked={!!formData.show_email}
                    onChange={(e) => setFormData({ ...formData, show_email: e.target.checked })}
                    disabled={!editing}
                    className="w-5 h-5 rounded border-white/20 bg-white/5 text-gold-500 focus:ring-gold-500"
                  />
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-white/50" />
                    <span className="text-white">Show my email publicly</span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6">
            <div>
              <h4 className="text-white font-medium mb-4 flex items-center gap-2">
                <Key className="w-5 h-5" />
                Change Password
              </h4>
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm text-white/70 mb-2">Current Password</label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white
                             placeholder-white/30 focus:border-gold-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-2">New Password</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white
                             placeholder-white/30 focus:border-gold-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white
                             placeholder-white/30 focus:border-gold-500 focus:outline-none"
                  />
                </div>
                <button
                  onClick={handlePasswordChange}
                  disabled={saving || !passwordData.currentPassword || !passwordData.newPassword}
                  className="px-6 py-3 bg-gold-500 text-chess-darker font-semibold rounded-xl
                           hover:bg-gold-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                           flex items-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                  Change Password
                </button>
              </div>
            </div>

            <div className="border-t border-white/10 pt-6">
              <h4 className="text-white font-medium mb-2">Account Email</h4>
              <p className="text-white/50 mb-4">{profile?.email}</p>
              <p className="text-sm text-white/40">Contact support to change your email address.</p>
            </div>
          </div>
        )}

        {/* Save/Cancel Buttons */}
        {editing && activeTab !== 'security' && (
          <div className="flex gap-3 mt-6 pt-6 border-t border-white/10">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-gold-500 text-chess-darker font-semibold rounded-xl
                       hover:bg-gold-400 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
            <button
              onClick={handleCancel}
              disabled={saving}
              className="px-6 py-3 bg-white/10 text-white font-semibold rounded-xl
                       hover:bg-white/20 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Profile;
