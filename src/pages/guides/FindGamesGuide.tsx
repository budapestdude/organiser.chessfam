import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Search, MapPin, Calendar, MessageSquare, Star, CheckCircle } from 'lucide-react';

const FindGamesGuide = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen py-8 px-4 md:px-8 max-w-4xl mx-auto">
      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => navigate('/guides')}
        className="flex items-center gap-2 text-white/60 hover:text-white mb-8 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Guides
      </motion.button>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white">
            How to Find Games & Players
          </h1>
        </div>
        <p className="text-lg text-white/70">
          Connect with chess players in your area and organize games on ChessFam
        </p>
      </motion.div>

      {/* Guide Content */}
      <div className="space-y-8">
        {/* Step 1 */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-green-400 font-bold">1</span>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-3">Search for Players Near You</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Search className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-white mb-1">Browse the Players Directory</h3>
                    <p className="text-sm text-white/60">
                      Go to the Players page and use filters to find players by location, rating range, and availability.
                    </p>
                  </div>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <h3 className="font-semibold text-white mb-2">Filter Options:</h3>
                  <ul className="text-sm text-white/60 space-y-1 ml-4 list-disc">
                    <li><strong className="text-white">Location:</strong> Find players in your city or neighborhood</li>
                    <li><strong className="text-white">Rating:</strong> Look for opponents near your skill level</li>
                    <li><strong className="text-white">Online Status:</strong> See who's currently active</li>
                    <li><strong className="text-white">Availability:</strong> Players looking for games right now</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Step 2 */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-green-400 font-bold">2</span>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-3">Join Chess Clubs</h2>
              <div className="space-y-3">
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-5 h-5 text-purple-400" />
                    <h3 className="font-semibold text-white">Find Local Clubs</h3>
                  </div>
                  <p className="text-sm text-white/60 mb-3">
                    Chess clubs are the best way to find regular opponents and build lasting friendships.
                  </p>
                  <ul className="text-sm text-white/60 space-y-1 ml-4 list-disc">
                    <li>Browse clubs in your area on the Clubs page</li>
                    <li>Check meeting schedules and locations</li>
                    <li>Join clubs that match your skill level and interests</li>
                    <li>Attend meetings to play casual games with members</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Step 3 */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-green-400 font-bold">3</span>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-3">Visit Chess Venues</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-white mb-1">Discover Chess-Friendly Locations</h3>
                    <p className="text-sm text-white/60">
                      Find cafes, parks, community centers, and chess clubs where players regularly meet.
                    </p>
                  </div>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <h3 className="font-semibold text-white mb-2">Venue Features:</h3>
                  <ul className="text-sm text-white/60 space-y-1 ml-4 list-disc">
                    <li>Check-in to let others know you're there</li>
                    <li>See who else is currently at the venue</li>
                    <li>View upcoming events and tournaments</li>
                    <li>Read reviews from other players</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Step 4 */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-green-400 font-bold">4</span>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-3">Send Game Invitations</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MessageSquare className="w-5 h-5 text-yellow-400 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-white mb-1">Direct Messaging</h3>
                    <p className="text-sm text-white/60">
                      Message players directly to propose a game. Be specific about when and where you'd like to meet.
                    </p>
                  </div>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <h3 className="font-semibold text-white mb-2">Example Message:</h3>
                  <p className="text-sm text-white/60 italic">
                    "Hi! I noticed you're in Brooklyn too. Would you be interested in playing at Brooklyn Chess Club this Saturday around 2 PM? I'm around 1600 rating and looking for casual games."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Step 5 */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-green-400 font-bold">5</span>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-3">Register for Tournaments</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gold-400 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-white mb-1">Competitive Play</h3>
                    <p className="text-sm text-white/60">
                      Tournaments are a great way to play multiple games in one day and meet many players.
                    </p>
                  </div>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <h3 className="font-semibold text-white mb-2">Tournament Benefits:</h3>
                  <ul className="text-sm text-white/60 space-y-1 ml-4 list-disc">
                    <li>Play multiple rated games in organized setting</li>
                    <li>Meet players at your skill level</li>
                    <li>Network with the local chess community</li>
                    <li>Improve your rating and gain experience</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Step 6 */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-green-400 font-bold">6</span>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-3">Update Your Availability</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-white mb-1">Profile Settings</h3>
                    <p className="text-sm text-white/60">
                      Keep your profile updated with your current availability and preferences to help others find you.
                    </p>
                  </div>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <h3 className="font-semibold text-white mb-2">What to Include:</h3>
                  <ul className="text-sm text-white/60 space-y-1 ml-4 list-disc">
                    <li>Your typical availability (e.g., "Weekends, afternoons")</li>
                    <li>Preferred playing locations</li>
                    <li>Whether you're open to online games</li>
                    <li>Your playing style and goals (casual, competitive, etc.)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Pro Tips */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-gradient-to-br from-green-500/10 via-blue-500/10 to-transparent border border-green-500/20 rounded-2xl p-6"
        >
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Star className="w-6 h-6 text-green-400" />
            Pro Tips for Finding Great Games
          </h2>
          <ul className="space-y-3 text-white/70">
            <li className="flex items-start gap-2">
              <span className="text-green-400 mt-1">•</span>
              <span><strong className="text-white">Be Proactive:</strong> Don't wait for others to reach out - send friendly messages to players you'd like to meet</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400 mt-1">•</span>
              <span><strong className="text-white">Join Multiple Clubs:</strong> The more clubs you're part of, the more game opportunities you'll have</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400 mt-1">•</span>
              <span><strong className="text-white">Be Flexible:</strong> Try different venues, times, and opponents to expand your chess network</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400 mt-1">•</span>
              <span><strong className="text-white">Complete Your Profile:</strong> Players with complete profiles and photos get 5x more game invitations</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400 mt-1">•</span>
              <span><strong className="text-white">Be Respectful:</strong> Good sportsmanship leads to repeat games and recommendations</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400 mt-1">•</span>
              <span><strong className="text-white">Follow Up:</strong> After a good game, add the player to favorites and suggest playing again</span>
            </li>
          </ul>
        </motion.section>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="text-center pt-8"
        >
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate('/players')}
              className="px-8 py-4 bg-green-500 hover:bg-green-400 text-white font-bold rounded-xl transition-colors inline-flex items-center gap-2"
            >
              <Users className="w-5 h-5" />
              Find Players Now
            </button>
            <button
              onClick={() => navigate('/clubs')}
              className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-colors inline-flex items-center gap-2"
            >
              Browse Clubs
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default FindGamesGuide;
