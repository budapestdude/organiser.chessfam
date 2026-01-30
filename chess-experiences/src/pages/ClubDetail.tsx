import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Star, Users, Clock, MapPin, Phone, Globe, CalendarDays, Heart, Check } from 'lucide-react';
import { clubs } from '../data';
import { useStore } from '../store';
import { useState } from 'react';
import { clubsApi } from '../api/clubs';

const ClubDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const club = clubs.find((c) => c.id === Number(id));
  const { user, openAuthModal, addFavorite, removeFavorite, isFavorite } = useStore();
  const [selectedPlan, setSelectedPlan] = useState<'month' | 'year'>('month');
  const [memberName, setMemberName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRating, setMemberRating] = useState('');
  const [memberPhone, setMemberPhone] = useState('');

  if (!club) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white/50">Club not found</p>
      </div>
    );
  }

  const monthlyFee = club.monthlyFee || 50;
  const plans = {
    month: { name: 'Monthly', price: monthlyFee, type: 'monthly' as const },
    year: { name: 'Annual', price: Math.round(monthlyFee * 10), type: 'yearly' as const },
  };

  const handleJoin = async () => {
    if (!user) {
      openAuthModal('login');
      return;
    }

    if (!memberName || !memberEmail) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const response = await clubsApi.joinClub(club.id);

      // Redirect to payment page with membership data
      navigate('/club-payment', {
        state: {
          membership: {
            id: response.data?.id || club.id,
            club_name: club.name,
            club_location: club.location,
            member_name: memberName || user.name,
            member_email: memberEmail || user.email,
            member_rating: memberRating ? parseInt(memberRating) : undefined,
            membership_fee: plans[selectedPlan].price,
            membership_type: plans[selectedPlan].name
          }
        }
      });
    } catch (error: any) {
      console.error('Membership registration failed:', error);
      alert(error.response?.data?.error || 'Failed to join club. Please try again.');
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 md:px-8 max-w-4xl mx-auto">
      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-white/60 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Back
      </motion.button>


      {/* Hero Image */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl overflow-hidden mb-8"
      >
        <img
          src={club.image}
          alt={club.name}
          className="w-full h-64 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-chess-darker via-transparent to-transparent" />
        {club.featured && (
          <div className="absolute top-4 right-4 px-3 py-1 bg-gold-500 text-chess-darker text-sm font-semibold rounded-full">
            Featured
          </div>
        )}
        <div className="absolute bottom-4 left-4">
          <h1 className="text-3xl font-display font-bold text-white">{club.name}</h1>
        </div>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Main Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="md:col-span-2 space-y-6"
        >
          {/* Rating and Location */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1">
              <Star className="w-5 h-5 text-gold-400 fill-gold-400" />
              <span className="font-semibold text-white">{club.rating}</span>
              <span className="text-white/50">({club.reviews} reviews)</span>
            </div>
            <div className="flex items-center gap-1 text-white/60">
              <Users className="w-4 h-4" />
              {club.members} members
            </div>
            <div className="flex items-center gap-1 text-gold-400">
              <MapPin className="w-4 h-4" />
              {club.distance}
            </div>
          </div>

          <p className="text-white/70 leading-relaxed">{club.description}</p>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {club.tags.map((tag) => (
              <span key={tag} className="px-3 py-1 bg-white/5 rounded-full text-sm text-white/70">
                {tag}
              </span>
            ))}
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-xl p-4">
              <div className="flex items-center gap-2 text-white/50 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-sm">Hours</span>
              </div>
              <p className="text-white font-medium">{club.hours}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <div className="flex items-center gap-2 text-white/50 mb-1">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">Address</span>
              </div>
              <p className="text-white font-medium text-sm">{club.address}</p>
            </div>
          </div>

          {/* Amenities */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Amenities</h3>
            <div className="grid grid-cols-2 gap-2">
              {club.amenities.map((amenity) => (
                <div key={amenity} className="flex items-center gap-2 text-white/70">
                  <Check className="w-4 h-4 text-green-400" />
                  {amenity}
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Events */}
          {club.upcomingEvents && club.upcomingEvents.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-gold-400" />
                Upcoming Events
              </h3>
              <div className="space-y-2">
                {club.upcomingEvents.map((event, index) => (
                  <div
                    key={index}
                    className="bg-white/5 rounded-xl p-4 border border-white/5 hover:border-gold-500/30 transition-colors"
                  >
                    <p className="text-white">{event}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Sidebar - Membership */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">Membership Plans</h3>

            <div className="space-y-2 mb-6">
              {(Object.entries(plans) as [typeof selectedPlan, typeof plans.month][]).map(([key, plan]) => (
                <button
                  key={key}
                  onClick={() => setSelectedPlan(key)}
                  className={`w-full p-4 rounded-xl flex items-center justify-between transition-all
                            ${selectedPlan === key
                              ? 'bg-gold-500/20 border-2 border-gold-500'
                              : 'bg-white/5 border-2 border-transparent hover:bg-white/10'
                            }`}
                >
                  <span className={selectedPlan === key ? 'text-white' : 'text-white/70'}>
                    {plan.name}
                  </span>
                  <span className={`font-bold ${selectedPlan === key ? 'text-gold-400' : 'text-white'}`}>
                    ${plan.price}
                  </span>
                </button>
              ))}
            </div>

            {user && (
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm text-white/70 mb-2">Member Name *</label>
                  <input
                    type="text"
                    value={memberName}
                    onChange={(e) => setMemberName(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white
                             placeholder:text-white/30 focus:outline-none focus:border-gold-500/50"
                    placeholder="Enter your name"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-2">Email *</label>
                  <input
                    type="email"
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white
                             placeholder:text-white/30 focus:outline-none focus:border-gold-500/50"
                    placeholder="your.email@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-2">Chess Rating (optional)</label>
                  <input
                    type="number"
                    value={memberRating}
                    onChange={(e) => setMemberRating(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white
                             placeholder:text-white/30 focus:outline-none focus:border-gold-500/50"
                    placeholder="e.g., 1500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-2">Phone (optional)</label>
                  <input
                    type="tel"
                    value={memberPhone}
                    onChange={(e) => setMemberPhone(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white
                             placeholder:text-white/30 focus:outline-none focus:border-gold-500/50"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleJoin}
              className="w-full py-4 bg-gradient-to-r from-gold-500 to-gold-600 text-chess-darker
                       font-semibold rounded-xl hover:from-gold-400 hover:to-gold-500 transition-all"
            >
              {!user ? 'Sign in to Join' : `Join for $${plans[selectedPlan].price}`}
            </button>
          </div>

          {/* Contact */}
          <div className="bg-white/5 rounded-xl p-4 space-y-3">
            <button className="w-full py-3 bg-white/5 rounded-lg text-white/70 hover:bg-white/10
                             flex items-center justify-center gap-2 transition-colors">
              <Phone className="w-4 h-4" />
              Contact Club
            </button>
            <button className="w-full py-3 bg-white/5 rounded-lg text-white/70 hover:bg-white/10
                             flex items-center justify-center gap-2 transition-colors">
              <Globe className="w-4 h-4" />
              Visit Website
            </button>
            <button
              onClick={() => {
                if (!user) {
                  openAuthModal('login');
                  return;
                }
                if (isFavorite(club.id, 'club')) {
                  removeFavorite(club.id, 'club');
                } else {
                  addFavorite({
                    type: 'club',
                    itemId: club.id,
                    itemName: club.name,
                    itemImage: club.image,
                  });
                }
              }}
              className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all
                        ${isFavorite(club.id, 'club')
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-white/5 text-white/70 hover:bg-white/10'
                        }`}
            >
              <Heart className={`w-4 h-4 ${isFavorite(club.id, 'club') ? 'fill-current' : ''}`} />
              {isFavorite(club.id, 'club') ? 'Saved' : 'Save to Favorites'}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ClubDetail;
