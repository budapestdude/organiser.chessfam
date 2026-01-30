import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Star, Clock, Video, MessageSquare, Globe, Award, Quote, Heart, Send, Zap } from 'lucide-react';
import { masters, reviews } from '../data';
import { useStore } from '../store';
import { useState } from 'react';
import { bookingsApi } from '../api/bookings';

const MasterDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const master = masters.find((m) => m.id === Number(id));
  const masterReviews = reviews.filter((r) => r.masterId === Number(id));
  const { user, openAuthModal, addFavorite, removeFavorite, isFavorite, startConversation } = useStore();
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');

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
        number_of_games: 1,
        location_type: 'online',
        price_per_game: hourlyRate,
        total_price: hourlyRate,
        notes: ''
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
            number_of_games: 1,
            location_type: 'online',
            total_price: hourlyRate
          }
        }
      });
    } catch (error: any) {
      console.error('Booking failed:', error);
      alert(error.response?.data?.message || 'Booking failed. Please try again.');
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
              {master.languages.map((lang) => (
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
                {master.achievements.map((achievement) => (
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
              {master.sessionTypes.map((session) => {
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

          {/* Price Display */}
          <div className="p-6 bg-white/5 rounded-xl border border-white/10">
            <div className="text-center">
              <div className="text-sm text-white/50 mb-2">Hourly Rate</div>
              <div className="text-4xl font-bold text-gold-400">
                ${hourlyRate}
              </div>
              <div className="text-sm text-white/50 mt-2">per hour</div>
            </div>
          </div>

          {/* Time Selection */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Select Time</h3>
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
              : `Book 1 Hour for $${hourlyRate}`}
          </button>

          {!master.available && (
            <p className="text-center text-white/50 text-sm">
              This master is currently unavailable. Check back later.
            </p>
          )}
        </motion.div>
      </div>

      {/* Reviews Section */}
      {masterReviews.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-12"
        >
          <h2 className="text-2xl font-display font-bold text-white mb-6">
            Reviews ({masterReviews.length})
          </h2>
          <div className="space-y-4">
            {masterReviews.map((review) => (
              <div
                key={review.id}
                className="bg-white/5 rounded-2xl p-6 border border-white/10"
              >
                <div className="flex items-start gap-4">
                  <img
                    src={review.userImage}
                    alt={review.userName}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-white">{review.userName}</h4>
                        <span className="text-sm text-white/50">{review.sessionType}</span>
                      </div>
                      <div className="flex items-center gap-1">
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
                    </div>
                    <div className="relative">
                      <Quote className="absolute -left-1 -top-1 w-6 h-6 text-white/10" />
                      <p className="text-white/70 pl-6">{review.comment}</p>
                    </div>
                    <p className="text-sm text-white/40 mt-3">
                      {new Date(review.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default MasterDetail;
