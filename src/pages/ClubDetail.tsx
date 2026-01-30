import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Star, Users, Clock, MapPin, Phone, Globe, Heart, Edit, Share2, Crown, Loader2 } from 'lucide-react';
import { useStore } from '../store';
import { useState, useEffect } from 'react';
import { clubsApi, type Club } from '../api/clubs';
import { clubReviewsApi } from '../api/clubReviews';
import { postsApi } from '../api/posts';
import ReviewSection from '../components/ReviewSection';
import ImageGallery from '../components/ImageGallery';
import CommunitySection from '../components/CommunitySection';
import EditClub from '../components/EditClub';
import { Helmet } from 'react-helmet-async';
import Breadcrumbs from '../components/Breadcrumbs';

const ClubDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, openAuthModal, addFavorite, removeFavorite, isFavorite } = useStore();
  const [selectedPlan, setSelectedPlan] = useState<'month' | 'year'>('month');
  const [memberName, setMemberName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRating, setMemberRating] = useState('');
  const [memberPhone, setMemberPhone] = useState('');
  const [isMember, setIsMember] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [averageRating, setAverageRating] = useState(4.5);
  const [totalReviews, setTotalReviews] = useState(0);
  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [userRole, setUserRole] = useState<string | undefined>(undefined);
  const [sharingToFeed, setSharingToFeed] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareMessage, setShareMessage] = useState('');

  // Fetch club data, check membership, and fetch reviews
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setNotFound(false);

        // Fetch club data from API
        const clubResponse = await clubsApi.getClubById(Number(id));
        setClub(clubResponse.data.data || clubResponse.data);

        // Check if user is a member and get role
        if (user) {
          const memberships = await clubsApi.getMyMemberships();
          const membership = memberships.data?.find((m: any) => m.club_id === Number(id));
          setIsMember(!!membership);
          setUserRole(membership?.role);
        }

        // Fetch reviews from API
        const reviewData = await clubReviewsApi.getClubReviews(Number(id));
        setReviews(reviewData.reviews || []);
        setAverageRating(reviewData.stats?.averageRating || 4.5);
        setTotalReviews(reviewData.stats?.totalReviews || 0);
      } catch (error: any) {
        console.error('Error fetching club data:', error);
        if (error.response?.status === 404) {
          setNotFound(true);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, user]);

  const handleSubmitReview = async (rating: number, comment: string) => {
    if (!club || !id) return;

    try {
      await clubReviewsApi.submitReview({
        clubId: club.id,
        rating,
        reviewText: comment
      });

      // Refresh reviews after submit
      const reviewData = await clubReviewsApi.getClubReviews(Number(id));
      setReviews(reviewData.reviews || []);
      setAverageRating(reviewData.stats?.averageRating || 4.5);
      setTotalReviews(reviewData.stats?.totalReviews || 0);
    } catch (error: any) {
      console.error('Error submitting review:', error);
      alert(error.response?.data?.message || 'Failed to submit review');
    }
  };

  // Handle share functionality
  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareTitle = club?.name || 'Chess Club';
    const shareText = `Check out ${shareTitle} on ChessFam! ${club?.description || ''}`;

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="inline-block w-12 h-12 border-4 border-gold-400/30 border-t-gold-400 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (notFound || !club) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white/50">Club not found</p>
      </div>
    );
  }

  const monthlyFee = Number(club.membership_fee) || 50;
  const plans = {
    month: { name: 'Monthly', price: monthlyFee, type: 'monthly' as const },
    year: { name: 'Annual', price: Math.round(monthlyFee * 10), type: 'yearly' as const },
  };

  const openShareModal = () => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    if (!club) return;

    setShareMessage(`Check out this chess club! ${club.name}`);
    setShowShareModal(true);
  };

  const handleShareToFeed = async () => {
    if (!club || !shareMessage.trim()) return;

    try {
      setSharingToFeed(true);
      await postsApi.createPost({
        content: shareMessage,
        image: club.image || undefined,
        linked_entity_type: 'club',
        linked_entity_id: club.id,
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
            club_location: `${club.city}${club.country ? ', ' + club.country : ''}`,
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

  const handleLeaveClub = async () => {
    if (!user || !club) return;

    if (!confirm(`Are you sure you want to leave ${club.name}? You will lose access to club events and messages.`)) {
      return;
    }

    try {
      await clubsApi.leaveClub(club.id);
      setIsMember(false);
      alert('You have successfully left the club.');
      // Refresh club data
      const clubResponse = await clubsApi.getClubById(club.id);
      setClub(clubResponse.data.data || clubResponse.data);
    } catch (error: any) {
      console.error('Failed to leave club:', error);
      alert(error.response?.data?.error || 'Failed to leave club. Please try again.');
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 md:px-8 max-w-4xl mx-auto">
      <Helmet>
        <title>{club.name} | Chess Club | ChessFam</title>
        <meta
          name="description"
          content={`${club.description?.slice(0, 155) || `Join ${club.name} - Chess club in ${club.city || 'your area'}. ${club.member_count || 0} members. ${club.meeting_schedule || 'Regular meetings'}.`}`}
        />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://chessfam.com/club/${club.id}`} />
        <meta property="og:title" content={`${club.name} | Chess Club | ChessFam`} />
        <meta property="og:description" content={club.description || `Join ${club.name} - Chess club on ChessFam`} />
        <meta property="og:image" content={club.image || 'https://chessfam.com/og-image.png'} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${club.name} | Chess Club | ChessFam`} />
        <meta name="twitter:description" content={club.description || `Join ${club.name}`} />
        <meta name="twitter:image" content={club.image || 'https://chessfam.com/og-image.png'} />

        {/* Canonical URL */}
        <link rel="canonical" href={`https://chessfam.com/club/${club.id}`} />

        {/* Structured Data - Organization Schema */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SportsOrganization",
            "name": club.name,
            "description": club.description,
            "image": club.image || "https://chessfam.com/og-image.png",
            "url": `https://chessfam.com/club/${club.id}`,
            ...(club.city && {
              "address": {
                "@type": "PostalAddress",
                "addressLocality": club.city,
                "addressCountry": club.country || "US"
              }
            }),
            ...(club.contact_email && {
              "email": club.contact_email
            }),
            ...(club.website && {
              "sameAs": [club.website]
            }),
            "sport": "Chess",
            "memberOf": {
              "@type": "SportsOrganization",
              "name": "ChessFam"
            },
            ...(club.member_count && {
              "numberOfEmployees": {
                "@type": "QuantitativeValue",
                "value": club.member_count
              }
            }),
            ...(averageRating > 0 && totalReviews > 0 && {
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": averageRating,
                "reviewCount": totalReviews,
                "bestRating": 5,
                "worstRating": 1
              }
            }),
            "offers": {
              "@type": "Offer",
              "category": "Membership",
              "price": club.membership_fee || 0,
              "priceCurrency": "USD",
              "availability": "https://schema.org/InStock",
              "url": `https://chessfam.com/club/${club.id}`
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
                "name": "Clubs",
                "item": "https://chessfam.com/clubs"
              },
              {
                "@type": "ListItem",
                "position": 3,
                "name": club.name,
                "item": `https://chessfam.com/club/${club.id}`
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
          onClick={() => navigate('/clubs')}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <button
          onClick={handleShare}
          className="p-2 rounded-lg bg-white/5 text-white/50 hover:bg-white/10 transition-colors"
          title="Share club"
        >
          <Share2 className="w-5 h-5" />
        </button>
      </motion.div>

      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Clubs', path: '/clubs' },
          { label: club.name }
        ]}
      />

      {/* Hero Image */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl overflow-hidden mb-8"
      >
        <img
          src={club.image || '/default-club-image.jpg'}
          alt={club.name}
          className="w-full h-64 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-chess-darker via-transparent to-transparent" />
        <div className="absolute bottom-4 left-4">
          <h1 className="text-3xl font-display font-bold text-white">{club.name}</h1>
        </div>
        {userRole === 'owner' && (
          <div className="absolute top-4 right-4">
            <button
              onClick={() => setShowEditModal(true)}
              className="px-4 py-2 bg-gold-500/20 border border-gold-500/30 rounded-lg text-gold-400
                       hover:bg-gold-500/30 transition-all flex items-center gap-2 font-medium backdrop-blur-sm"
            >
              <Edit className="w-4 h-4" />
              Edit Club
            </button>
          </div>
        )}
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
              <span className="font-semibold text-white">{averageRating.toFixed(1)}</span>
              <span className="text-white/50">({totalReviews} reviews)</span>
            </div>
            <div className="flex items-center gap-1 text-white/60">
              <Users className="w-4 h-4" />
              {club.member_count || 0} members
            </div>
            <div className="flex items-center gap-1 text-gold-400">
              <MapPin className="w-4 h-4" />
              {club.city}{club.country && `, ${club.country}`}
            </div>
          </div>

          <p className="text-white/70 leading-relaxed">{club.description || 'No description available.'}</p>

          {/* Info Cards */}
          <div className="grid grid-cols-2 gap-4">
            {club.meeting_schedule && (
              <div className="bg-white/5 rounded-xl p-4">
                <div className="flex items-center gap-2 text-white/50 mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">Meeting Schedule</span>
                </div>
                <p className="text-white font-medium">{club.meeting_schedule}</p>
              </div>
            )}
            {club.address && (
              <div className="bg-white/5 rounded-xl p-4">
                <div className="flex items-center gap-2 text-white/50 mb-1">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">Address</span>
                </div>
                <p className="text-white font-medium text-sm">{club.address}</p>
              </div>
            )}
            {club.website && (
              <div className="bg-white/5 rounded-xl p-4">
                <div className="flex items-center gap-2 text-white/50 mb-1">
                  <Globe className="w-4 h-4" />
                  <span className="text-sm">Website</span>
                </div>
                <a href={club.website} target="_blank" rel="noopener noreferrer" className="text-gold-400 font-medium text-sm hover:underline">
                  Visit Website
                </a>
              </div>
            )}
            {club.contact_email && (
              <div className="bg-white/5 rounded-xl p-4">
                <div className="flex items-center gap-2 text-white/50 mb-1">
                  <Phone className="w-4 h-4" />
                  <span className="text-sm">Contact</span>
                </div>
                <p className="text-white font-medium text-sm">{club.contact_email}</p>
              </div>
            )}
          </div>

          {/* Image Gallery */}
          {club.images && club.images.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Gallery</h3>
              <div className="grid grid-cols-3 gap-2">
                {club.images.map((img, index) => (
                  <img key={index} src={img} alt={`${club.name} ${index + 1}`} className="w-full h-24 object-cover rounded-lg" />
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

            {club.premium_discount_eligible && club.membership_fee > 0 && (
              <div className="bg-gold-500/10 border border-gold-500/30 rounded-lg p-3 mb-6">
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-gold-400" />
                  <span className="text-sm font-medium text-gold-400">
                    Premium members save 10%
                  </span>
                </div>
              </div>
            )}

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
                    itemImage: club.image || '',
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

            <button
              onClick={openShareModal}
              className="w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30"
            >
              <Share2 className="w-4 h-4" />
              Share to Feed
            </button>

            {user && isMember && (
              <button
                onClick={handleLeaveClub}
                className="w-full py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400
                         hover:bg-red-500/20 flex items-center justify-center gap-2 transition-all font-medium"
              >
                <Users className="w-4 h-4" />
                Leave Club
              </button>
            )}
          </div>

          {/* Community Section */}
          <CommunitySection
            entityType="club"
            entityId={id || ''}
            entityName={club.name}
            isAdmin={!!user}
          />
        </motion.div>
      </div>

      {/* Gallery */}
      {club.images && club.images.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <h2 className="text-xl font-semibold text-white mb-4">Gallery</h2>
          <ImageGallery
            images={club.images}
            alt={club.name || 'Club gallery'}
          />
        </motion.div>
      )}

      {/* Reviews Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-8"
      >
        <ReviewSection
          entityType="club"
          entityId={club.id}
          reviews={reviews}
          averageRating={averageRating}
          totalReviews={totalReviews}
          canReview={isMember}
          requiresBooking={true}
          onSubmitReview={handleSubmitReview}
        />
      </motion.div>

      {/* Edit Club Modal */}
      <EditClub
        club={club}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onUpdate={(updatedClub) => {
          setClub(updatedClub);
          setShowEditModal(false);
        }}
      />

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
              placeholder="Write something about this club..."
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

export default ClubDetail;
