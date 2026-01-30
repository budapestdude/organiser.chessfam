import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Trophy, Users, Calendar, Clock, MapPin, LayoutGrid, Building2, Target, Heart, Loader2, FileText, Share2, Crown, Edit, User } from 'lucide-react';
import { useStore } from '../store';
import { useState, useEffect } from 'react';
import { tournamentsApi, type Tournament } from '../api/tournaments';
import { tournamentReviewsApi } from '../api/tournamentReviews';
import { postsApi } from '../api/posts';
import ReviewSection from '../components/ReviewSection';
import ImageGallery from '../components/ImageGallery';
import { Helmet } from 'react-helmet-async';
import Breadcrumbs from '../components/Breadcrumbs';
import type { EarlyBirdTier } from '../api/tournaments';

// Helper function to get the currently active early bird tier
const getActiveEarlyBirdTier = (tiers?: EarlyBirdTier[]): EarlyBirdTier | null => {
  if (!tiers || tiers.length === 0) return null;

  const now = new Date();

  // Filter tiers that haven't expired yet
  const activeTiers = tiers.filter(tier => new Date(tier.deadline) >= now);

  if (activeTiers.length === 0) return null;

  // Sort by deadline (earliest first) and return the first one
  activeTiers.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

  return activeTiers[0];
};

// Helper function to calculate discounted price
const calculateEarlyBirdPrice = (basePrice: number, tier: EarlyBirdTier | null): number => {
  if (!tier) return basePrice;

  if (tier.discount_type === 'percentage') {
    return basePrice * (1 - tier.discount / 100);
  } else {
    return Math.max(0, basePrice - tier.discount);
  }
};

const TournamentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, openAuthModal, addFavorite, removeFavorite, isFavorite } = useStore();

  // Tournament state
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [festivalEvents, setFestivalEvents] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sharingToFeed, setSharingToFeed] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareMessage, setShareMessage] = useState('');

  // Form state
  const [playerName, setPlayerName] = useState('');
  const [playerEmail, setPlayerEmail] = useState('');
  const [playerRating, setPlayerRating] = useState('');
  const [playerPhone, setPlayerPhone] = useState('');
  const [hasBooked, setHasBooked] = useState(false);

  // Review state
  const [reviews, setReviews] = useState<any[]>([]);
  const [averageRating, setAverageRating] = useState(4.5);
  const [totalReviews, setTotalReviews] = useState(0);

  // Participants state
  const [participants, setParticipants] = useState<any[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [showAllParticipants, setShowAllParticipants] = useState(false);

  // Fetch tournament data
  useEffect(() => {
    const fetchTournament = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);
        const response = await tournamentsApi.getTournamentById(parseInt(id));
        console.log('[TournamentDetail] Fetched tournament:', {
          id: response.data.id,
          name: response.data.name,
          external_registration_url: response.data.external_registration_url
        });
        setTournament(response.data);
      } catch (err: any) {
        console.error('Error fetching tournament:', err);
        setError(err.response?.data?.error || 'Failed to load tournament');
      } finally {
        setLoading(false);
      }
    };

    fetchTournament();
  }, [id]);

  // Check if user has booked this tournament and fetch reviews
  useEffect(() => {
    const checkBookingAndFetchReviews = async () => {
      if (!tournament) return;

      try {
        // Check if user has booked
        if (user) {
          const bookings = await tournamentsApi.getMyRegistrations();
          const hasBooking = bookings.data?.some((b: any) => b.tournament_id === tournament.id);
          setHasBooked(hasBooking || false);
        }

        // Fetch reviews from API
        try {
          const reviewData = await tournamentReviewsApi.getTournamentReviews(tournament.id);
          setReviews(reviewData.reviews || []);
          setAverageRating(reviewData.stats?.averageRating || 4.5);
          setTotalReviews(reviewData.stats?.totalReviews || 0);
        } catch (err) {
          // Fallback to defaults if API fails
          setReviews([]);
          setAverageRating(4.5);
          setTotalReviews(0);
        }

        // Fetch festival events if this is a festival parent
        if ((tournament as any).is_festival_parent) {
          try {
            const eventsResponse = await tournamentsApi.getFestivalEvents(tournament.id);
            setFestivalEvents(eventsResponse.data || []);
          } catch (err) {
            console.error('Error fetching festival events:', err);
            setFestivalEvents([]);
          }
        }

        // Fetch participants
        try {
          setLoadingParticipants(true);
          const participantsData = await tournamentsApi.getParticipants(tournament.id, 1, 100);
          setParticipants(participantsData.data || participantsData.participants || []);
        } catch (err) {
          console.error('Error fetching participants:', err);
          setParticipants([]);
        } finally {
          setLoadingParticipants(false);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    checkBookingAndFetchReviews();
  }, [tournament, user]);

  const handleSubmitReview = async (rating: number, comment: string) => {
    if (!tournament) return;

    try {
      await tournamentReviewsApi.submitReview({
        tournamentId: tournament.id,
        rating,
        reviewText: comment
      });

      // Refresh reviews after submit
      const reviewData = await tournamentReviewsApi.getTournamentReviews(tournament.id);
      setReviews(reviewData.reviews || []);
      setAverageRating(reviewData.stats?.averageRating || 4.5);
      setTotalReviews(reviewData.stats?.totalReviews || 0);
    } catch (error: any) {
      console.error('Error submitting review:', error);
      alert(error.response?.data?.message || 'Failed to submit review');
    }
  };

  const openShareModal = () => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    if (!tournament) return;

    setShareMessage(`Check out this tournament! ${tournament.name}`);
    setShowShareModal(true);
  };

  const handleShareToFeed = async () => {
    if (!tournament || !shareMessage.trim()) return;

    try {
      setSharingToFeed(true);
      await postsApi.createPost({
        content: shareMessage,
        image: tournament.image || undefined,
        linked_entity_type: 'tournament',
        linked_entity_id: tournament.id,
      });
      setShowShareModal(false);
      alert('Successfully shared to feed!');
    } catch (error) {
      console.error('Failed to share to feed:', error);
      alert('Failed to share to feed');
    } finally {
      setSharingToFeed(false);
    }
  };

  const handleRegister = async () => {
    if (!user) {
      openAuthModal('login');
      return;
    }

    if (!playerName || !playerEmail) {
      alert('Please fill in all required fields');
      return;
    }

    if (!tournament) return;

    try {
      const response = await tournamentsApi.registerForTournament(tournament.id);

      // Redirect to payment page with registration data
      navigate('/tournament-payment', {
        state: {
          registration: {
            id: response.data?.id || tournament.id,
            tournament_name: tournament.name,
            tournament_date: new Date(tournament.start_date).toLocaleDateString(),
            tournament_location: tournament.venue_name || tournament.venue_city || 'TBD',
            player_name: playerName || user.name,
            player_email: playerEmail || user.email,
            player_rating: playerRating ? parseInt(playerRating) : undefined,
            entry_fee: tournament.entry_fee
          }
        }
      });
    } catch (error: any) {
      console.error('Registration failed:', error);
      alert(error.response?.data?.error || 'Registration failed. Please try again.');
    }
  };

  // Handle share functionality
  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareTitle = tournament?.name || 'Chess Tournament';
    const shareText = `Check out ${shareTitle} on ChessFam! ${tournament?.description || ''}`;

    // Try Web Share API first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        // User cancelled or error occurred
        console.log('Share cancelled or failed');
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard!');
      } catch (error) {
        console.error('Failed to copy link:', error);
        alert('Failed to copy link. Please copy manually: ' + shareUrl);
      }
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold-400 animate-spin" />
      </div>
    );
  }

  // Error state
  if (error || !tournament) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-white/50">{error || 'Tournament not found'}</p>
        <button
          onClick={() => navigate('/tournaments')}
          className="px-6 py-3 bg-gold-500 text-chess-darker font-semibold rounded-xl hover:bg-gold-400 transition-colors"
        >
          Back to Tournaments
        </button>
      </div>
    );
  }

  // Calculate spots and status
  const spotsLeft = (tournament.max_participants || 0) - tournament.current_participants;
  const isFull = spotsLeft <= 0;

  // Type colors mapping
  const typeColors: Record<string, string> = {
    Classical: 'bg-blue-500/20 text-blue-400',
    classical: 'bg-blue-500/20 text-blue-400',
    Rapid: 'bg-green-500/20 text-green-400',
    rapid: 'bg-green-500/20 text-green-400',
    Blitz: 'bg-orange-500/20 text-orange-400',
    blitz: 'bg-orange-500/20 text-orange-400',
    Bullet: 'bg-red-500/20 text-red-400',
    bullet: 'bg-red-500/20 text-red-400',
  };

  // Format tournament data for display
  const displayType = tournament.time_control || tournament.tournament_type || 'Tournament';
  const displayTypeCapitalized = displayType.charAt(0).toUpperCase() + displayType.slice(1);
  const displayLocation = tournament.venue_name && tournament.venue_city
    ? `${tournament.venue_name}, ${tournament.venue_city}`
    : tournament.venue_city || tournament.venue_name || 'Online';
  const displayDate = new Date(tournament.start_date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="min-h-screen py-8 px-4 md:px-8 max-w-4xl mx-auto">
      <Helmet>
        <title>{tournament.name} | ChessFam</title>
        <meta
          name="description"
          content={`${tournament.description?.slice(0, 155) || `Join ${tournament.name} - ${tournament.tournament_type || 'Chess Tournament'} in ${tournament.venue_city || 'your city'}. ${tournament.current_participants} players registered.`}`}
        />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="event" />
        <meta property="og:url" content={`https://chessfam.com/tournament/${tournament.id}`} />
        <meta property="og:title" content={`${tournament.name} | ChessFam`} />
        <meta property="og:description" content={tournament.description || `Join ${tournament.name} - Chess tournament on ChessFam`} />
        <meta property="og:image" content={tournament.image || 'https://chessfam.com/og-image.png'} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${tournament.name} | ChessFam`} />
        <meta name="twitter:description" content={tournament.description || `Join ${tournament.name}`} />
        <meta name="twitter:image" content={tournament.image || 'https://chessfam.com/og-image.png'} />

        {/* Canonical URL */}
        <link rel="canonical" href={`https://chessfam.com/tournament/${tournament.id}`} />

        {/* Structured Data - Event Schema */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SportsEvent",
            "name": tournament.name,
            "description": tournament.description,
            "image": tournament.image || "https://chessfam.com/og-image.png",
            "startDate": tournament.start_date,
            "endDate": tournament.end_date || tournament.start_date,
            "eventStatus": tournament.status === 'completed' ? 'https://schema.org/EventScheduled' :
                          tournament.status === 'cancelled' ? 'https://schema.org/EventCancelled' :
                          'https://schema.org/EventScheduled',
            "eventAttendanceMode": tournament.format === 'online' ? 'https://schema.org/OnlineEventAttendanceMode' : 'https://schema.org/OfflineEventAttendanceMode',
            ...(tournament.venue_name && {
              "location": {
                "@type": "Place",
                "name": tournament.venue_name,
                "address": {
                  "@type": "PostalAddress",
                  "addressLocality": tournament.venue_city
                }
              }
            }),
            "organizer": {
              "@type": "Organization",
              "name": tournament.organizer_name || "ChessFam",
              "url": "https://chessfam.com"
            },
            "offers": {
              "@type": "Offer",
              "price": tournament.entry_fee || 0,
              "priceCurrency": "USD",
              "availability": tournament.max_participants && tournament.current_participants >= tournament.max_participants ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
              "url": `https://chessfam.com/tournament/${tournament.id}`,
              "validFrom": new Date().toISOString(),
              ...(tournament.registration_deadline && {
                "validThrough": tournament.registration_deadline
              })
            },
            ...(tournament.max_participants && {
              "maximumAttendeeCapacity": tournament.max_participants,
              "remainingAttendeeCapacity": Math.max(0, tournament.max_participants - tournament.current_participants)
            }),
            ...(tournament.prize_pool && {
              "award": `$${tournament.prize_pool.toLocaleString()} prize pool`
            }),
            "sport": "Chess",
            "competitor": {
              "@type": "SportsTeam",
              "name": "Tournament Participants",
              "memberOf": {
                "@type": "SportsOrganization",
                "name": "ChessFam"
              }
            }
          })}
        </script>

        {/* Structured Data - BreadcrumbList */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://chessfam.com"
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Tournaments",
                "item": "https://chessfam.com/tournaments"
              },
              {
                "@type": "ListItem",
                "position": 3,
                "name": tournament.name,
                "item": `https://chessfam.com/tournament/${tournament.id}`
              }
            ]
          })}
        </script>
      </Helmet>

      {/* Header with Back and Share Buttons */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-4"
      >
        <button
          onClick={() => navigate('/tournaments')}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <button
          onClick={handleShare}
          className="p-2 rounded-lg bg-white/5 text-white/50 hover:bg-white/10 transition-colors"
          title="Share tournament"
        >
          <Share2 className="w-5 h-5" />
        </button>
      </motion.div>

      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Tournaments', path: '/tournaments' },
          { label: tournament.name }
        ]}
      />

      {/* Hero Image */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl overflow-hidden mb-8"
      >
        <img
          src={tournament.image || 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=800'}
          alt={tournament.name}
          className="w-full h-64 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-chess-darker via-transparent to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${typeColors[displayType] || 'bg-white/20 text-white'}`}>
              {displayTypeCapitalized}
            </span>
            {tournament.status === 'upcoming' && (
              <span className="px-3 py-1 bg-gold-500/20 text-gold-400 rounded-full text-sm font-medium">
                Upcoming
              </span>
            )}
          </div>
          <h1 className="text-3xl font-display font-bold text-white">{tournament.name}</h1>
        </div>
      </motion.div>

      {/* Series Banner */}
      {tournament.parent_tournament_id && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-500/10 backdrop-blur-sm border border-blue-500/30
                     rounded-xl p-5 mb-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm mb-1">
                Part of a tournament series
              </p>
              <p className="text-white font-semibold">
                View all editions and historical photos
              </p>
            </div>
            <button
              onClick={() => {
                // Note: We don't have parent tournament name here, so using ID-only series URL
                // The series page will display the full tournament name
                navigate(`/tournament/${tournament.parent_tournament_id}/series`);
              }}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-400 text-white
                         font-semibold rounded-lg transition-colors flex items-center gap-2"
            >
              View Series
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Festival Events Section */}
      {(tournament as any).is_festival_parent && festivalEvents.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="bg-purple-500/10 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-purple-400" />
              Festival Events ({festivalEvents.length})
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {festivalEvents.map((event: any) => (
                <div
                  key={event.id}
                  onClick={() => navigate(`/tournament/${event.id}`)}
                  className="bg-white/5 hover:bg-white/10 rounded-lg p-4 cursor-pointer transition-all border border-white/10 hover:border-purple-500/50"
                >
                  <h3 className="text-lg font-semibold text-white mb-2">{event.name}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-white/60">
                      <Trophy className="w-4 h-4" />
                      <span>{event.tournament_type || 'Tournament'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/60">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(event.start_date).toLocaleDateString()}</span>
                    </div>
                    {event.entry_fee > 0 && (
                      <div className="flex items-center gap-2 text-white/60">
                        <span className="font-semibold text-gold-400">
                          {event.entry_fee} {event.currency || 'USD'}
                        </span>
                      </div>
                    )}
                    {event.max_participants && (
                      <div className="flex items-center gap-2 text-white/60">
                        <Users className="w-4 h-4" />
                        <span>{event.current_participants || 0}/{event.max_participants} players</span>
                      </div>
                    )}
                  </div>
                  <button className="mt-3 w-full py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-all text-sm font-medium">
                    View Event Details
                  </button>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid md:grid-cols-3 gap-8">
        {/* Main Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="md:col-span-2 space-y-6"
        >
          <p className="text-white/70 leading-relaxed">
            {tournament.description || 'Join this exciting chess tournament and compete with players from around the area!'}
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-xl p-4">
              <div className="flex items-center gap-2 text-white/50 mb-1">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Date</span>
              </div>
              <p className="text-white font-medium">{displayDate}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <div className="flex items-center gap-2 text-white/50 mb-1">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">Location</span>
              </div>
              <p className="text-white font-medium">{displayLocation}</p>
            </div>
            {tournament.time_control && (
              <div className="bg-white/5 rounded-xl p-4">
                <div className="flex items-center gap-2 text-white/50 mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">Time Control</span>
                </div>
                <p className="text-white font-medium">{tournament.time_control}</p>
              </div>
            )}
            {tournament.format && (
              <div className="bg-white/5 rounded-xl p-4">
                <div className="flex items-center gap-2 text-white/50 mb-1">
                  <LayoutGrid className="w-4 h-4" />
                  <span className="text-sm">Format</span>
                </div>
                <p className="text-white font-medium">{tournament.format}</p>
              </div>
            )}
            {tournament.tournament_type && (
              <div className="bg-white/5 rounded-xl p-4">
                <div className="flex items-center gap-2 text-white/50 mb-1">
                  <Users className="w-4 h-4" />
                  <span className="text-sm">Type</span>
                </div>
                <p className="text-white font-medium">{tournament.tournament_type}</p>
              </div>
            )}
            {tournament.organizer_name && (
              <div className="bg-white/5 rounded-xl p-4">
                <div className="flex items-center gap-2 text-white/50 mb-1">
                  <Building2 className="w-4 h-4" />
                  <span className="text-sm">Organizer</span>
                </div>
                <p className="text-white font-medium">{tournament.organizer_name}</p>
              </div>
            )}
          </div>

          {/* Rating Restrictions */}
          {(tournament.rating_min || tournament.rating_max) && (
            <div className="bg-white/5 rounded-xl p-4">
              <div className="flex items-center gap-2 text-white/50 mb-2">
                <Target className="w-4 h-4" />
                <span className="text-sm">Rating Eligibility</span>
              </div>
              <p className="text-white font-medium">
                {tournament.rating_min && tournament.rating_max
                  ? `${tournament.rating_min} - ${tournament.rating_max} ELO`
                  : tournament.rating_min
                  ? `${tournament.rating_min}+ ELO`
                  : `Under ${tournament.rating_max} ELO`}
              </p>
            </div>
          )}

          {/* Rules */}
          {tournament.rules && (
            <div className="bg-white/5 rounded-xl p-4">
              <h3 className="text-white font-semibold mb-2">Tournament Rules</h3>
              <p className="text-white/70 whitespace-pre-line">{tournament.rules}</p>
            </div>
          )}

          {/* Players Progress */}
          {tournament.max_participants && (
            <div className="bg-white/5 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/70">Players Registered</span>
                <span className="text-white font-medium">
                  {tournament.current_participants}/{tournament.max_participants}
                </span>
              </div>
              <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-gold-500 to-gold-400 rounded-full transition-all"
                  style={{ width: `${(tournament.current_participants / tournament.max_participants) * 100}%` }}
                />
              </div>
              <p className="text-sm text-white/50 mt-2">
                {spotsLeft > 0 ? `${spotsLeft} spots remaining` : 'Tournament is full'}
              </p>
            </div>
          )}
        </motion.div>

        {/* Sidebar - Registration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            {tournament.prize_pool ? (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="w-6 h-6 text-gold-400" />
                  <span className="text-2xl font-bold text-white">${tournament.prize_pool}</span>
                </div>
                <p className="text-white/50 text-sm mb-6">Prize Pool</p>
              </>
            ) : (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="w-6 h-6 text-gold-400" />
                  <span className="text-lg font-semibold text-white">Tournament</span>
                </div>
              </div>
            )}

            <div className="border-t border-white/10 pt-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-white/70">Entry Fee</span>
                <span className="text-2xl font-bold text-white">${tournament.entry_fee || 0}</span>
              </div>
              {tournament.premium_discount_eligible && tournament.entry_fee > 0 && (
                <div className="mt-3 bg-gold-500/10 border border-gold-500/30 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-gold-400" />
                    <span className="text-sm font-medium text-gold-400">
                      Premium members save 10% (${((tournament.entry_fee * 0.1).toFixed(2))})
                    </span>
                  </div>
                </div>
              )}

              {/* Variable Pricing Discounts */}
              {tournament.entry_fee > 0 && ((tournament.junior_discount && tournament.junior_discount > 0) || (tournament.senior_discount && tournament.senior_discount > 0) || (tournament.women_discount && tournament.women_discount > 0) || (tournament.gm_wgm_discount && tournament.gm_wgm_discount > 0) || (tournament.im_wim_discount && tournament.im_wim_discount > 0) || (tournament.fm_wfm_discount && tournament.fm_wfm_discount > 0)) && (
                <div className="mt-3 bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                  <p className="text-sm font-medium text-blue-400 mb-2">Special Discounts Available:</p>
                  <div className="space-y-1">
                    {tournament.junior_discount && tournament.junior_discount > 0 && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-white/70">
                          Juniors (age {tournament.junior_age_max || 18} and under)
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-blue-400">
                            ${(tournament.entry_fee * (1 - tournament.junior_discount / 100)).toFixed(2)}
                          </span>
                          <span className="text-white/50">({tournament.junior_discount}% off)</span>
                        </div>
                      </div>
                    )}
                    {tournament.senior_discount && tournament.senior_discount > 0 && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-white/70">
                          Seniors (age {tournament.senior_age_min || 65} and over)
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-blue-400">
                            ${(tournament.entry_fee * (1 - tournament.senior_discount / 100)).toFixed(2)}
                          </span>
                          <span className="text-white/50">({tournament.senior_discount}% off)</span>
                        </div>
                      </div>
                    )}
                    {tournament.women_discount && tournament.women_discount > 0 && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-white/70">
                          Women players
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-blue-400">
                            ${(tournament.entry_fee * (1 - tournament.women_discount / 100)).toFixed(2)}
                          </span>
                          <span className="text-white/50">({tournament.women_discount}% off)</span>
                        </div>
                      </div>
                    )}
                    {tournament.gm_wgm_discount && tournament.gm_wgm_discount > 0 && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-white/70">
                          GM / WGM (verified titles only)
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gold-400">
                            ${(tournament.entry_fee * (1 - tournament.gm_wgm_discount / 100)).toFixed(2)}
                          </span>
                          <span className="text-white/50">({tournament.gm_wgm_discount}% off)</span>
                        </div>
                      </div>
                    )}
                    {tournament.im_wim_discount && tournament.im_wim_discount > 0 && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-white/70">
                          IM / WIM (verified titles only)
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-orange-400">
                            ${(tournament.entry_fee * (1 - tournament.im_wim_discount / 100)).toFixed(2)}
                          </span>
                          <span className="text-white/50">({tournament.im_wim_discount}% off)</span>
                        </div>
                      </div>
                    )}
                    {tournament.fm_wfm_discount && tournament.fm_wfm_discount > 0 && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-white/70">
                          FM / WFM (verified titles only)
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-blue-400">
                            ${(tournament.entry_fee * (1 - tournament.fm_wfm_discount / 100)).toFixed(2)}
                          </span>
                          <span className="text-white/50">({tournament.fm_wfm_discount}% off)</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-white/40 mt-2">
                    Discounts apply automatically upon registration based on your profile
                  </p>
                </div>
              )}

              {/* Early Bird Pricing */}
              {tournament.early_bird_pricing && tournament.early_bird_pricing.length > 0 && tournament.entry_fee > 0 && (() => {
                const activeTier = getActiveEarlyBirdTier(tournament.early_bird_pricing);
                const discountedPrice = activeTier ? calculateEarlyBirdPrice(tournament.entry_fee, activeTier) : null;

                return activeTier ? (
                  <div className="mt-3 bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-green-400" />
                      <span className="text-sm font-bold text-green-400">{activeTier.label}</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-bold text-green-400">${discountedPrice?.toFixed(2)}</span>
                        <span className="text-xs text-white/50 line-through">${tournament.entry_fee}</span>
                        <span className="text-xs text-green-400">
                          Save {activeTier.discount_type === 'percentage' ? `${activeTier.discount}%` : `$${activeTier.discount}`}
                        </span>
                      </div>
                      <p className="text-xs text-white/50">
                        Valid until {new Date(activeTier.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>

                    {/* Show all tiers */}
                    {tournament.early_bird_pricing.length > 1 && (
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <p className="text-xs text-white/60 mb-2">All early bird tiers:</p>
                        <div className="space-y-1">
                          {tournament.early_bird_pricing.map((tier, index) => {
                            const isActive = tier.deadline === activeTier.deadline;
                            const isPast = new Date(tier.deadline) < new Date();
                            const tierPrice = calculateEarlyBirdPrice(tournament.entry_fee, tier);

                            return (
                              <div
                                key={index}
                                className={`text-xs flex items-center justify-between ${
                                  isPast ? 'text-white/30 line-through' :
                                  isActive ? 'text-green-400 font-medium' :
                                  'text-white/50'
                                }`}
                              >
                                <span>{tier.label}</span>
                                <span>
                                  ${tierPrice.toFixed(2)} until {new Date(tier.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  // Show expired early bird message if all tiers are past
                  <div className="mt-3 bg-white/5 border border-white/10 rounded-lg p-3">
                    <p className="text-xs text-white/50">
                      Early bird pricing has ended. Regular price: ${tournament.entry_fee}
                    </p>
                  </div>
                );
              })()}
            </div>

            {/* Registration Form - Only show for internal registrations */}
            {user && !isFull && tournament.status === 'upcoming' && !tournament.external_registration_url && (
              <div className="space-y-3 mb-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">Player Name *</label>
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="Full name"
                    className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-gold-500 focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">Email *</label>
                  <input
                    type="email"
                    value={playerEmail}
                    onChange={(e) => setPlayerEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-gold-500 focus:outline-none transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1">Rating</label>
                    <input
                      type="number"
                      value={playerRating}
                      onChange={(e) => setPlayerRating(e.target.value)}
                      placeholder="1200"
                      className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-gold-500 focus:outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={playerPhone}
                      onChange={(e) => setPlayerPhone(e.target.value)}
                      placeholder="Optional"
                      className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-gold-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Organizer Controls */}
            {user && tournament.organizer_id === user.id && (
              <div className="space-y-3 mb-4 pb-4 border-b border-white/10">
                <div className="flex items-center gap-2 text-sm text-gold-400 font-medium mb-2">
                  <Crown className="w-4 h-4" />
                  <span>You're the organizer</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {tournament.status === 'upcoming' && (
                    <button
                      onClick={() => navigate(`/tournaments/edit/${id}`)}
                      className="px-4 py-3 bg-gold-500/20 text-gold-400 font-medium rounded-xl hover:bg-gold-500/30 transition-all border border-gold-500/30 flex items-center justify-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Edit Tournament
                    </button>
                  )}
                  <button
                    onClick={() => navigate(`/tournaments/${id}/participants`)}
                    className="px-4 py-3 bg-primary-500/20 text-primary-400 font-medium rounded-xl hover:bg-primary-500/30 transition-all border border-primary-500/30 flex items-center justify-center gap-2"
                  >
                    <Users className="w-4 h-4" />
                    Manage Participants
                  </button>
                </div>
              </div>
            )}

            {tournament.status === 'completed' ? (
              <button
                onClick={() => navigate(`/tournaments/${id}/record`)}
                className="w-full py-4 bg-gradient-to-r from-gold-500 to-gold-600 text-chess-darker
                         font-semibold rounded-xl hover:from-gold-400 hover:to-gold-500
                         transition-all flex items-center justify-center gap-2"
              >
                <FileText className="w-5 h-5" />
                View Tournament Record
              </button>
            ) : tournament.external_registration_url ? (
              <a
                href={tournament.external_registration_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 bg-gradient-to-r from-gold-500 to-gold-600 text-chess-darker
                         font-semibold rounded-xl hover:from-gold-400 hover:to-gold-500
                         transition-all flex items-center justify-center gap-2"
              >
                Register
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            ) : (
              <button
                onClick={handleRegister}
                disabled={isFull || tournament.status !== 'upcoming'}
                className="w-full py-4 bg-gradient-to-r from-gold-500 to-gold-600 text-chess-darker
                         font-semibold rounded-xl hover:from-gold-400 hover:to-gold-500
                         transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {!user
                  ? 'Sign in to Register'
                  : isFull
                  ? 'Tournament Full'
                  : tournament.status !== 'upcoming'
                  ? 'Registration Closed'
                  : 'Register Now'}
              </button>
            )}

            <button
              onClick={() => {
                if (!user) {
                  openAuthModal('login');
                  return;
                }
                if (isFavorite(tournament.id, 'tournament')) {
                  removeFavorite(tournament.id, 'tournament');
                } else {
                  addFavorite({
                    type: 'tournament',
                    itemId: tournament.id,
                    itemName: tournament.name,
                    itemImage: tournament.image || '',
                  });
                }
              }}
              className={`w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all
                        ${isFavorite(tournament.id, 'tournament')
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-white/5 text-white/70 hover:bg-white/10'
                        }`}
            >
              <Heart className={`w-5 h-5 ${isFavorite(tournament.id, 'tournament') ? 'fill-current' : ''}`} />
              {isFavorite(tournament.id, 'tournament') ? 'Saved' : 'Save to Favorites'}
            </button>

            <button
              onClick={openShareModal}
              className="w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30"
            >
              <Share2 className="w-5 h-5" />
              Share to Feed
            </button>
          </div>
        </motion.div>
      </div>

      {/* Reviews Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-8"
      >
        <ReviewSection
          entityType="tournament"
          entityId={tournament.id}
          reviews={reviews}
          averageRating={averageRating}
          totalReviews={totalReviews}
          canReview={hasBooked}
          requiresBooking={true}
          onSubmitReview={handleSubmitReview}
        />
      </motion.div>

      {/* Gallery */}
      {tournament.images && tournament.images.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8"
        >
          <h2 className="text-xl font-semibold text-white mb-4">Gallery</h2>
          <ImageGallery
            images={tournament.images}
            alt={tournament.name}
          />
        </motion.div>
      )}

      {/* Participants List */}
      {participants.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8"
        >
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Users className="w-6 h-6 text-primary-400" />
                <h2 className="text-2xl font-semibold text-white">
                  Participants ({participants.length})
                </h2>
              </div>
              {participants.length > 12 && (
                <button
                  onClick={() => setShowAllParticipants(!showAllParticipants)}
                  className="text-sm text-gold-400 hover:text-gold-300 transition-colors"
                >
                  {showAllParticipants ? 'Show Less' : 'Show All'}
                </button>
              )}
            </div>

            {loadingParticipants ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 text-gold-400 animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {(showAllParticipants ? participants : participants.slice(0, 12)).map((participant: any, index: number) => (
                  <motion.div
                    key={participant.id || index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => participant.user_id && navigate(`/player/${participant.user_id}`)}
                    className={`bg-white/5 hover:bg-white/10 rounded-lg p-4 transition-all border border-white/10 ${
                      participant.user_id ? 'cursor-pointer hover:border-primary-400/50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {participant.avatar || participant.user_avatar ? (
                        <img
                          src={participant.avatar || participant.user_avatar}
                          alt={participant.player_name || participant.user_name || 'Player'}
                          className="w-12 h-12 rounded-full object-cover border-2 border-white/10"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center border-2 border-white/10">
                          <User className="w-6 h-6 text-white" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">
                          {participant.player_name || participant.user_name || 'Player'}
                        </p>
                        {participant.player_rating && (
                          <p className="text-sm text-white/50">
                            Rating: {participant.player_rating}
                          </p>
                        )}
                        {participant.status && (
                          <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${
                            participant.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                            participant.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-white/10 text-white/50'
                          }`}>
                            {participant.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {!loadingParticipants && participants.length === 0 && (
              <div className="text-center py-8 text-white/50">
                No participants registered yet. Be the first to join!
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Share to Feed Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-chess-dark rounded-xl border border-white/10 w-full max-w-lg p-6"
          >
            <h3 className="text-xl font-semibold text-white mb-4">Share to Feed</h3>

            <textarea
              value={shareMessage}
              onChange={(e) => setShareMessage(e.target.value)}
              placeholder="Write something about this tournament..."
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-gold-500 resize-none mb-4"
              rows={4}
              maxLength={5000}
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowShareModal(false);
                  setShareMessage('');
                }}
                disabled={sharingToFeed}
                className="px-4 py-2 text-white/60 hover:text-white transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleShareToFeed}
                disabled={!shareMessage.trim() || sharingToFeed}
                className="px-6 py-2 bg-gold-500 text-chess-darker font-semibold rounded-lg hover:bg-gold-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {sharingToFeed ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sharing...
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    Share
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default TournamentDetail;
