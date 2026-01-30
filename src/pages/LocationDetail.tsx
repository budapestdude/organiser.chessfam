import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Users, Clock, Star, Navigation, Phone, Globe, Coffee, Book, Trees, Building, Wine, Share2, Heart, Calendar, Trophy, GraduationCap, Smile, Plus, LogIn, Swords, X, Medal, Check, Edit } from 'lucide-react';
import { useStore } from '../store';
import Map from '../components/Map';
import { useState, useEffect, useMemo } from 'react';
import { gamesApi } from '../api/games';
import { venuesApi } from '../api/venues';
import { venueReviewsApi } from '../api/venueReviews';
import { checkinsApi } from '../api/checkins';
import { challengesApi } from '../api/challenges';
import type { GameWithDetails } from '../types/game';
import PhotoGallery from '../components/PhotoGallery';
import CommunitySection from '../components/CommunitySection';
import { Helmet } from 'react-helmet-async';
import Breadcrumbs from '../components/Breadcrumbs';

const LocationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useStore((state) => state.user);
  const openAuthModal = useStore((state) => state.openAuthModal);
  const addFavorite = useStore((state) => state.addFavorite);
  const removeFavorite = useStore((state) => state.removeFavorite);
  const isFavorite = useStore((state) => state.isFavorite);
  const [location, setLocation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeGames, setActiveGames] = useState<GameWithDetails[]>([]);
  const [loadingGames, setLoadingGames] = useState(true);
  const [showCreateGame, setShowCreateGame] = useState(false);
  const [expandedGameId, setExpandedGameId] = useState<number | null>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [userReview, setUserReview] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [checkinStatus, setCheckinStatus] = useState<any>(null);
  const [checkedInUsers, setCheckedInUsers] = useState<any[]>([]);
  const [checkingIn, setCheckingIn] = useState(false);
  const [remainingCheckins, setRemainingCheckins] = useState<number>(3);
  const [venuesCheckedInToday, setVenuesCheckedInToday] = useState<number>(0);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [challengeTarget, setChallengeTarget] = useState<any>(null);
  const [challengeTimeControl, setChallengeTimeControl] = useState('Blitz (5+0)');
  const [challengeMessage, setChallengeMessage] = useState('');
  const [sendingChallenge, setSendingChallenge] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  // Fetch location data
  useEffect(() => {
    const fetchLocation = async () => {
      const numId = Number(id);

      // Only fetch approved venues (IDs >= 1000)
      if (numId >= 1000) {
        try {
          const response = await venuesApi.getApprovedVenues();
          const venues = response.data || [];
          const venueId = numId - 1000;
          const venue = venues.find((v: any) => v.id === venueId);

          if (venue) {
            // Convert venue to location format
            const convertedLocation = {
              id: numId,
              name: venue.venue_name,
              type: venue.venue_type === 'community_center' ? 'Community Center' :
                    venue.venue_type.charAt(0).toUpperCase() + venue.venue_type.slice(1),
              location: `${venue.city}, ${venue.country}`,
              address: venue.address,
              image: venue.image_url || 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800',
              rating: 4.5,
              distance: '0.5 mi',
              activeGames: 0,
              description: venue.description || '',
              amenities: venue.amenities || [],
              hours: venue.opening_hours || 'Hours not specified',
              busyHours: [],
              coordinates: venue.latitude && venue.longitude
                ? { lat: venue.latitude, lng: venue.longitude }
                : { lat: 40.7128, lng: -74.0060 }, // Default to NYC if no coordinates
              owner_id: venue.user_id || venue.owner_id // Preserve owner ID
            };
            setLocation(convertedLocation);
          }
        } catch (error) {
          console.error('Error fetching venue:', error);
        }
        setLoading(false);
      } else {
        setLoading(false);
      }
    };

    fetchLocation();
  }, [id]);

  // Fetch games for this venue with full participant details
  useEffect(() => {
    const fetchVenueGames = async () => {
      if (!location?.name) return;

      setLoadingGames(true);
      try {
        const response = await gamesApi.getGames({
          status: 'open',
          venue: location.name
        });

        // Fetch detailed info for each game to get participants
        const gamesWithDetails = await Promise.all(
          response.data.map(async (game: any) => {
            try {
              const detailsResponse = await gamesApi.getGameById(game.id);
              return detailsResponse.data;
            } catch (error) {
              // If detailed fetch fails, return the basic game info
              return game;
            }
          })
        );

        setActiveGames(gamesWithDetails);
      } catch (error) {
        console.error('Failed to fetch games:', error);
      } finally {
        setLoadingGames(false);
      }
    };
    fetchVenueGames();

    // Poll for game updates (people joining/leaving games)
    const interval = setInterval(fetchVenueGames, 60000); // Every 60 seconds
    return () => clearInterval(interval);
  }, [location?.name]);

  // Fetch reviews, check-in status, and leaderboard
  useEffect(() => {
    const fetchReviewsAndCheckins = async () => {
      if (!location?.id) return;

      const venueId = location.id >= 1000 ? location.id - 1000 : location.id;

      try {
        // Fetch reviews
        const [reviewsData, userReviewData, checkedInData] = await Promise.all([
          venueReviewsApi.getVenueReviews(venueId),
          user ? venueReviewsApi.getUserReview(venueId).catch(() => null) : Promise.resolve(null),
          checkinsApi.getVenueCheckins(venueId)
        ]);

        const fetchedReviews = reviewsData.data?.reviews || [];
        setReviews(fetchedReviews);

        // Calculate average rating from reviews
        if (fetchedReviews.length > 0) {
          const avgRating = fetchedReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / fetchedReviews.length;
          setLocation((prev: any) => prev ? { ...prev, rating: avgRating } : prev);
        }

        if (userReviewData?.data) {
          setUserReview(userReviewData.data);
          setRating(userReviewData.data.rating);
          setReviewText(userReviewData.data.review_text || '');
        }
        setCheckedInUsers(checkedInData.data || []);

        // Fetch user's check-in status
        if (user) {
          const statusData = await checkinsApi.getUserStatus();
          setCheckinStatus(statusData.data);
          setRemainingCheckins(statusData.remaining_checkins || 3);
          setVenuesCheckedInToday(statusData.venues_checked_in_today || 0);
        }
      } catch (error) {
        console.error('Failed to fetch reviews/checkins:', error);
      }

      // Fetch venue leaderboard from API (only for real venues)
      if (location.id >= 1000) {
        try {
          const leaderboardData = await checkinsApi.getVenueLeaderboard(venueId, 5);
          setLeaderboard(leaderboardData.data || []);
        } catch (err) {
          console.log('Leaderboard not available:', err);
          setLeaderboard([]);
        }
      }
    };
    fetchReviewsAndCheckins();
  }, [location?.id, user]);

  // Poll for checked-in users updates (lightweight - only fetches check-in list)
  useEffect(() => {
    if (!location?.id) return;

    const fetchCheckedInUsers = async () => {
      const venueId = location.id >= 1000 ? location.id - 1000 : location.id;
      try {
        const checkedInData = await checkinsApi.getVenueCheckins(venueId);
        setCheckedInUsers(checkedInData.data || []);
      } catch (error) {
        // Silently fail - this is just a background update
      }
    };

    // Poll every 45 seconds to show new check-ins
    const interval = setInterval(fetchCheckedInUsers, 45000);
    return () => clearInterval(interval);
  }, [location?.id]);

  // Handle sending a challenge
  const handleSendChallenge = async () => {
    if (!user || !challengeTarget) return;

    setSendingChallenge(true);
    try {
      const venueId = location?.id && location.id >= 1000 ? location.id - 1000 : undefined;

      await challengesApi.sendChallenge({
        challengedId: challengeTarget.user_id,
        venueId,
        timeControl: challengeTimeControl,
        message: challengeMessage || undefined
      });

      // Close modal and show success
      alert(`Challenge sent to ${challengeTarget.user_name}!`);
      setShowChallengeModal(false);
      setChallengeTarget(null);
      setChallengeMessage('');
    } catch (error: any) {
      console.error('Failed to send challenge:', error);
      alert(error.response?.data?.message || 'Failed to send challenge');
    } finally {
      setSendingChallenge(false);
    }
  };

  const openChallengeModal = (targetUser: any) => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    if (targetUser.user_id === user.id) {
      return; // Can't challenge yourself
    }
    setChallengeTarget(targetUser);
    setShowChallengeModal(true);
  };

  const openOpenChallengeModal = () => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    setChallengeTarget(null); // No specific target for open challenge
    setShowChallengeModal(true);
  };

  const handleSendOpenChallenge = async () => {
    if (!user) return;

    setSendingChallenge(true);
    try {
      const venueId = location?.id && location.id >= 1000 ? location.id - 1000 : undefined;

      await challengesApi.sendChallenge({
        // No challengedId - this creates an open challenge
        venueId,
        timeControl: challengeTimeControl,
        message: challengeMessage || undefined
      });

      // Close modal and show success
      alert('Open challenge posted! Other players can now accept it from the challenges board.');
      setShowChallengeModal(false);
      setChallengeTarget(null);
      setChallengeMessage('');
    } catch (error: any) {
      console.error('Failed to post open challenge:', error);
      alert(error.response?.data?.message || 'Failed to post challenge');
    } finally {
      setSendingChallenge(false);
    }
  };

  // Memoize center and markers to prevent infinite re-renders in Map component
  const mapCenter = useMemo<[number, number]>(() =>
    location ? [location.coordinates.lat, location.coordinates.lng] : [40.7, -74.0],
    [location?.coordinates?.lat, location?.coordinates?.lng]
  );

  const markerPosition = useMemo<[number, number]>(() =>
    location ? [location.coordinates.lat, location.coordinates.lng] : [40.7, -74.0],
    [location?.coordinates?.lat, location?.coordinates?.lng]
  );

  const locationMarkers = useMemo(() =>
    location ? [{
      id: location.id,
      name: location.name,
      position: markerPosition,
      image: location.image,
    }] : [],
    [location?.id, location?.name, markerPosition, location?.image]
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white/50">Loading...</p>
      </div>
    );
  }

  if (!location) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white/50">Location not found</p>
      </div>
    );
  }

  const typeIcons: Record<string, typeof Trees> = {
    Park: Trees,
    Cafe: Coffee,
    Library: Book,
    Plaza: Building,
    Bar: Wine,
    'Community Center': Users,
    'Community_center': Users,
  };

  const typeColors: Record<string, string> = {
    Park: 'bg-green-500/20 text-green-400 border-green-500/30',
    Cafe: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    Library: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    Plaza: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    Bar: 'bg-red-500/20 text-red-400 border-red-500/30',
    'Community Center': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    'Community_center': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  };

  // Fallback to Building icon if type is not in the map
  const Icon = typeIcons[location.type] || Building;
  const isFavorited = isFavorite(location.id, 'location');

  const handleFavorite = () => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    if (isFavorited) {
      removeFavorite(location.id, 'location');
    } else {
      addFavorite({
        type: 'location',
        itemId: location.id,
        itemName: location.name,
        itemImage: location.image,
      });
    }
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareTitle = location.name;
    const shareText = `Check out ${location.name} on ChessFam!`;

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

  // Type-specific content
  const getTypeSpecificInfo = () => {
    switch (location.type) {
      case 'Park':
        return {
          tips: [
            'Bring sunscreen and water',
            'Weather dependent - check forecast',
            'Peak hours: afternoons and weekends',
            'Some regulars play for money - know your limits',
          ],
          whatToBring: ['Chess set (usually available)', 'Water bottle', 'Sunscreen', 'Cash for friendly bets'],
        };
      case 'Cafe':
        return {
          tips: [
            'Purchase required - coffee or snack',
            'Quieter environment, good for focus',
            'WiFi available for online analysis',
            'Respect other customers - keep volume reasonable',
          ],
          whatToBring: ['Chess set (check if available)', 'Laptop for analysis', 'Order food/drinks'],
        };
      case 'Library':
        return {
          tips: [
            'Silent play required - no talking',
            'Limited hours - check schedule',
            'Perfect for serious study',
            'Chess books available for reference',
          ],
          whatToBring: ['Library card', 'Notebook', 'Chess set (ask librarian)', 'Quiet demeanor'],
        };
      case 'Plaza':
        return {
          tips: [
            'Very casual atmosphere',
            'All skill levels welcome',
            'Great people watching',
            'Can get crowded on nice days',
          ],
          whatToBring: ['Chess set (usually available)', 'Cash', 'Patience for wait times', 'Sense of humor'],
        };
      case 'Bar':
        return {
          tips: [
            '21+ only',
            'Drink purchase usually required',
            'Loud environment - speed chess works best',
            'Weekly tournaments on certain nights',
          ],
          whatToBring: ['ID', 'Cash/card', 'Chess set (usually provided)', 'Competitive spirit'],
        };
      default:
        return {
          tips: ['Check venue rules before arriving', 'Bring your own set to be safe'],
          whatToBring: ['Chess set', 'Good attitude'],
        };
    }
  };

  const typeInfo = getTypeSpecificInfo();

  const handleJoinGame = async (gameId: number) => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    try {
      await gamesApi.joinGame(gameId);

      // Fetch updated game details with participants
      const gameDetails = await gamesApi.getGameById(gameId);
      const game = gameDetails.data;

      // Refresh games list with full details
      const response = await gamesApi.getGames({
        status: 'open',
        venue: location!.name
      });

      const gamesWithDetails = await Promise.all(
        response.data.map(async (g: any) => {
          try {
            const detailsResponse = await gamesApi.getGameById(g.id);
            return detailsResponse.data;
          } catch (error) {
            return g;
          }
        })
      );

      setActiveGames(gamesWithDetails);

      // Show success message with game creator info
      alert(`You've joined ${game.creator_name}'s game on ${formatDate(game.game_date)} at ${formatTime(game.game_time)}!`);

      // Expand this game to show participants
      setExpandedGameId(gameId);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to join game');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
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
    const venueId = location.id >= 1000 ? location.id - 1000 : location.id;

    try {
      await venueReviewsApi.submitReview({
        venueId,
        rating,
        reviewText: reviewText.trim() || undefined
      });

      // Refresh reviews
      const [reviewsData, userReviewData] = await Promise.all([
        venueReviewsApi.getVenueReviews(venueId),
        venueReviewsApi.getUserReview(venueId)
      ]);
      const fetchedReviews = reviewsData.data?.reviews || [];
      setReviews(fetchedReviews);

      // Recalculate average rating
      if (fetchedReviews.length > 0) {
        const avgRating = fetchedReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / fetchedReviews.length;
        setLocation((prev: any) => prev ? { ...prev, rating: avgRating } : prev);
      }

      setUserReview(userReviewData.data);

      alert('Review submitted successfully!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleCheckin = async () => {
    if (!user) {
      openAuthModal('login');
      return;
    }

    // Don't allow checkout - users are auto-checked out at end of day
    if (isCheckedInHere) {
      alert('You are already checked in here. You will be automatically checked out at the end of the day.');
      return;
    }

    // Check if limit reached
    if (remainingCheckins <= 0) {
      alert('You have reached the maximum of 3 venue check-ins per day. All check-ins will reset at midnight.');
      return;
    }

    setCheckingIn(true);
    const venueId = location.id >= 1000 ? location.id - 1000 : location.id;

    try {
      // Check in
      await checkinsApi.checkin(venueId);
      const statusData = await checkinsApi.getUserStatus();
      setCheckinStatus(statusData.data);
      setRemainingCheckins(statusData.remaining_checkins || 3);
      setVenuesCheckedInToday(statusData.venues_checked_in_today || 0);

      const remaining = statusData.remaining_checkins || 0;
      if (remaining > 0) {
        alert(`Checked in successfully! You have ${remaining} check-in${remaining === 1 ? '' : 's'} remaining today. All check-ins reset at midnight.`);
      } else {
        alert('Checked in successfully! You have reached your daily limit of 3 venue check-ins. All check-ins reset at midnight.');
      }

      // Refresh checked-in users list
      const checkedInData = await checkinsApi.getVenueCheckins(venueId);
      setCheckedInUsers(checkedInData.data || []);
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to check in';
      alert(errorMsg);
    } finally {
      setCheckingIn(false);
    }
  };

  const isCheckedInHere = checkinStatus && location && checkinStatus.venue_id === (location.id >= 1000 ? location.id - 1000 : location.id);

  return (
    <div className="min-h-screen py-8 px-4 md:px-8 lg:px-16 max-w-7xl mx-auto">
      <Helmet>
        <title>{location.name} | Chess Venue | ChessFam</title>
        <meta
          name="description"
          content={`${location.description?.slice(0, 155) || `Visit ${location.name} in ${location.location}. ${location.type} - Play chess, meet players, and join games. ${reviews.length} reviews, ${location.rating} star rating.`}`}
        />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="place" />
        <meta property="og:url" content={`https://chessfam.com/location/${location.id}`} />
        <meta property="og:title" content={`${location.name} | Chess Venue | ChessFam`} />
        <meta property="og:description" content={location.description || `Visit ${location.name} - Chess venue in ${location.location}`} />
        <meta property="og:image" content={location.image || 'https://chessfam.com/og-image.png'} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${location.name} | Chess Venue`} />
        <meta name="twitter:description" content={location.description || `Visit ${location.name}`} />
        <meta name="twitter:image" content={location.image || 'https://chessfam.com/og-image.png'} />

        {/* Canonical URL */}
        <link rel="canonical" href={`https://chessfam.com/location/${location.id}`} />

        {/* Structured Data - LocalBusiness Schema */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": location.name,
            "description": location.description,
            "image": location.image || "https://chessfam.com/og-image.png",
            "url": `https://chessfam.com/location/${location.id}`,
            "@id": `https://chessfam.com/location/${location.id}`,
            "address": {
              "@type": "PostalAddress",
              "streetAddress": location.address,
              "addressLocality": location.location.split(',')[0]?.trim(),
              "addressCountry": "US"
            },
            ...(location.coordinates && {
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": location.coordinates.lat,
                "longitude": location.coordinates.lng
              }
            }),
            "priceRange": "$",
            "openingHours": location.hours || "Mo-Su 09:00-21:00",
            ...(reviews.length > 0 && {
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": location.rating,
                "reviewCount": reviews.length,
                "bestRating": 5,
                "worstRating": 1
              }
            }),
            "amenityFeature": (location.amenities || []).map((amenity: string) => ({
              "@type": "LocationFeatureSpecification",
              "name": amenity
            })),
            "isAccessibleForFree": true,
            "publicAccess": true,
            "smokingAllowed": false,
            "sport": "Chess",
            "makesOffer": {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": "Chess Games and Events",
                "description": `Play chess at ${location.name}`
              },
              "availability": "https://schema.org/InStock"
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
                "name": "Locations",
                "item": "https://chessfam.com/locations"
              },
              {
                "@type": "ListItem",
                "position": 3,
                "name": location.name,
                "item": `https://chessfam.com/location/${location.id}`
              }
            ]
          })}
        </script>
      </Helmet>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <button
          onClick={() => navigate('/locations')}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Locations
        </button>
        <div className="flex gap-2">
          {/* Edit button for venue owners */}
          {user && location && location.owner_id === user.id && (
            <button
              onClick={() => {
                const venueId = location.id >= 1000 ? location.id - 1000 : location.id;
                navigate(`/venues/edit/${venueId}`);
              }}
              className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
              title="Edit Venue"
            >
              <Edit className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={handleFavorite}
            className={`p-2 rounded-lg transition-colors ${
              isFavorited
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                : 'bg-white/5 text-white/50 hover:bg-white/10'
            }`}
          >
            <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={handleShare}
            className="p-2 rounded-lg bg-white/5 text-white/50 hover:bg-white/10 transition-colors"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </motion.div>

      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Locations', path: '/locations' },
          { label: location.name }
        ]}
      />

      {/* Hero Section - Venue Name & Type */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <span className={`px-3 py-1.5 rounded-lg text-sm font-medium border flex items-center gap-2 ${typeColors[location.type] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
            <Icon className="w-4 h-4" />
            {location.type}
          </span>
        </div>
        <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-3">
          {location.name}
        </h1>
        <div className="flex items-center gap-4 text-white/60">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            <span>{location.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.floor(location.rating)
                      ? 'text-gold-400 fill-gold-400'
                      : 'text-white/20'
                  }`}
                />
              ))}
            </div>
            <span className="font-semibold text-white">{location.rating}</span>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content - Venue Photo and Details */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2 space-y-6"
        >
          {/* Venue Photo */}
          <div className="relative rounded-2xl overflow-hidden">
            <img
              src={location.image}
              alt={location.name}
              className="w-full h-96 object-cover"
            />
          </div>

          {/* About This Location */}
          <div className="bg-white/5 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">About This Location</h2>
            <p className="text-white/70 leading-relaxed mb-4">{location.description}</p>

            {/* Amenities */}
            <div className="flex flex-wrap gap-2 mt-4">
              {location.amenities.map((amenity: string) => (
                <span key={amenity} className="px-3 py-1.5 bg-white/5 rounded-lg text-sm text-white/70 border border-white/10">
                  {amenity}
                </span>
              ))}
            </div>
          </div>

          {/* Type-Specific Tips */}
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Good to Know</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-orange-400 mb-2">Tips for This {location.type}</h3>
                <ul className="space-y-2">
                  {typeInfo.tips.map((tip, index) => (
                    <li key={index} className="text-white/70 text-sm flex items-start gap-2">
                      <span className="text-orange-400 mt-1">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-orange-400 mb-2">What to Bring</h3>
                <ul className="space-y-2">
                  {typeInfo.whatToBring.map((item, index) => (
                    <li key={index} className="text-white/70 text-sm flex items-start gap-2">
                      <span className="text-orange-400 mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Upcoming Events */}
          {location.upcomingEvents && location.upcomingEvents.length > 0 && (
            <div className="bg-white/5 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-orange-400" />
                Upcoming Events
              </h2>
              <div className="space-y-4">
                {location.upcomingEvents.map((event: any, index: number) => {
                  const eventIcons: Record<string, typeof Trophy> = {
                    tournament: Trophy,
                    casual: Smile,
                    lesson: GraduationCap,
                    social: Users,
                  };
                  const eventColors: Record<string, string> = {
                    tournament: 'text-gold-400 bg-gold-500/10',
                    casual: 'text-green-400 bg-green-500/10',
                    lesson: 'text-blue-400 bg-blue-500/10',
                    social: 'text-purple-400 bg-purple-500/10',
                  };
                  const EventIcon = eventIcons[event.type];
                  return (
                    <div
                      key={index}
                      className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-orange-500/30 transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${eventColors[event.type]}`}>
                          <EventIcon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-white mb-1">{event.title}</h3>
                          <div className="flex items-center gap-3 text-sm text-white/60 mb-2">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {event.date}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {event.time}
                            </span>
                          </div>
                          <p className="text-sm text-white/70">{event.description}</p>
                          <div className="mt-2">
                            <span className={`text-xs px-2 py-1 rounded ${eventColors[event.type]} capitalize`}>
                              {event.type}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Map */}
          <div className="bg-white/5 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Location</h2>
            <Map
              markers={locationMarkers}
              center={mapCenter}
              zoom={15}
              height="300px"
              markerColor="#f97316"
            />
          </div>

          {/* Photo Gallery */}
          {location.photos && location.photos.length > 0 && (
            <PhotoGallery photos={location.photos} title="Venue Photos" />
          )}
        </motion.div>

        {/* Right Column - Active Games Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          {/* Check-in Section - At the top, only for real venues */}
          {location.id >= 1000 && (
            <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-2 border-green-500/30 rounded-xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-green-400" />
                  Checked In ({checkedInUsers.length})
                </h3>
              </div>

              {checkedInUsers.length > 0 ? (
                <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                  {checkedInUsers.map((checkedInUser) => (
                    <div
                      key={checkedInUser.user_id}
                      className={`flex items-center justify-between p-2 rounded-lg transition-all ${
                        user && checkedInUser.user_id !== user.id
                          ? 'bg-white/5 hover:bg-white/10 cursor-pointer'
                          : 'bg-white/5'
                      }`}
                      onClick={() => user && checkedInUser.user_id !== user.id && openChallengeModal(checkedInUser)}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse"></div>
                        <span className={`text-sm font-medium ${
                          user && checkedInUser.user_id !== user.id
                            ? 'text-white hover:text-green-400'
                            : 'text-white/70'
                        }`}>
                          {checkedInUser.user_name}
                          {user && checkedInUser.user_id === user.id && (
                            <span className="text-white/40 ml-1">(you)</span>
                          )}
                        </span>
                      </div>
                      {user && checkedInUser.user_id !== user.id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openChallengeModal(checkedInUser);
                          }}
                          className="flex items-center gap-1 px-2 py-1 bg-orange-500/20 text-orange-400 rounded text-xs font-medium hover:bg-orange-500/30 transition-colors"
                        >
                          <Swords className="w-3 h-3" />
                          Challenge
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-white/50 text-sm mb-4 text-center py-4">No one checked in yet. Be the first!</p>
              )}

              {/* Daily Check-in Limit Info */}
              {user && (
                <div className="mb-3 p-2 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-xs text-white/60 text-center">
                    Daily check-ins: <span className={`font-semibold ${remainingCheckins === 0 ? 'text-red-400' : 'text-green-400'}`}>{venuesCheckedInToday}/3</span>
                    {remainingCheckins > 0 && <span className="text-white/40"> • {remainingCheckins} remaining</span>}
                  </p>
                </div>
              )}

              <button
                onClick={handleCheckin}
                disabled={checkingIn || isCheckedInHere || remainingCheckins <= 0}
                className={`w-full py-3 font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                  isCheckedInHere
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30 cursor-not-allowed opacity-75'
                    : remainingCheckins <= 0
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30 cursor-not-allowed opacity-75'
                    : 'bg-green-500 text-white hover:bg-green-600'
                }`}
              >
                {isCheckedInHere ? (
                  <>
                    <Check className="w-5 h-5" />
                    Checked In (Auto-checkout at midnight)
                  </>
                ) : remainingCheckins <= 0 ? (
                  <>
                    <X className="w-5 h-5" />
                    Daily Limit Reached (3/3)
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    Check In Here
                  </>
                )}
              </button>

              {/* Post Open Challenge Button */}
              {user && (
                <button
                  onClick={openOpenChallengeModal}
                  className="w-full py-3 font-semibold rounded-lg transition-all flex items-center justify-center gap-2 bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border border-orange-500/30 mt-2"
                >
                  <Swords className="w-5 h-5" />
                  Post Open Challenge
                </button>
              )}
            </div>
          )}

          {/* Scheduled Games Section */}
          <div className="bg-gradient-to-br from-orange-500/20 to-gold-500/20 border-2 border-orange-500/30 rounded-xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-orange-400" />
                Scheduled Games
              </h3>
            </div>

            {loadingGames ? (
              <div className="text-center py-6">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
              </div>
            ) : activeGames.length === 0 ? (
              <div className="text-center py-6 bg-white/5 rounded-lg border border-dashed border-white/20">
                <Calendar className="w-12 h-12 text-white/20 mx-auto mb-3" />
                <p className="text-white/50 text-sm mb-3">No scheduled games</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 mb-4">
                {activeGames.map((game) => (
                  <div
                    key={game.id}
                    className="bg-white/10 rounded-lg p-3 border border-white/20 hover:border-orange-500/50 transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 text-white/60 text-xs mb-1">
                          <Calendar className="w-3 h-3" />
                          <span className="truncate">{formatDate(game.game_date)}, {formatTime(game.game_time)}</span>
                        </div>
                        <div className="flex items-center gap-1 mb-2">
                          <span className="text-white font-semibold text-sm truncate">{game.creator_name}</span>
                          <span className="text-white/50 text-xs">({game.creator_rating})</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {game.time_control && (
                            <span className="inline-block bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded text-xs">
                              {game.time_control}
                            </span>
                          )}
                          {game.player_level && (
                            <span className="inline-block bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded text-xs">
                              {game.player_level.split(' ')[0]}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Participants info */}
                    {game.participant_count > 0 && (
                      <div className="mt-2 pt-2 border-t border-white/10">
                        <button
                          onClick={() => setExpandedGameId(expandedGameId === game.id ? null : game.id)}
                          className="text-xs text-white/60 hover:text-white flex items-center gap-1 w-full"
                        >
                          <Users className="w-3 h-3" />
                          <span>{game.participant_count} player{game.participant_count !== 1 ? 's' : ''} joined</span>
                        </button>
                        {expandedGameId === game.id && game.participants && (
                          <div className="mt-2 space-y-1">
                            {game.participants.map((participant) => (
                              <div key={participant.id} className="flex items-center gap-2 text-xs">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                                <span className="text-white">{participant.name}</span>
                                <span className="text-white/50">({participant.rating})</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-white/60">
                        {game.participant_count}/{game.max_players} spots
                      </span>
                      <button
                        onClick={() => handleJoinGame(game.id)}
                        disabled={game.participant_count >= game.max_players}
                        className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                          game.participant_count >= game.max_players
                            ? 'bg-white/10 text-white/30 cursor-not-allowed'
                            : 'bg-orange-500 text-white hover:bg-orange-600'
                        }`}
                      >
                        {game.participant_count >= game.max_players ? 'Full' : 'Join'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Schedule Game Button */}
            {user ? (
              <button
                onClick={() => setShowCreateGame(true)}
                className="w-full py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-semibold flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Schedule a Game at This Venue
              </button>
            ) : (
              <button
                onClick={() => openAuthModal('login')}
                className="w-full py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors font-medium"
              >
                Sign in to schedule a game
              </button>
            )}
          </div>

          {/* Venue Leaderboard */}
          {leaderboard.length > 0 && (
            <div className="bg-gradient-to-br from-gold-500/20 to-amber-500/20 border-2 border-gold-500/30 rounded-xl p-5 shadow-lg">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Medal className="w-5 h-5 text-gold-400" />
                Venue Leaderboard
              </h3>
              <div className="space-y-2">
                {leaderboard.map((player, index) => (
                  <div
                    key={player.user_id}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      index === 0 ? 'bg-gold-500/20 border border-gold-500/30' :
                      index === 1 ? 'bg-gray-400/20 border border-gray-400/30' :
                      index === 2 ? 'bg-amber-600/20 border border-amber-600/30' :
                      'bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-gold-500 text-chess-darker' :
                        index === 1 ? 'bg-gray-400 text-chess-darker' :
                        index === 2 ? 'bg-amber-600 text-white' :
                        'bg-white/10 text-white/50'
                      }`}>
                        {index + 1}
                      </span>
                      <span className="text-white font-medium">{player.user_name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-semibold">{player.games_played} games</div>
                      <div className="text-white/50 text-xs">{player.total_checkins} check-ins</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Community Section */}
          <CommunitySection
            entityType="location"
            entityId={id || ''}
            entityName={location.name}
            isAdmin={!!user}
          />

          {/* Check-in Section for hardcoded venues - simplified version */}
          {location.id < 1000 && (
            <div className="bg-white/5 rounded-xl p-4 text-center">
              <p className="text-white/50 text-sm">Check-in available for registered venues only</p>
            </div>
          )}

          {/* Quick Action Button */}
          <div className="bg-white/5 rounded-xl p-4">
            <button
              onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.address)}`, '_blank')}
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white
                       font-semibold rounded-lg hover:from-orange-400 hover:to-orange-500
                       transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              <Navigation className="w-5 h-5" />
              Get Directions
            </button>
          </div>

          {/* Contact Info (for venues that have it) */}
          {(location.type === 'Cafe' || location.type === 'Bar') && (
            <div className="bg-white/5 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Contact</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-white/70">
                  <MapPin className="w-5 h-5 text-orange-400" />
                  <div className="text-sm">
                    <p className="font-medium text-white">{location.address}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-white/70">
                  <Phone className="w-5 h-5 text-orange-400" />
                  <span className="text-sm">Call for availability</span>
                </div>
                {location.type === 'Cafe' && (
                  <div className="flex items-center gap-3 text-white/70">
                    <Globe className="w-5 h-5 text-orange-400" />
                    <span className="text-sm">Visit website for menu</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Hours (for Library/Cafe) */}
          {(location.type === 'Library' || location.type === 'Cafe') && (
            <div className="bg-white/5 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Hours</h3>
              <div className="flex items-center gap-3 text-white/70">
                <Clock className="w-5 h-5 text-orange-400" />
                <span className="text-sm">{location.busyHours}</span>
              </div>
              <p className="text-xs text-white/50 mt-2">Hours may vary - call ahead to confirm</p>
            </div>
          )}

          {/* Fun Fact (for Parks/Plazas) */}
          {(location.type === 'Park' || location.type === 'Plaza') && (
            <div className="bg-gradient-to-br from-orange-500/10 to-gold-500/10 border border-orange-500/20 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-3">💡 Local Tip</h3>
              <p className="text-white/70 text-sm">
                {location.type === 'Park'
                  ? "This park is famous for chess! Many strong players frequent this spot. Don't be surprised if you see money games happening - they're part of the tradition here."
                  : "The chess scene here is vibrant and welcoming. Arrive early on weekends to claim a table, or be ready to challenge someone for a spot!"}
              </p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Venue Reviews Section - Only for real venues */}
      {location.id >= 1000 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 space-y-6"
        >
        {/* Submit Review */}
        <div className="bg-white/5 rounded-xl p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">Rate This Venue</h2>

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

          {/* Review Text */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white/70 mb-3">
              Your Review (optional)
            </label>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Share your experience at this venue..."
              className="w-full p-4 rounded-xl bg-white/5 border-2 border-transparent text-white
                       placeholder-white/30 focus:border-orange-500 focus:outline-none transition-all
                       resize-none h-32"
            />
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
              Venue Reviews ({reviews.length})
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
                  {review.review_text && (
                    <p className="text-white/70 text-sm mt-2">{review.review_text}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
      )}

      {/* Challenge Modal */}
      {showChallengeModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowChallengeModal(false)}>
          <div className="bg-chess-dark rounded-xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Swords className="w-6 h-6 text-orange-400" />
                {challengeTarget ? 'Challenge Player' : 'Post Open Challenge'}
              </h2>
              <button
                onClick={() => setShowChallengeModal(false)}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-white/50" />
              </button>
            </div>

            {challengeTarget && (
              <div className="bg-white/5 rounded-lg p-4 mb-6">
                <p className="text-white/50 text-sm mb-1">Challenging</p>
                <p className="text-white text-lg font-semibold">{challengeTarget.user_name}</p>
              </div>
            )}

            {!challengeTarget && (
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 mb-6">
                <p className="text-orange-400 text-sm">
                  Your challenge will appear in the open challenges board for anyone to accept!
                </p>
              </div>
            )}

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Time Control</label>
                <select
                  value={challengeTimeControl}
                  onChange={(e) => setChallengeTimeControl(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="Bullet (1+0)">Bullet (1+0)</option>
                  <option value="Bullet (2+1)">Bullet (2+1)</option>
                  <option value="Blitz (3+0)">Blitz (3+0)</option>
                  <option value="Blitz (5+0)">Blitz (5+0)</option>
                  <option value="Blitz (3+2)">Blitz (3+2)</option>
                  <option value="Blitz (5+3)">Blitz (5+3)</option>
                  <option value="Rapid (10+0)">Rapid (10+0)</option>
                  <option value="Rapid (15+10)">Rapid (15+10)</option>
                  <option value="Classical (30+0)">Classical (30+0)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Message (optional)</label>
                <textarea
                  value={challengeMessage}
                  onChange={(e) => setChallengeMessage(e.target.value)}
                  placeholder={challengeTarget ? "Let's play a game!" : "Looking for a game! Any takers?"}
                  rows={3}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={challengeTarget ? handleSendChallenge : handleSendOpenChallenge}
                disabled={sendingChallenge}
                className="flex-1 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                <Swords className="w-5 h-5" />
                {sendingChallenge ? 'Posting...' : (challengeTarget ? 'Send Challenge' : 'Post Challenge')}
              </button>
              <button
                onClick={() => setShowChallengeModal(false)}
                className="px-6 py-3 border border-white/20 text-white/70 rounded-lg font-medium hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Game Modal */}
      {showCreateGame && location && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowCreateGame(false)}>
          <div className="bg-chess-dark rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-white mb-4">Schedule a Game at {location.name}</h2>
            <CreateGameForm
              venue={location}
              onSuccess={() => {
                setShowCreateGame(false);
                // Refresh games list
                const fetchGames = async () => {
                  const response = await gamesApi.getGames({
                    status: 'open',
                    venue: location.name
                  });
                  setActiveGames(response.data);
                };
                fetchGames();
              }}
              onCancel={() => setShowCreateGame(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Inline Create Game Form Component
const CreateGameForm: React.FC<{
  venue: any; // Location object with venue details
  onSuccess: () => void;
  onCancel: () => void;
}> = ({ venue, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    game_date: '',
    game_time: '',
    time_control: '',
    player_level: '',
    max_players: 1,
    description: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'max_players'
        ? parseInt(value) || 0
        : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await gamesApi.createGame({
        venue_name: venue.name,
        venue_address: venue.address,
        ...formData
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create game');
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);
  const maxDateStr = maxDate.toISOString().split('T')[0];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">Date *</label>
          <input
            type="date"
            name="game_date"
            value={formData.game_date}
            onChange={handleChange}
            min={today}
            max={maxDateStr}
            required
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">Time *</label>
          <input
            type="time"
            name="game_time"
            value={formData.game_time}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-white/70 mb-2">Max Players</label>
        <input
          type="number"
          name="max_players"
          value={formData.max_players}
          onChange={handleChange}
          min="1"
          max="10"
          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-white/70 mb-2">Time Control</label>
        <select
          name="time_control"
          value={formData.time_control}
          onChange={handleChange}
          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        >
          <option value="">Any</option>
          <option value="Bullet (1+0)">Bullet (1+0)</option>
          <option value="Bullet (2+1)">Bullet (2+1)</option>
          <option value="Blitz (3+0)">Blitz (3+0)</option>
          <option value="Blitz (5+0)">Blitz (5+0)</option>
          <option value="Blitz (3+2)">Blitz (3+2)</option>
          <option value="Blitz (5+3)">Blitz (5+3)</option>
          <option value="Rapid (10+0)">Rapid (10+0)</option>
          <option value="Rapid (15+10)">Rapid (15+10)</option>
          <option value="Classical (30+0)">Classical (30+0)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-white/70 mb-2">Player Level</label>
        <select
          name="player_level"
          value={formData.player_level}
          onChange={handleChange}
          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        >
          <option value="">Any Level</option>
          <option value="Beginner (0-1000)">Beginner (0-1000)</option>
          <option value="Intermediate (1000-1500)">Intermediate (1000-1500)</option>
          <option value="Advanced (1500-2000)">Advanced (1500-2000)</option>
          <option value="Expert (2000+)">Expert (2000+)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-white/70 mb-2">Notes (optional)</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          placeholder="I'll be here for a couple hours, looking for casual games..."
          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-orange-500 text-white py-2.5 rounded-lg font-semibold hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Creating...' : 'Create Game'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2.5 border border-white/20 text-white/70 rounded-lg font-semibold hover:bg-white/5 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default LocationDetail;
