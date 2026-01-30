import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Clock, MessageCircle, Gamepad2, Check, Flame, CalendarCheck, Heart, Star, Award, TrendingUp } from 'lucide-react';
import { players } from '../data';
import { useStore } from '../store';
import { useState, useEffect } from 'react';
import { playerReviewsApi } from '../api/playerReviews';
import { achievementsApi } from '../api/achievements';

const PlayerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const player = players.find((p) => p.id === Number(id));
  const { user, openAuthModal, addBooking, addFavorite, removeFavorite, isFavorite, startConversation } = useStore();
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [selectedTimeControl, setSelectedTimeControl] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedBadges, setSelectedBadges] = useState<string[]>([]);
  const [userReview, setUserReview] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [userStats, setUserStats] = useState<any>(null);

  // Available compliment badges
  const availableBadges = [
    'Great Sport',
    'Fast Player',
    'Strategic',
    'Friendly',
    'Punctual',
    'Good Teacher',
    'Respectful',
    'Challenging'
  ];

  // Fetch reviews
  useEffect(() => {
    const fetchReviews = async () => {
      if (!player) return;
      try {
        const [reviewsData, userReviewData] = await Promise.all([
          playerReviewsApi.getPlayerReviews(player.id),
          user ? playerReviewsApi.getUserReview(player.id).catch(() => null) : Promise.resolve(null)
        ]);
        setReviews(reviewsData.data || []);
        if (userReviewData?.data) {
          setUserReview(userReviewData.data);
          setRating(userReviewData.data.rating);
          setSelectedBadges(userReviewData.data.badges || []);
        }
      } catch (error) {
        console.error('Failed to fetch reviews:', error);
      }
    };
    fetchReviews();
  }, [player, user]);

  // Fetch achievements and stats if viewing own profile
  useEffect(() => {
    const fetchAchievements = async () => {
      if (!user || !player) return;
      // For now, show achievements only on own profile
      // In a real app, you'd check if player.id matches user's ID
      try {
        const [achievementsData, statsData] = await Promise.all([
          achievementsApi.getUserAchievements(),
          achievementsApi.getUserStats()
        ]);
        setAchievements(achievementsData.data || []);
        setUserStats(statsData.data);
      } catch (error) {
        console.error('Failed to fetch achievements:', error);
      }
    };
    fetchAchievements();
  }, [user, player]);

  if (!player) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white/50">Player not found</p>
      </div>
    );
  }

  const handleChallenge = () => {
    if (!user) {
      openAuthModal('login');
      return;
    }

    if (!selectedTimeControl) return;

    addBooking({
      type: 'game',
      itemId: player.id,
      itemName: player.name,
      date: new Date().toISOString().split('T')[0],
      price: 0,
      status: 'pending',
    });

    setBookingSuccess(true);
    setTimeout(() => {
      setBookingSuccess(false);
      navigate('/');
    }, 2000);
  };

  const toggleBadge = (badge: string) => {
    setSelectedBadges(prev =>
      prev.includes(badge)
        ? prev.filter(b => b !== badge)
        : [...prev, badge]
    );
  };

  const handleSubmitReview = async () => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }

    setSubmittingReview(true);
    try {
      await playerReviewsApi.submitReview({
        playerId: player.id,
        rating,
        badges: selectedBadges
      });

      // Refresh reviews
      const [reviewsData, userReviewData] = await Promise.all([
        playerReviewsApi.getPlayerReviews(player.id),
        playerReviewsApi.getUserReview(player.id)
      ]);
      setReviews(reviewsData.data || []);
      setUserReview(userReviewData.data);

      alert('Review submitted successfully!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
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

      {bookingSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2"
        >
          <Check className="w-5 h-5" />
          Challenge sent! Redirecting...
        </motion.div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        {/* Left Column - Player Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-start gap-6 mb-6">
            <div className="relative">
              <img
                src={player.image}
                alt={player.name}
                className="w-32 h-32 rounded-2xl object-cover"
              />
              {player.online && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full
                              border-4 border-chess-darker" />
              )}
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold text-white mb-1">{player.name}</h1>
              <div className="flex items-center gap-2 text-white/60 mb-2">
                <MapPin className="w-4 h-4" />
                {player.location}
                <span className="text-gold-400">• {player.distance}</span>
              </div>
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm
                            ${player.online
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-white/10 text-white/50'
                            }`}>
                <div className={`w-2 h-2 rounded-full ${player.online ? 'bg-green-400' : 'bg-white/50'}`} />
                {player.online ? 'Online Now' : 'Offline'}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white/5 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-white">{player.rating}</div>
              <div className="text-sm text-white/50">Rating</div>
            </div>
            <div className="bg-white/5 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-white">{player.gamesPlayed}</div>
              <div className="text-sm text-white/50">Games</div>
            </div>
            <div className="bg-white/5 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{player.winRate}%</div>
              <div className="text-sm text-white/50">Win Rate</div>
            </div>
          </div>

          {/* Streak and Member Since */}
          <div className="flex flex-wrap gap-4 mb-6">
            {player.streak && player.streak > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-orange-500/20 rounded-full">
                <Flame className="w-5 h-5 text-orange-400" />
                <span className="text-orange-400 font-medium">{player.streak} game streak</span>
              </div>
            )}
            {player.joinedDate && (
              <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full text-white/60">
                <CalendarCheck className="w-4 h-4" />
                <span className="text-sm">Member since {new Date(player.joinedDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
              </div>
            )}
          </div>

          <p className="text-white/70 leading-relaxed mb-6">{player.bio}</p>

          {/* Preferences */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-white/50 mb-2">Preferred Time Controls</h3>
            <div className="flex flex-wrap gap-2">
              {player.preferences.map((pref) => (
                <span key={pref} className="px-3 py-1 bg-white/5 rounded-full text-sm text-white/70">
                  {pref}
                </span>
              ))}
            </div>
          </div>

          {/* Availability */}
          <div className="flex items-center gap-2 text-white/60">
            <Clock className="w-4 h-4" />
            <span>{player.availability}</span>
          </div>
        </motion.div>

        {/* Right Column - Challenge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          {/* Time Control Selection */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Select Time Control</h3>
            <div className="grid grid-cols-2 gap-2">
              {['Bullet (1+0)', 'Blitz (3+2)', 'Blitz (5+0)', 'Rapid (10+5)', 'Rapid (15+10)', 'Classical (30+0)'].map((tc) => (
                <button
                  key={tc}
                  onClick={() => setSelectedTimeControl(tc)}
                  className={`p-3 rounded-xl text-sm font-medium transition-all
                            ${selectedTimeControl === tc
                              ? 'bg-orange-500 text-white'
                              : 'bg-white/5 text-white/70 hover:bg-white/10'
                            }`}
                >
                  {tc}
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Add a Message (optional)</h3>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Hey, want to play a game?"
              className="w-full p-4 rounded-xl bg-white/5 border-2 border-transparent text-white
                       placeholder-white/30 focus:border-orange-500 focus:outline-none transition-all
                       resize-none h-24"
            />
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleChallenge}
              disabled={!selectedTimeControl}
              className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white
                       font-semibold rounded-xl hover:from-orange-400 hover:to-orange-500
                       transition-all disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2"
            >
              <Gamepad2 className="w-5 h-5" />
              {!user ? 'Sign in to Challenge' : 'Send Challenge'}
            </button>

            <button
              onClick={() => {
                if (!user) {
                  openAuthModal('login');
                  return;
                }
                const convId = startConversation({
                  participantId: player.id,
                  participantName: player.name,
                  participantImage: player.image,
                  participantType: 'player',
                });
                navigate(`/messages?chat=${convId}`);
              }}
              className="w-full py-4 bg-white/5 text-white/70 font-semibold rounded-xl
                       hover:bg-white/10 transition-all flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              Send Message
            </button>

            <button
              onClick={() => {
                if (!user) {
                  openAuthModal('login');
                  return;
                }
                if (isFavorite(player.id, 'player')) {
                  removeFavorite(player.id, 'player');
                } else {
                  addFavorite({
                    type: 'player',
                    itemId: player.id,
                    itemName: player.name,
                    itemImage: player.image,
                  });
                }
              }}
              className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all
                        ${isFavorite(player.id, 'player')
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-white/5 text-white/70 hover:bg-white/10'
                        }`}
            >
              <Heart className={`w-5 h-5 ${isFavorite(player.id, 'player') ? 'fill-current' : ''}`} />
              {isFavorite(player.id, 'player') ? 'Saved to Favorites' : 'Add to Favorites'}
            </button>
          </div>

          {!player.online && (
            <p className="text-center text-white/50 text-sm">
              This player is currently offline. They'll receive your challenge when they come online.
            </p>
          )}
        </motion.div>
      </div>

      {/* Achievements & Stats Section */}
      {user && userStats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 space-y-6"
        >
          {/* Stats Overview */}
          <div className="bg-gradient-to-br from-orange-500/10 to-gold-500/10 border border-orange-500/20 rounded-xl p-6">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-orange-400" />
              Your Chess Journey
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-orange-400">{userStats.total_checkins || 0}</div>
                <div className="text-sm text-white/60 mt-1">Check-ins</div>
              </div>
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-blue-400">{userStats.unique_venues_visited || 0}</div>
                <div className="text-sm text-white/60 mt-1">Venues Visited</div>
              </div>
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-green-400">{userStats.total_games_created || 0}</div>
                <div className="text-sm text-white/60 mt-1">Games Created</div>
              </div>
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-purple-400">{userStats.unique_players_met || 0}</div>
                <div className="text-sm text-white/60 mt-1">Players Met</div>
              </div>
            </div>
            {userStats.consecutive_checkin_days > 0 && (
              <div className="mt-4 flex items-center justify-center gap-2 p-3 bg-orange-500/20 rounded-lg">
                <Flame className="w-5 h-5 text-orange-400" />
                <span className="text-orange-400 font-semibold">
                  {userStats.consecutive_checkin_days} day streak!
                </span>
              </div>
            )}
          </div>

          {/* Achievements */}
          <div className="bg-white/5 rounded-xl p-6">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
              <Award className="w-6 h-6 text-gold-400" />
              Achievements ({achievements.filter((a: any) => a.unlocked).length}/{achievements.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {achievements.map((achievement: any) => {
                const tierColors: Record<string, string> = {
                  bronze: 'from-amber-700/20 to-amber-900/20 border-amber-700/30',
                  silver: 'from-gray-400/20 to-gray-600/20 border-gray-400/30',
                  gold: 'from-gold-500/20 to-gold-700/20 border-gold-500/30',
                  platinum: 'from-cyan-400/20 to-cyan-600/20 border-cyan-400/30'
                };

                const tierTextColors: Record<string, string> = {
                  bronze: 'text-amber-400',
                  silver: 'text-gray-300',
                  gold: 'text-gold-400',
                  platinum: 'text-cyan-400'
                };

                return (
                  <div
                    key={achievement.id}
                    className={`bg-gradient-to-br ${tierColors[achievement.tier]} border rounded-lg p-4 ${
                      !achievement.unlocked ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${achievement.unlocked ? 'bg-white/10' : 'bg-white/5'}`}>
                        <Award className={`w-6 h-6 ${tierTextColors[achievement.tier]}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white mb-1">{achievement.name}</h3>
                        <p className="text-sm text-white/60 mb-2">{achievement.description}</p>
                        {!achievement.unlocked && (
                          <div className="mt-2">
                            <div className="flex items-center justify-between text-xs text-white/50 mb-1">
                              <span>Progress</span>
                              <span>{achievement.progress || 0}/{achievement.requirement_value}</span>
                            </div>
                            <div className="w-full bg-white/10 rounded-full h-2">
                              <div
                                className={`${tierTextColors[achievement.tier]} bg-current rounded-full h-2 transition-all`}
                                style={{ width: `${Math.min(100, ((achievement.progress || 0) / achievement.requirement_value) * 100)}%` }}
                              />
                            </div>
                          </div>
                        )}
                        {achievement.unlocked && achievement.unlocked_at && (
                          <div className="text-xs text-white/50 mt-2">
                            Unlocked {new Date(achievement.unlocked_at).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* Player Reviews Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-8 space-y-6"
      >
        {/* Submit Review */}
        <div className="bg-white/5 rounded-xl p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">Rate This Player</h2>

          {/* Star Rating */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white/70 mb-3">Your Rating</label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= (hoverRating || rating)
                        ? 'text-gold-400 fill-gold-400'
                        : 'text-white/20'
                    }`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-white/70">{rating} star{rating !== 1 ? 's' : ''}</span>
              )}
            </div>
          </div>

          {/* Badge Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white/70 mb-3">
              Compliment Badges (optional)
            </label>
            <div className="flex flex-wrap gap-2">
              {availableBadges.map((badge) => (
                <button
                  key={badge}
                  type="button"
                  onClick={() => toggleBadge(badge)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedBadges.includes(badge)
                      ? 'bg-orange-500 text-white'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  {badge}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmitReview}
            disabled={submittingReview || rating === 0}
            className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white
                     font-semibold rounded-xl hover:from-orange-400 hover:to-orange-500
                     transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submittingReview ? 'Submitting...' : userReview ? 'Update Review' : 'Submit Review'}
          </button>
        </div>

        {/* Display Reviews */}
        {reviews.length > 0 && (
          <div className="bg-white/5 rounded-xl p-6">
            <h2 className="text-2xl font-semibold text-white mb-4">
              Player Reviews ({reviews.length})
            </h2>
            <div className="space-y-4">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-white/5 rounded-lg p-4 border border-white/10"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < review.rating
                              ? 'text-gold-400 fill-gold-400'
                              : 'text-white/20'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-white/50 text-sm">
                      by {review.reviewer_name}
                    </span>
                  </div>
                  {review.badges && review.badges.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {review.badges.map((badge: string) => (
                        <span
                          key={badge}
                          className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-xs"
                        >
                          {badge}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default PlayerDetail;
