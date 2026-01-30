import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Calendar, Users, DollarSign, Clock, CheckCircle, AlertCircle } from 'lucide-react';

const CreateTournamentGuide = () => {
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
          <div className="w-12 h-12 bg-gradient-to-br from-gold-500 to-yellow-600 rounded-xl flex items-center justify-center">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white">
            How to Create a Tournament
          </h1>
        </div>
        <p className="text-lg text-white/70">
          Follow this step-by-step guide to successfully organize and host your chess tournament on ChessFam
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
            <div className="w-10 h-10 bg-gold-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-gold-400 font-bold">1</span>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-3">Choose Tournament Type</h2>
              <p className="text-white/70 mb-4">
                Start by selecting what kind of tournament you want to organize:
              </p>
              <div className="space-y-3">
                <div className="bg-white/5 rounded-lg p-4">
                  <h3 className="font-semibold text-white mb-2">One-Off Tournament</h3>
                  <p className="text-sm text-white/60">
                    A single standalone tournament. Perfect for special events or one-time competitions.
                  </p>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <h3 className="font-semibold text-white mb-2">Recurring Tournament</h3>
                  <p className="text-sm text-white/60">
                    Tournament that repeats on a schedule (weekly, biweekly, monthly). Great for regular club events.
                  </p>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <h3 className="font-semibold text-white mb-2">Festival</h3>
                  <p className="text-sm text-white/60">
                    Collection of tournaments with different formats and sections. Ideal for large multi-day events.
                  </p>
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
            <div className="w-10 h-10 bg-gold-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-gold-400 font-bold">2</span>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-3">Fill in Basic Information</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-white mb-1">Tournament Name & Description</h3>
                    <p className="text-sm text-white/60">
                      Choose a clear, descriptive name and write a compelling description that explains what makes your tournament special.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-purple-400 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-white mb-1">Dates & Times</h3>
                    <p className="text-sm text-white/60">
                      Set start date, end date (for multi-day events), and registration deadline. Consider giving players enough time to register.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-white mb-1">Participant Limits</h3>
                    <p className="text-sm text-white/60">
                      Set maximum participants and optionally rating restrictions (min/max rating).
                    </p>
                  </div>
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
            <div className="w-10 h-10 bg-gold-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-gold-400 font-bold">3</span>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-3">Configure Tournament Format</h2>
              <div className="space-y-3">
                <div className="bg-white/5 rounded-lg p-4">
                  <h3 className="font-semibold text-white mb-2">Tournament Type</h3>
                  <p className="text-sm text-white/60 mb-3">
                    Choose the pairing system:
                  </p>
                  <ul className="text-sm text-white/60 space-y-1 ml-4 list-disc">
                    <li><strong className="text-white">Swiss System:</strong> Most common, players paired with similar scores</li>
                    <li><strong className="text-white">Round Robin:</strong> Everyone plays everyone</li>
                    <li><strong className="text-white">Knockout:</strong> Single elimination bracket</li>
                    <li><strong className="text-white">Arena:</strong> Continuous pairing over a time period</li>
                  </ul>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <h3 className="font-semibold text-white mb-2">Time Control</h3>
                  <p className="text-sm text-white/60">
                    Set game time controls. Examples: "90+30" (90 minutes + 30 second increment), "40/90, SD/30+30" (40 moves in 90 min, then sudden death 30 min + 30 sec).
                  </p>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <h3 className="font-semibold text-white mb-2">Format</h3>
                  <p className="text-sm text-white/60">
                    Choose between Over the Board (in-person), Online, or Hybrid (both).
                  </p>
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
            <div className="w-10 h-10 bg-gold-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-gold-400 font-bold">4</span>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-3">Set Pricing & Discounts</h2>
              <div className="space-y-3">
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5 text-green-400" />
                    <h3 className="font-semibold text-white">Entry Fee & Prize Pool</h3>
                  </div>
                  <p className="text-sm text-white/60">
                    Set your entry fee and optional prize pool. Free tournaments are also supported!
                  </p>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <h3 className="font-semibold text-white mb-2">Early Bird Pricing (Optional)</h3>
                  <p className="text-sm text-white/60 mb-2">
                    Offer up to 3 tiers of discounts for early registrations:
                  </p>
                  <ul className="text-sm text-white/60 space-y-1 ml-4 list-disc">
                    <li>Super Early Bird (e.g., 30% off if register 1 month ahead)</li>
                    <li>Early Bird (e.g., 20% off if register 2 weeks ahead)</li>
                    <li>Regular Early Bird (e.g., 10% off if register 1 week ahead)</li>
                  </ul>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <h3 className="font-semibold text-white mb-2">Special Group Discounts (Optional)</h3>
                  <p className="text-sm text-white/60 mb-2">
                    Offer percentage discounts for:
                  </p>
                  <ul className="text-sm text-white/60 space-y-1 ml-4 list-disc">
                    <li><strong className="text-white">Junior Players:</strong> Set discount % and max age (default: 18)</li>
                    <li><strong className="text-white">Senior Players:</strong> Set discount % and min age (default: 65)</li>
                    <li><strong className="text-white">Women Players:</strong> Set discount % (applies to all ages)</li>
                  </ul>
                  <p className="text-sm text-gold-400 mt-2">
                    💡 All discounts stack with early bird pricing!
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
            <div className="w-10 h-10 bg-gold-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-gold-400 font-bold">5</span>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-3">Add Location & Images</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-white mb-1">Select Venue</h3>
                    <p className="text-sm text-white/60">
                      Choose from existing venues or add address manually. Make sure to include city and country for better discoverability.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-white mb-1">Upload Images</h3>
                    <p className="text-sm text-white/60">
                      Add a cover image and optional gallery images. High-quality photos attract more participants!
                    </p>
                  </div>
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
            <div className="w-10 h-10 bg-gold-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-gold-400 font-bold">6</span>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-3">Submit & Manage</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-400 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-white mb-1">Review & Submit</h3>
                    <p className="text-sm text-white/60">
                      Your tournament will be submitted for approval. Most tournaments are approved within 24 hours.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-white mb-1">Monitor Registrations</h3>
                    <p className="text-sm text-white/60">
                      Once approved, view registrations in "My Tournaments" and manage participants through the tournament page.
                    </p>
                  </div>
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
          className="bg-gradient-to-br from-gold-500/10 via-yellow-600/10 to-transparent border border-gold-500/20 rounded-2xl p-6"
        >
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-gold-400" />
            Pro Tips for Success
          </h2>
          <ul className="space-y-3 text-white/70">
            <li className="flex items-start gap-2">
              <span className="text-gold-400 mt-1">•</span>
              <span><strong className="text-white">Market Early:</strong> Post your tournament at least 2-4 weeks in advance to maximize registrations</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-gold-400 mt-1">•</span>
              <span><strong className="text-white">Clear Communication:</strong> Include all important details in the description (parking, food, prizes, etc.)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-gold-400 mt-1">•</span>
              <span><strong className="text-white">Use Early Bird Pricing:</strong> Encourage early registrations with tiered discounts</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-gold-400 mt-1">•</span>
              <span><strong className="text-white">High-Quality Photos:</strong> Tournaments with professional photos get 3x more registrations</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-gold-400 mt-1">•</span>
              <span><strong className="text-white">Respond Quickly:</strong> Answer questions from potential participants promptly</span>
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
          <button
            onClick={() => navigate('/tournaments/create')}
            className="px-8 py-4 bg-gold-500 hover:bg-gold-400 text-chess-darker font-bold rounded-xl transition-colors inline-flex items-center gap-2"
          >
            <Trophy className="w-5 h-5" />
            Create Your Tournament Now
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default CreateTournamentGuide;
