import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  MapPin,
  Globe,
  Star,
  MessageCircle,
  Calendar,
  DollarSign,
  Award,
  Languages,
  Briefcase,
  CheckCircle
} from 'lucide-react';
import { professionalsApi } from '../api/professionals';
import { useStore } from '../store';
import BookingWidget from '../components/BookingWidget';
import ReviewCard from '../components/ReviewCard';
import ReviewForm from '../components/ReviewForm';

interface Professional {
  id: number;
  user_id: number;
  professional_type: string;
  name: string;
  bio?: string;
  profile_image?: string;
  credentials?: any;
  experience_years?: number;
  specialties?: string[];
  languages?: string[];
  country?: string;
  city?: string;
  remote_available: boolean;
  onsite_available: boolean;
  available: boolean;
  verified: boolean;
  total_bookings: number;
  total_reviews: number;
  average_rating: number;
}

interface Service {
  id: number;
  service_name: string;
  service_description?: string;
  pricing_model: string;
  base_price?: number;
  currency: string;
  available: boolean;
}

export default function ProfessionalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useStore();

  const [professional, setProfessional] = useState<Professional | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [ratingBreakdown, setRatingBreakdown] = useState<any>(null);
  const [canReview, setCanReview] = useState(false);
  const [bookingIdForReview, setBookingIdForReview] = useState<number | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllReviews, setShowAllReviews] = useState(false);

  useEffect(() => {
    fetchProfessional();
    fetchReviews();
    if (user) {
      checkCanReview();
    }
  }, [id, user]);

  const fetchProfessional = async () => {
    try {
      setLoading(true);
      setError(null);

      const [proResult, servicesResult] = await Promise.all([
        professionalsApi.getProfessionalById(parseInt(id!)),
        professionalsApi.getProfessionalServices(parseInt(id!))
      ]);

      setProfessional(proResult.data);
      setServices(servicesResult.data);
    } catch (err: any) {
      console.error('Failed to fetch professional:', err);
      setError(err.response?.data?.message || 'Failed to load professional');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const [reviewsResult, breakdownResult] = await Promise.all([
        professionalsApi.getProfessionalReviews(parseInt(id!), { limit: showAllReviews ? 100 : 5 }),
        professionalsApi.getRatingBreakdown(parseInt(id!))
      ]);

      setReviews(reviewsResult.data.data || reviewsResult.data);
      setRatingBreakdown(breakdownResult.data);
    } catch (err: any) {
      console.error('Failed to fetch reviews:', err);
    }
  };

  const checkCanReview = async () => {
    try {
      const result = await professionalsApi.canUserReview(parseInt(id!));
      setCanReview(result.data.canReview);
      setBookingIdForReview(result.data.bookingId);
    } catch (err: any) {
      console.error('Failed to check review status:', err);
    }
  };

  const handleReviewSuccess = () => {
    // Refresh professional data and reviews
    fetchProfessional();
    fetchReviews();
    setCanReview(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20 pb-12 px-4 md:px-8 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500 mb-4"></div>
          <p className="text-white/60">Loading professional...</p>
        </div>
      </div>
    );
  }

  if (error || !professional) {
    return (
      <div className="min-h-screen pt-20 pb-12 px-4 md:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Error</h2>
          <p className="text-white/60 mb-6">{error || 'Professional not found'}</p>
          <button
            onClick={() => navigate('/professionals')}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
          >
            Back to Professionals
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate('/professionals')}
          className="flex items-center gap-2 text-white/60 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Professionals
        </motion.button>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-2">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 mb-6"
            >
              <div className="flex items-start gap-6">
                {/* Profile Image */}
                <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                  {professional.profile_image ? (
                    <img
                      src={professional.profile_image}
                      alt={professional.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl text-white/40">
                      {professional.name.charAt(0)}
                    </span>
                  )}
                </div>

                <div className="flex-1">
                  {/* Name and Verified Badge */}
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-display font-bold text-white">
                      {professional.name}
                    </h1>
                    {professional.verified && (
                      <div className="flex items-center gap-1 px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
                        <CheckCircle className="w-4 h-4" />
                        Verified
                      </div>
                    )}
                  </div>

                  {/* Type Badge */}
                  <div className="mb-4">
                    <span className="px-4 py-1.5 bg-gold-500/20 text-gold-400 text-sm font-medium rounded-full capitalize">
                      {professional.professional_type.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Rating */}
                  {professional.total_reviews > 0 && (
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-5 h-5 ${
                                i < Math.floor(professional.average_rating)
                                  ? 'text-yellow-400 fill-yellow-400'
                                  : 'text-white/20'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-white font-medium">
                          {professional.average_rating.toFixed(1)}
                        </span>
                      </div>
                      <span className="text-white/60">
                        {professional.total_reviews} reviews
                      </span>
                    </div>
                  )}

                  {/* Quick Stats */}
                  <div className="flex flex-wrap gap-4 text-sm text-white/60">
                    {professional.experience_years && (
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4" />
                        {professional.experience_years} years experience
                      </div>
                    )}
                    {professional.total_bookings > 0 && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {professional.total_bookings} bookings
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Bio */}
            {professional.bio && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-6"
              >
                <h2 className="text-xl font-bold text-white mb-4">About</h2>
                <p className="text-white/80 whitespace-pre-wrap">{professional.bio}</p>
              </motion.div>
            )}

            {/* Specialties */}
            {professional.specialties && professional.specialties.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-6"
              >
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-gold-400" />
                  Specialties
                </h2>
                <div className="flex flex-wrap gap-2">
                  {professional.specialties.map((specialty, i) => (
                    <span
                      key={i}
                      className="px-4 py-2 bg-white/10 text-white rounded-lg"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Languages */}
            {professional.languages && professional.languages.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
              >
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Languages className="w-5 h-5 text-blue-400" />
                  Languages
                </h2>
                <div className="flex flex-wrap gap-2">
                  {professional.languages.map((language, i) => (
                    <span
                      key={i}
                      className="px-4 py-2 bg-white/10 text-white rounded-lg"
                    >
                      {language}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Right Column - Services & Actions */}
          <div className="lg:col-span-1">
            {/* Location & Availability */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-6"
            >
              <h3 className="text-lg font-bold text-white mb-4">Location & Availability</h3>

              {professional.city && professional.country && (
                <div className="flex items-start gap-3 mb-3">
                  <MapPin className="w-5 h-5 text-white/60 flex-shrink-0 mt-0.5" />
                  <span className="text-white/80">
                    {professional.city}, {professional.country}
                  </span>
                </div>
              )}

              {professional.remote_available && (
                <div className="flex items-start gap-3 mb-3">
                  <Globe className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-green-400">Remote services available</span>
                </div>
              )}

              {!professional.available && (
                <div className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm">
                  Currently unavailable
                </div>
              )}
            </motion.div>

            {/* Booking Widget */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-6"
            >
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-gold-400" />
                Book a Service
              </h3>
              <BookingWidget
                professionalId={professional.id}
                professionalName={professional.name}
                services={services}
                available={professional.available}
              />
            </motion.div>

            {/* Contact */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <button
                onClick={() => alert('Messaging coming soon!')}
                className="w-full px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                Send Message
              </button>
            </motion.div>
          </div>
        </div>

        {/* Reviews Section */}
        {professional.total_reviews > 0 || canReview ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8"
          >
            <h2 className="text-2xl font-display font-bold text-white mb-6">Reviews & Ratings</h2>

            {/* Rating Summary */}
            {ratingBreakdown && ratingBreakdown.total_reviews > 0 && (
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Overall Rating */}
                  <div className="text-center md:text-left">
                    <div className="text-5xl font-bold text-white mb-2">
                      {ratingBreakdown.average_rating.toFixed(1)}
                    </div>
                    <div className="flex items-center justify-center md:justify-start gap-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-6 h-6 ${
                            i < Math.floor(ratingBreakdown.average_rating)
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-white/20'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-white/60">{ratingBreakdown.total_reviews} reviews</p>
                  </div>

                  {/* Rating Breakdown */}
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map((rating) => {
                      const count = ratingBreakdown.rating_counts[rating] || 0;
                      const percentage = ratingBreakdown.total_reviews > 0
                        ? (count / ratingBreakdown.total_reviews) * 100
                        : 0;

                      return (
                        <div key={rating} className="flex items-center gap-3">
                          <div className="flex items-center gap-1 w-16">
                            <span className="text-white/80">{rating}</span>
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          </div>
                          <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gold-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-white/60 text-sm w-12 text-right">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Write Review */}
            {canReview && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-6"
              >
                <h3 className="text-lg font-bold text-white mb-4">Write a Review</h3>
                <ReviewForm
                  professionalId={professional.id}
                  professionalName={professional.name}
                  bookingId={bookingIdForReview}
                  onSuccess={handleReviewSuccess}
                />
              </motion.div>
            )}

            {/* Reviews List */}
            {reviews.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white">
                  Recent Reviews ({reviews.length})
                </h3>
                {reviews.map((review, index) => (
                  <ReviewCard key={review.id} review={review} index={index} />
                ))}

                {/* Show More Button */}
                {!showAllReviews && professional.total_reviews > 5 && (
                  <button
                    onClick={() => {
                      setShowAllReviews(true);
                      fetchReviews();
                    }}
                    className="w-full px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl transition-colors"
                  >
                    Show All {professional.total_reviews} Reviews
                  </button>
                )}
              </div>
            )}
          </motion.div>
        ) : null}
      </div>
    </div>
  );
}
