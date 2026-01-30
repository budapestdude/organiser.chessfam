import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Users, Star, ImageIcon, Trophy, ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { tournamentsApi, type Tournament } from '../api/tournaments';
import ImageGallery from '../components/ImageGallery';
import { buildTournamentUrl } from '../utils/slugify';

interface SeriesData {
  parent: Tournament;
  editions: Tournament[];
  stats: {
    totalEditions: number;
    totalParticipants: number;
    nextEdition?: Tournament;
    pastEditions: Tournament[];
    upcomingEditions: Tournament[];
  };
}

const TournamentSeriesHomepage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [seriesData, setSeriesData] = useState<SeriesData | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      try {
        const [seriesRes, imagesRes, reviewsRes] = await Promise.all([
          tournamentsApi.getTournamentSeries(parseInt(id)),
          tournamentsApi.getTournamentSeriesImages(parseInt(id)),
          tournamentsApi.getTournamentSeriesReviews(parseInt(id))
        ]);

        setSeriesData(seriesRes.data);
        setImages(imagesRes.data.images || []);
        setReviews(reviewsRes.data || []);
        setAverageRating(reviewsRes.meta?.averageRating || 0);
        setTotalReviews(reviewsRes.meta?.total || 0);
      } catch (err) {
        console.error('Error fetching series data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Loading series...</div>
      </div>
    );
  }

  if (!seriesData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Series not found</div>
      </div>
    );
  }

  const { parent, editions, stats } = seriesData;

  return (
    <div className="min-h-screen py-8 px-4 md:px-8 max-w-6xl mx-auto">
      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => navigate('/tournaments')}
        className="flex items-center gap-2 text-white/60 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Tournaments
      </motion.button>

      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        {parent.image && (
          <div className="w-full h-64 md:h-96 rounded-2xl overflow-hidden mb-6">
            <img
              src={parent.image}
              alt={parent.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-3">
          {parent.name}
        </h1>
        <p className="text-white/70 text-lg max-w-3xl">
          {parent.description}
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <Calendar className="w-6 h-6 text-gold-400 mb-3" />
            <div className="text-3xl font-bold text-white mb-1">
              {stats.totalEditions}
            </div>
            <div className="text-sm text-white/60">Editions Held</div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <Users className="w-6 h-6 text-blue-400 mb-3" />
            <div className="text-3xl font-bold text-white mb-1">
              {stats.totalParticipants}
            </div>
            <div className="text-sm text-white/60">Total Players</div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <Star className="w-6 h-6 text-yellow-400 mb-3" />
            <div className="text-3xl font-bold text-white mb-1">
              {averageRating.toFixed(1)}
            </div>
            <div className="text-sm text-white/60">Avg Rating</div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <ImageIcon className="w-6 h-6 text-purple-400 mb-3" />
            <div className="text-3xl font-bold text-white mb-1">
              {images.length}
            </div>
            <div className="text-sm text-white/60">Photos</div>
          </div>
        </div>
      </motion.div>

      {/* Next Edition Highlight */}
      {stats.nextEdition && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-gold-500/20 via-gold-600/10 to-transparent
                     border border-gold-500/30 rounded-2xl p-8 mb-10"
        >
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-gold-400" />
            <h2 className="text-xl font-semibold text-white">Next Edition</h2>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">
                {stats.nextEdition!.name}
              </h3>
              <div className="flex items-center gap-4 text-white/70">
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {new Date(stats.nextEdition!.start_date).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
                {stats.nextEdition!.venue_city && (
                  <span>{stats.nextEdition!.venue_city}</span>
                )}
              </div>
            </div>

            <button
              onClick={() => navigate(buildTournamentUrl(stats.nextEdition!.id, stats.nextEdition!.name))}
              className="px-8 py-4 bg-gold-500 text-chess-darker font-bold rounded-xl
                       hover:bg-gold-400 transition-all shadow-lg hover:shadow-gold-500/20
                       whitespace-nowrap"
            >
              Register Now
            </button>
          </div>
        </motion.div>
      )}

      {/* Tournament Editions Timeline */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-12"
      >
        <h2 className="text-3xl font-bold text-white mb-6">All Editions</h2>

        <div className="space-y-4">
          {editions.map((edition) => {
            const isPast = new Date(edition.start_date) < new Date() || edition.status === 'completed';

            return (
              <motion.div
                key={edition.id}
                whileHover={{ scale: 1.01 }}
                onClick={() => navigate(buildTournamentUrl(edition.id, edition.name))}
                className="bg-white/5 backdrop-blur-sm rounded-xl p-6 cursor-pointer
                         border border-white/10 hover:border-primary-500/30
                         transition-all hover:bg-white/10 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-xl font-bold text-white group-hover:text-gold-400 transition-colors">
                        {edition.name}
                      </h3>

                      {!isPast && (
                        <span className="px-3 py-1 bg-gold-500/20 text-gold-400 text-xs
                                       font-bold rounded-full border border-gold-500/30">
                          Upcoming
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-white/60">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {new Date(edition.start_date).toLocaleDateString()}
                      </div>

                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        {edition.current_participants} players
                      </div>

                      {edition.prize_pool && (
                        <div className="flex items-center gap-2">
                          <Trophy className="w-4 h-4" />
                          ${edition.prize_pool.toLocaleString()}
                        </div>
                      )}

                      {edition.venue_city && (
                        <div>{edition.venue_city}</div>
                      )}
                    </div>
                  </div>

                  <ArrowRight className="w-6 h-6 text-white/30 group-hover:text-white/60
                                       group-hover:translate-x-1 transition-all" />
                </div>
              </motion.div>
            );
          })}
        </div>

        {editions.length === 0 && (
          <div className="text-center py-12 text-white/50">
            No editions yet. Be the first to organize one!
          </div>
        )}
      </motion.section>

      {/* Photo Gallery */}
      {images.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-12"
        >
          <h2 className="text-3xl font-bold text-white mb-6">Photo Gallery</h2>
          <ImageGallery images={images} alt={`${parent.name} gallery`} />
        </motion.section>
      )}

      {/* Reviews Section */}
      {totalReviews > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-12"
        >
          <h2 className="text-3xl font-bold text-white mb-6">
            Reviews from All Editions
          </h2>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 mb-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                <span className="text-3xl font-bold text-white">
                  {averageRating.toFixed(1)}
                </span>
              </div>
              <div className="text-white/60">
                Based on {totalReviews} review{totalReviews !== 1 ? 's' : ''} across all editions
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {reviews.slice(0, 5).map((review) => (
              <div key={review.id} className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {review.reviewer_avatar && (
                      <img
                        src={review.reviewer_avatar}
                        alt={review.reviewer_name}
                        className="w-10 h-10 rounded-full"
                      />
                    )}
                    <div>
                      <div className="font-semibold text-white">{review.reviewer_name}</div>
                      <div className="text-sm text-white/50">
                        {review.tournament_name}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < review.rating
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-white/20'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <p className="text-white/80">{review.review_text}</p>
              </div>
            ))}
          </div>
        </motion.section>
      )}
    </div>
  );
};

export default TournamentSeriesHomepage;
