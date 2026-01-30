import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Clock, MessageCircle, Gamepad2, Check, Flame, CalendarCheck, Heart, Star, Award, TrendingUp, Send, ExternalLink, Swords } from 'lucide-react';
import { players } from '../data';
import { useStore } from '../store';
import { useState, useEffect } from 'react';
import { playerReviewsApi } from '../api/playerReviews';
import { achievementsApi } from '../api/achievements';
import { profileApi } from '../api/profile';
import { postsApi, type Post as PostType } from '../api/posts';
import { challengesApi } from '../api/challenges';
import { Helmet } from 'react-helmet-async';
import ChessGameViewer from '../components/ChessGameViewer';

const PlayerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, openAuthModal, addBooking, addFavorite, removeFavorite, isFavorite, startConversation } = useStore();

  // Fetch player profile from API
  const [player, setPlayer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
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
  const [posts, setPosts] = useState<PostType[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  const handleLikePost = async (postId: number) => {
    if (!user) {
      openAuthModal('login');
      return;
    }

    // Store the original state for potential rollback
    const originalPost = posts.find(p => p.id === postId);
    if (!originalPost) return;

    // Optimistic update - update UI immediately using functional setState
    setPosts(prevPosts => prevPosts.map(post =>
      post.id === postId
        ? {
            ...post,
            is_liked: !post.is_liked,
            likes_count: Number(post.likes_count) + (post.is_liked ? -1 : 1)
          }
        : post
    ));

    try {
      // Make API call in background
      if (originalPost.is_liked) {
        await postsApi.unlikePost(postId);
      } else {
        await postsApi.likePost(postId);
      }
    } catch (error) {
      console.error('Failed to like/unlike post:', error);
      // Revert to original state on error
      setPosts(prevPosts => prevPosts.map(post =>
        post.id === postId
          ? {
              ...post,
              is_liked: originalPost.is_liked,
              likes_count: originalPost.likes_count
            }
          : post
      ));
      alert('Failed to update like. Please try again.');
    }
  };

  const handleAcceptChallenge = async (challengeId: number) => {
    if (!user) {
      openAuthModal('login');
      return;
    }

    if (!confirm('Accept this challenge?')) {
      return;
    }

    try {
      await challengesApi.respondToChallenge(challengeId, 'accepted');
      alert('Challenge accepted! Check your games.');
    } catch (error: any) {
      console.error('Failed to accept challenge:', error);
      alert(error.response?.data?.message || 'Failed to accept challenge');
    }
  };

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

  // Fetch player profile
  useEffect(() => {
    const fetchPlayer = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const response = await profileApi.getPublicProfile(Number(id));
        setPlayer(response.data);
      } catch (error) {
        console.error('Failed to fetch player profile:', error);
        // Fall back to static data if API fails
        const staticPlayer = players.find((p) => p.id === Number(id));
        if (staticPlayer) {
          setPlayer(staticPlayer);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchPlayer();
  }, [id]);

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

  // Fetch player posts
  useEffect(() => {
    const fetchPosts = async () => {
      if (!player) return;
      try {
        setLoadingPosts(true);
        const response = await postsApi.getPostsByUserId(player.id, 5, 0);
        setPosts(response.data.data || []);
      } catch (error) {
        console.error('Failed to fetch player posts:', error);
      } finally {
        setLoadingPosts(false);
      }
    };
    fetchPosts();
  }, [player]);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white/50">Loading player profile...</p>
      </div>
    );
  }

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

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return (
    <>
      <Helmet>
        <title>{player.name} | Chess Player Profile | ChessFam</title>
        <meta
          name="description"
          content={`Connect with ${player.name}, a ${player.rating || 1500} rated chess player${player.location ? ` from ${player.location}` : ''}. ${player.bio || 'Available for casual games and practice matches.'}`}
        />
        <meta property="og:title" content={`${player.name} | Chess Player Profile | ChessFam`} />
        <meta
          property="og:description"
          content={`${player.rating || 1500} rated chess player${player.location ? ` from ${player.location}` : ''}. ${player.bio || 'Looking for opponents.'}`}
        />
        <meta property="og:url" content={`https://chessfam.com/player/${player.id}`} />
        <meta property="og:type" content="profile" />
        <meta property="og:image" content={player.avatar || 'https://chessfam.com/og-image.png'} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={`${player.name} | Chess Player Profile | ChessFam`} />
        <meta
          name="twitter:description"
          content={`${player.rating || 1500} rated chess player. ${player.bio || 'Looking for opponents.'}`}
        />
        <link rel="canonical" href={`https://chessfam.com/player/${player.id}`} />

        {/* Person Schema for SEO */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            "@id": `https://chessfam.com/player/${player.id}`,
            "name": player.name,
            ...(player.avatar && { "image": player.avatar }),
            ...(player.bio && { "description": player.bio }),
            ...(player.location && {
              "address": {
                "@type": "PostalAddress",
                "addressLocality": player.location
              }
            }),
            ...(reviews.length > 0 && {
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": avgRating.toFixed(1),
                "reviewCount": reviews.length,
                "bestRating": 5,
                "worstRating": 1
              }
            }),
            "memberOf": {
              "@type": "Organization",
              "name": "ChessFam"
            }
          })}
        </script>
      </Helmet>
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
              {(player.avatar || player.image) ? (
                <img
                  src={player.avatar || player.image}
                  alt={player.name}
                  className="w-32 h-32 rounded-2xl object-cover"
                />
              ) : (
                <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-4xl font-bold">
                  {player.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
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
              {player.preferences?.map((pref: string) => (
                <span key={pref} className="px-3 py-1 bg-white/5 rounded-full text-sm text-white/70">
                  {pref}
                </span>
              ))}
            </div>
          </div>

          {/* Favorites */}
          {(player.favorite_player || player.favorite_tournament || player.favorite_opening) && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-white/50 mb-3 flex items-center gap-2">
                <Award className="w-4 h-4" />
                Favorites
              </h3>
              <div className="space-y-2">
                {player.favorite_player && (
                  <div className="flex items-start gap-2">
                    <span className="text-white/40 text-sm min-w-[80px]">Player:</span>
                    <span className="text-white/70 text-sm">{player.favorite_player}</span>
                  </div>
                )}
                {player.favorite_tournament && (
                  <div className="flex items-start gap-2">
                    <span className="text-white/40 text-sm min-w-[80px]">Tournament:</span>
                    <span className="text-white/70 text-sm">{player.favorite_tournament}</span>
                  </div>
                )}
                {player.favorite_opening && (
                  <div className="flex items-start gap-2">
                    <span className="text-white/40 text-sm min-w-[80px]">Opening:</span>
                    <span className="text-white/70 text-sm">{player.favorite_opening}</span>
                  </div>
                )}
              </div>
            </div>
          )}

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
                  participantImage: player.avatar || player.image || '',
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
                    itemImage: player.avatar || player.image || '',
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
              Achievements ({achievements.filter((a: any) => a.unlocked).length})
            </h2>
            {achievements.filter((a: any) => a.unlocked).length === 0 ? (
              <div className="text-center py-8">
                <Award className="w-12 h-12 text-white/20 mx-auto mb-3" />
                <p className="text-white/60">No achievements unlocked yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {achievements.filter((a: any) => a.unlocked).map((achievement: any) => {
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
            )}
          </div>
        </motion.div>
      )}

      {/* Recent Posts Section */}
      {posts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <div className="bg-white/5 rounded-xl p-6">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
              <Send className="w-6 h-6 text-blue-400" />
              Recent Posts
            </h2>

            {loadingPosts ? (
              <div className="text-center py-8 text-white/60">Loading posts...</div>
            ) : posts.length === 0 ? (
              <div className="text-center py-8 text-white/60">No posts yet</div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <div key={post.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-500 to-amber-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                        {post.user_avatar ? (
                          <img src={post.user_avatar} alt={post.user_name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          post.user_name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-white">{post.user_name}</div>
                        <div className="text-xs text-white/50">
                          {new Date(post.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                      </div>
                    </div>

                    <p className="text-white/90 whitespace-pre-wrap mb-3">{post.content}</p>

                    {post.image && (
                      <div className="relative rounded-lg overflow-hidden mb-3 group">
                        <img
                          src={post.image}
                          alt="Post image"
                          className="w-full object-cover max-h-64"
                        />
                        {/* CTA Overlay for linked entities */}
                        {post.linked_entity_type && post.linked_entity_id && (
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="text-xs text-white/60 uppercase tracking-wide mb-0.5">
                                  {post.linked_entity_type === 'tournament' && 'Tournament'}
                                  {post.linked_entity_type === 'club' && 'Club'}
                                  {post.linked_entity_type === 'challenge' && 'Challenge'}
                                </div>
                                <div className="text-white font-semibold text-sm mb-0.5">
                                  {post.linked_entity_name}
                                </div>
                              </div>
                              <div className="ml-3">
                                {post.linked_entity_type === 'challenge' ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAcceptChallenge(post.linked_entity_id!);
                                    }}
                                    className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors flex items-center gap-1.5 text-sm"
                                  >
                                    <Swords className="w-3.5 h-3.5" />
                                    Accept
                                  </button>
                                ) : (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const routes = {
                                        tournament: `/tournament/${post.linked_entity_id}`,
                                        club: `/club/${post.linked_entity_id}`,
                                        challenge: `/challenges`,
                                      };
                                      navigate(routes[post.linked_entity_type as keyof typeof routes]);
                                    }}
                                    className="px-3 py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-semibold rounded-lg transition-colors flex items-center gap-1.5 text-sm"
                                  >
                                    Learn More
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Chess Game Viewer */}
                    {post.pgn && (
                      <div className="mb-3">
                        <ChessGameViewer pgn={post.pgn} />
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-sm">
                      <button
                        onClick={() => handleLikePost(post.id)}
                        className="flex items-center gap-1 text-white/60 hover:text-gold-400 transition-colors"
                      >
                        <Heart className={`w-4 h-4 ${post.is_liked ? 'fill-gold-400 text-gold-400' : ''}`} />
                        {post.likes_count}
                      </button>
                      <span className="flex items-center gap-1 text-white/60">
                        <MessageCircle className="w-4 h-4" />
                        {post.comments_count}
                      </span>
                    </div>
                  </div>
                ))}

                {posts.length >= 5 && (
                  <button
                    onClick={() => navigate('/feed')}
                    className="w-full py-3 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-lg transition-colors"
                  >
                    View all posts on feed →
                  </button>
                )}
              </div>
            )}
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
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-white">
                Player Reviews ({reviews.length})
              </h2>
              <div className="flex items-center gap-3">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.round(avgRating)
                          ? 'text-gold-400 fill-gold-400'
                          : 'text-white/20'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-lg font-semibold text-white">
                  {avgRating.toFixed(1)}
                </span>
              </div>
            </div>
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
    </>
  );
};

export default PlayerDetail;
