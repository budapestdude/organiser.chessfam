import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Star, Clock, Video, MessageSquare, Globe, Award, Heart, Send, Zap, Plus, Minus, Share2, Crown } from 'lucide-react';
import { masters, reviews } from '../data';
import { useStore } from '../store';
import { useState, useEffect } from 'react';
import { bookingsApi } from '../api/bookings';
import ReviewSection from '../components/ReviewSection';
import { Helmet } from 'react-helmet-async';
import Breadcrumbs from '../components/Breadcrumbs';

const MasterDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const master = masters.find((m) => m.id === Number(id));
  const masterReviews = reviews.filter((r) => r.masterId === Number(id));
  const { user, openAuthModal, addFavorite, removeFavorite, isFavorite, startConversation } = useStore();
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [hours, setHours] = useState(1);
  const [hasBooked, setHasBooked] = useState(false);

  // Check if user has booked this master
  useEffect(() => {
    const checkBooking = async () => {
      if (!master || !user) return;

      try {
        const bookings = await bookingsApi.getUserBookings();
        const hasBooking = bookings.data?.some((b: any) => b.master_id === master.id);
        setHasBooked(hasBooking || false);
      } catch (error) {
        console.error('Error checking bookings:', error);
      }
    };

    checkBooking();
  }, [master, user]);

  // Convert existing reviews to ReviewSection format
  const formattedReviews = masterReviews.map(r => ({
    id: r.id,
    user_name: r.playerName,
    user_avatar: r.playerAvatar,
    rating: r.rating,
    comment: r.comment,
    created_at: r.date
  }));

  const averageRating = masterReviews.length > 0
    ? masterReviews.reduce((sum, r) => sum + r.rating, 0) / masterReviews.length
    : 0;

  const handleSubmitReview = async (rating: number, comment: string) => {
    // Would call API to submit review
    console.log('Submitting review:', { rating, comment, masterId: master?.id });
    // After submit, refresh reviews
  };

  if (!master) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white/50">Master not found</p>
      </div>
    );
  }

  const sessionIcons: Record<string, typeof Video> = {
    'Lesson': Video,
    'Game Analysis': MessageSquare,
    'Rapid Match': Clock,
    'Blitz Training': Clock,
    'Opening Prep': MessageSquare,
    'Endgame Training': MessageSquare,
    'Beginner Training': Video,
    'Puzzle Solving': MessageSquare,
    'Chess960': Clock,
  };

  const timeSlots = ['9:00 AM', '10:00 AM', '11:00 AM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'];

  // Simple hourly rate
  const hourlyRate = master.price;
  const totalPrice = hourlyRate * hours;

  // Discount for multiple hours
  const getDiscount = () => {
    if (hours >= 5) return 0.15; // 15% off for 5+ hours
    if (hours >= 3) return 0.10; // 10% off for 3-4 hours
    return 0;
  };

  const discount = getDiscount();
  const discountedPrice = totalPrice * (1 - discount);

  const handleBook = async () => {
    if (!user) {
      openAuthModal('login');
      return;
    }

    if (!selectedSession || !selectedDate || !selectedTime) {
      alert('Please select an activity, date, and time');
      return;
    }

    try {
      const response = await bookingsApi.createBooking({
        master_id: master.id,
        session_type: selectedSession,
        booking_date: selectedDate,
        booking_time: selectedTime,
        time_control: 'rapid',
        number_of_games: hours, // Using this field for hours
        location_type: 'online',
        price_per_game: hourlyRate,
        total_price: discountedPrice,
        notes: `${hours} hour(s) booked`
      });

      // Redirect to payment page with booking data
      navigate('/payment', {
        state: {
          booking: {
            id: response.data.id,
            master_name: master.name,
            master_title: master.title,
            session_type: selectedSession,
            booking_date: selectedDate,
            booking_time: selectedTime,
            time_control: 'rapid',
            number_of_games: hours,
            location_type: 'online',
            total_price: discountedPrice,
            discount: discount > 0 ? `${discount * 100}%` : null,
            original_price: discount > 0 ? totalPrice : null
          }
        }
      });
    } catch (error: any) {
      console.error('Booking failed:', error);
      alert(error.response?.data?.message || 'Booking failed. Please try again.');
    }
  };

  // Handle share functionality
  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareTitle = `${master.title} ${master.name}`;
    const shareText = `Book chess lessons with ${master.title} ${master.name} on ChessFam! ${master.bio || ''}`;

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

  return (
    <div className="min-h-screen py-8 px-4 md:px-8 max-w-4xl mx-auto">
      <Helmet>
        <title>{master.title} {master.name} | Book Chess Lessons | ChessFam</title>
        <meta
          name="description"
          content={`Book a chess session with ${master.title} ${master.name} (${master.rating} ELO). ${master.bio || `Expert chess player offering lessons, game analysis, and training.`} Starting at $${master.price}/hour.`}
        />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="profile" />
        <meta property="og:url" content={`https://chessfam.com/master/${master.id}`} />
        <meta property="og:title" content={`${master.title} ${master.name} | Chess Master | ChessFam`} />
        <meta property="og:description" content={`Book a chess session with ${master.title} ${master.name} (${master.rating} ELO)`} />
        <meta property="og:image" content={master.image || 'https://chessfam.com/og-image.png'} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${master.title} ${master.name} | Chess Master`} />
        <meta name="twitter:description" content={`Book a chess session with ${master.title} ${master.name}`} />
        <meta name="twitter:image" content={master.image || 'https://chessfam.com/og-image.png'} />

        {/* Canonical URL */}
        <link rel="canonical" href={`https://chessfam.com/master/${master.id}`} />

        {/* Structured Data - Person Schema */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            "name": master.name,
            "jobTitle": master.title,
            "description": master.bio,
            "image": master.image || "https://chessfam.com/og-image.png",
            "url": `https://chessfam.com/master/${master.id}`,
            ...(master.languages && {
              "knowsLanguage": master.languages
            }),
            "memberOf": {
              "@type": "SportsOrganization",
              "name": "ChessFam",
              "sport": "Chess"
            },
            "award": master.title,
            "seeks": {
              "@type": "Demand",
              "name": "Chess lessons and coaching"
            },
            ...(averageRating > 0 && masterReviews.length > 0 && {
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": averageRating,
                "reviewCount": masterReviews.length,
                "bestRating": 5,
                "worstRating": 1
              }
            }),
            "makesOffer": {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": "Chess Lessons",
                "description": `Private chess lessons and training with ${master.title} ${master.name}`,
                "provider": {
                  "@type": "Person",
                  "name": master.name
                }
              },
              "price": master.price,
              "priceCurrency": "USD",
              "availability": master.available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
              "url": `https://chessfam.com/master/${master.id}`
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
                "name": "Masters",
                "item": "https://chessfam.com/masters"
              },
              {
                "@type": "ListItem",
                "position": 3,
                "name": master.name,
                "item": `https://chessfam.com/master/${master.id}`
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
          onClick={() => navigate('/masters')}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <button
          onClick={handleShare}
          className="p-2 rounded-lg bg-white/5 text-white/50 hover:bg-white/10 transition-colors"
          title="Share master profile"
        >
          <Share2 className="w-5 h-5" />
        </button>
      </motion.div>

      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Masters', path: '/masters' },
          { label: master.name }
        ]}
      />

      <div className="grid md:grid-cols-2 gap-8">
        {/* Left Column - Master Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="relative mb-6">
            <img
              src={master.image}
              alt={master.name}
              className="w-full aspect-square rounded-2xl object-cover"
            />
            <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
              {master.featured && (
                <div className="px-3 py-1 bg-gradient-to-r from-gold-500 to-gold-600 text-chess-darker
                              text-sm font-semibold rounded-full shadow-lg">
                  Featured
                </div>
              )}
              {!master.featured && <div />}
              {master.available ? (
                <div className="px-3 py-1 bg-green-500/20 text-green-400
                              text-sm font-medium rounded-full border border-green-500/30 backdrop-blur-sm">
                  Available
                </div>
              ) : (
                <div className="px-3 py-1 bg-white/10 text-white/50
                              text-sm font-medium rounded-full border border-white/20 backdrop-blur-sm">
                  Busy
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 mb-2">
            <span className="text-gold-400 font-medium">{master.title}</span>
            <span className="text-white/40">•</span>
            <span className="text-white/60">{master.rating} ELO</span>
          </div>

          <h1 className="text-3xl font-display font-bold text-white mb-2">{master.name}</h1>

          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-1">
              <Star className="w-5 h-5 text-gold-400 fill-gold-400" />
              <span className="font-semibold text-white">{master.avgRating}</span>
              <span className="text-white/50">({master.reviews} reviews)</span>
            </div>
            <div className="flex items-center gap-1 text-white/60">
              <Globe className="w-4 h-4" />
              {master.country}
            </div>
          </div>

          <p className="text-white/70 mb-6 leading-relaxed">{master.bio}</p>

          <div className="mb-6">
            <h3 className="text-sm font-medium text-white/50 mb-2">Languages</h3>
            <div className="flex flex-wrap gap-2">
              {master.languages.map((lang: string) => (
                <span key={lang} className="px-3 py-1 bg-white/5 rounded-full text-sm text-white/70">
                  {lang}
                </span>
              ))}
            </div>
          </div>

          {master.achievements && master.achievements.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-white/50 mb-2">Achievements</h3>
              <div className="space-y-2">
                {master.achievements.map((achievement: string) => (
                  <div key={achievement} className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-gold-400" />
                    <span className="text-white/80 text-sm">{achievement}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {master.responseTime && (
            <div className="mb-6 flex items-center gap-2 text-white/60">
              <Zap className="w-4 h-4 text-green-400" />
              <span className="text-sm">{master.responseTime}</span>
            </div>
          )}

          <div className="text-3xl font-bold text-white mb-4">
            ${hourlyRate}
            <span className="text-base font-normal text-white/50">/hour</span>
          </div>

          {master.premium_discount_eligible && hourlyRate > 0 && (
            <div className="bg-gold-500/10 border border-gold-500/30 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-gold-400" />
                <span className="text-sm font-medium text-gold-400">
                  Premium members save 10% (${(hourlyRate * 0.1).toFixed(2)}/hour)
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                if (!user) {
                  openAuthModal('login');
                  return;
                }
                if (isFavorite(master.id, 'master')) {
                  removeFavorite(master.id, 'master');
                } else {
                  addFavorite({
                    type: 'master',
                    itemId: master.id,
                    itemName: master.name,
                    itemImage: master.image,
                  });
                }
              }}
              className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-all
                        ${isFavorite(master.id, 'master')
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-white/5 text-white/70 hover:bg-white/10 border border-transparent'
                        }`}
            >
              <Heart className={`w-5 h-5 ${isFavorite(master.id, 'master') ? 'fill-current' : ''}`} />
              {isFavorite(master.id, 'master') ? 'Saved' : 'Save'}
            </button>
            <button
              onClick={() => {
                if (!user) {
                  openAuthModal('login');
                  return;
                }
                const convId = startConversation({
                  participantId: master.id,
                  participantName: master.name,
                  participantImage: master.image,
                  participantType: 'master',
                });
                navigate(`/messages?chat=${convId}`);
              }}
              className="flex-1 py-3 bg-white/5 text-white/70 rounded-xl flex items-center justify-center gap-2
                       hover:bg-white/10 transition-all"
            >
              <Send className="w-5 h-5" />
              Message
            </button>
          </div>
        </motion.div>

        {/* Right Column - Booking */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          {/* Session Types */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Select Session Type</h3>
            <div className="space-y-2">
              {master.sessionTypes.map((session: string) => {
                const Icon = sessionIcons[session] || Video;
                return (
                  <button
                    key={session}
                    onClick={() => setSelectedSession(session)}
                    className={`w-full p-4 rounded-xl flex items-center gap-3 transition-all
                              ${selectedSession === session
                                ? 'bg-gold-500/20 border-2 border-gold-500'
                                : 'bg-white/5 border-2 border-transparent hover:bg-white/10'
                              }`}
                  >
                    <Icon className={`w-5 h-5 ${selectedSession === session ? 'text-gold-400' : 'text-white/50'}`} />
                    <span className={selectedSession === session ? 'text-white' : 'text-white/70'}>
                      {session}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date Selection */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Select Date</h3>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full p-4 rounded-xl bg-white/5 border-2 border-transparent text-white
                       focus:border-gold-500 focus:outline-none transition-all"
            />
          </div>

          {/* Time Selection */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Select Start Time</h3>
            <div className="grid grid-cols-3 gap-2">
              {timeSlots.map((time) => (
                <button
                  key={time}
                  onClick={() => setSelectedTime(time)}
                  className={`p-3 rounded-xl text-sm font-medium transition-all
                            ${selectedTime === time
                              ? 'bg-gold-500 text-chess-darker'
                              : 'bg-white/5 text-white/70 hover:bg-white/10'
                            }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>

          {/* Hours Selection */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Number of Hours</h3>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setHours(Math.max(1, hours - 1))}
                disabled={hours <= 1}
                className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Minus className="w-5 h-5 text-white" />
              </button>
              <div className="flex-1 text-center">
                <span className="text-4xl font-bold text-white">{hours}</span>
                <span className="text-white/50 ml-2">hour{hours > 1 ? 's' : ''}</span>
              </div>
              <button
                onClick={() => setHours(Math.min(8, hours + 1))}
                disabled={hours >= 8}
                className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-5 h-5 text-white" />
              </button>
            </div>
            {/* Quick select buttons */}
            <div className="flex gap-2 mt-3">
              {[1, 2, 3, 5].map((h) => (
                <button
                  key={h}
                  onClick={() => setHours(h)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    hours === h
                      ? 'bg-gold-500 text-chess-darker'
                      : 'bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                >
                  {h}h
                </button>
              ))}
            </div>
          </div>

          {/* Price Display */}
          <div className="p-6 bg-white/5 rounded-xl border border-white/10">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-white/60">
                <span>${hourlyRate} × {hours} hour{hours > 1 ? 's' : ''}</span>
                <span>${totalPrice}</span>
              </div>
              {discount > 0 && (
                <div className="flex items-center justify-between text-green-400">
                  <span>Multi-hour discount ({(discount * 100).toFixed(0)}%)</span>
                  <span>-${(totalPrice - discountedPrice).toFixed(0)}</span>
                </div>
              )}
              <div className="border-t border-white/10 pt-3 flex items-center justify-between">
                <span className="text-white font-semibold">Total</span>
                <div className="text-right">
                  <span className="text-3xl font-bold text-gold-400">${discountedPrice.toFixed(0)}</span>
                  {discount > 0 && (
                    <span className="text-sm text-white/40 line-through ml-2">${totalPrice}</span>
                  )}
                </div>
              </div>
            </div>
            {hours >= 3 && hours < 5 && (
              <p className="text-sm text-green-400 mt-3 text-center">
                Book 5+ hours for 15% off!
              </p>
            )}
            {hours < 3 && (
              <p className="text-sm text-white/40 mt-3 text-center">
                Book 3+ hours for 10% off!
              </p>
            )}
          </div>

          {/* Book Button */}
          <button
            onClick={handleBook}
            disabled={!master.available || !selectedSession || !selectedDate || !selectedTime}
            className="w-full py-4 bg-gradient-to-r from-gold-500 to-gold-600 text-chess-darker
                     font-semibold rounded-xl hover:from-gold-400 hover:to-gold-500
                     transition-all disabled:opacity-50 disabled:cursor-not-allowed
                     disabled:hover:from-gold-500 disabled:hover:to-gold-600"
          >
            {!user
              ? 'Sign in to Book'
              : `Book ${hours} Hour${hours > 1 ? 's' : ''} for $${discountedPrice.toFixed(0)}`}
          </button>

          {!master.available && (
            <p className="text-center text-white/50 text-sm">
              This master is currently unavailable. Check back later.
            </p>
          )}
        </motion.div>
      </div>

      {/* Reviews Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-12"
      >
        <ReviewSection
          entityType="master"
          entityId={master.id}
          reviews={formattedReviews}
          averageRating={averageRating}
          totalReviews={masterReviews.length}
          canReview={hasBooked}
          requiresBooking={true}
          onSubmitReview={handleSubmitReview}
        />
      </motion.div>
    </div>
  );
};

export default MasterDetail;
