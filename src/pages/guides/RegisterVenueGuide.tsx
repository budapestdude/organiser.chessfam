import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Camera, Users, Star, CheckCircle, AlertCircle, DollarSign } from 'lucide-react';

const RegisterVenueGuide = () => {
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
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
            <MapPin className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white">
            How to Register Your Venue
          </h1>
        </div>
        <p className="text-lg text-white/70">
          List your space on ChessFam to attract chess players and host events
        </p>
      </motion.div>

      {/* Guide Content */}
      <div className="space-y-8">
        {/* Introduction */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-transparent border border-purple-500/20 rounded-2xl p-6"
        >
          <h2 className="text-2xl font-bold text-white mb-3">Why Register Your Venue?</h2>
          <ul className="space-y-2 text-white/70">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
              <span>Attract chess players to your cafe, library, community center, or chess club</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
              <span>Host tournaments and events with built-in promotion</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
              <span>Build a community of regular chess players</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
              <span>Free listing with high visibility on ChessFam</span>
            </li>
          </ul>
        </motion.section>

        {/* Step 1 */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-purple-400 font-bold">1</span>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-3">Provide Venue Details</h2>
              <div className="space-y-3">
                <div className="bg-white/5 rounded-lg p-4">
                  <h3 className="font-semibold text-white mb-2">Basic Information</h3>
                  <ul className="text-sm text-white/60 space-y-1 ml-4 list-disc">
                    <li><strong className="text-white">Venue Name:</strong> Official name of your location</li>
                    <li><strong className="text-white">Description:</strong> What makes your venue special for chess players?</li>
                    <li><strong className="text-white">Venue Type:</strong> Cafe, library, chess club, community center, park, etc.</li>
                    <li><strong className="text-white">Complete Address:</strong> Street, city, state/province, country, postal code</li>
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
          transition={{ delay: 0.3 }}
          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-purple-400 font-bold">2</span>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-3">Add Amenities & Features</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-white mb-1">Available Resources</h3>
                    <p className="text-sm text-white/60 mb-2">
                      Let players know what's available at your venue:
                    </p>
                    <ul className="text-sm text-white/60 space-y-1 ml-4 list-disc">
                      <li>Chess boards and pieces</li>
                      <li>Chess clocks</li>
                      <li>WiFi and power outlets</li>
                      <li>Food and beverages</li>
                      <li>Parking availability</li>
                      <li>Wheelchair accessibility</li>
                      <li>Tournament-ready space</li>
                    </ul>
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
          transition={{ delay: 0.4 }}
          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-purple-400 font-bold">3</span>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-3">Upload High-Quality Photos</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Camera className="w-5 h-5 text-yellow-400 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-white mb-1">Photo Requirements</h3>
                    <p className="text-sm text-white/60 mb-2">
                      Photos are crucial for attracting players. Include:
                    </p>
                    <ul className="text-sm text-white/60 space-y-1 ml-4 list-disc">
                      <li>Exterior shot showing entrance and signage</li>
                      <li>Interior photos of the playing space</li>
                      <li>Close-ups of chess equipment</li>
                      <li>Photos of previous events or players (if available)</li>
                      <li>Any unique features or atmosphere shots</li>
                    </ul>
                  </div>
                </div>
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                  <p className="text-sm text-yellow-400 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Venues with professional photos get 10x more check-ins and event bookings!</span>
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
          transition={{ delay: 0.5 }}
          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-purple-400 font-bold">4</span>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-3">Set Hours & Contact Information</h2>
              <div className="space-y-3">
                <div className="bg-white/5 rounded-lg p-4">
                  <h3 className="font-semibold text-white mb-2">Operating Hours</h3>
                  <p className="text-sm text-white/60">
                    Specify your general hours of operation and any special chess-specific hours (e.g., "Chess club meets Thursdays 6-9 PM").
                  </p>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <h3 className="font-semibold text-white mb-2">Contact Details</h3>
                  <ul className="text-sm text-white/60 space-y-1 ml-4 list-disc">
                    <li>Phone number</li>
                    <li>Email address</li>
                    <li>Website URL (if applicable)</li>
                    <li>Social media links</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Step 5 */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-purple-400 font-bold">5</span>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-3">Pricing & Policies (Optional)</h2>
              <div className="space-y-3">
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5 text-green-400" />
                    <h3 className="font-semibold text-white">Entry or Usage Fees</h3>
                  </div>
                  <p className="text-sm text-white/60">
                    If you charge for table usage, chess equipment rental, or entry fees, specify them clearly. Many venues are free to use with purchase of food/drinks.
                  </p>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <h3 className="font-semibold text-white mb-2">House Rules</h3>
                  <p className="text-sm text-white/60 mb-2">
                    Clarify any policies players should know:
                  </p>
                  <ul className="text-sm text-white/60 space-y-1 ml-4 list-disc">
                    <li>Minimum purchase requirements</li>
                    <li>Reservation policies for groups</li>
                    <li>Tournament hosting availability</li>
                    <li>Age restrictions (if any)</li>
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
          transition={{ delay: 0.7 }}
          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-purple-400 font-bold">6</span>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-3">Submit & Get Approved</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-400 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-white mb-1">Review Process</h3>
                    <p className="text-sm text-white/60">
                      Your venue submission will be reviewed within 24-48 hours. We verify the information and ensure quality standards.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-white mb-1">Once Approved</h3>
                    <p className="text-sm text-white/60">
                      Your venue will appear in searches, on the map, and be available for clubs and tournaments to use. You'll be able to manage your listing and respond to reviews.
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
          transition={{ delay: 0.8 }}
          className="bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-transparent border border-purple-500/20 rounded-2xl p-6"
        >
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Star className="w-6 h-6 text-purple-400" />
            Pro Tips for Venue Success
          </h2>
          <ul className="space-y-3 text-white/70">
            <li className="flex items-start gap-2">
              <span className="text-purple-400 mt-1">•</span>
              <span><strong className="text-white">Keep Information Updated:</strong> Regularly update hours, amenities, and photos to stay relevant</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400 mt-1">•</span>
              <span><strong className="text-white">Respond to Reviews:</strong> Engage with player feedback to build trust and improve your venue</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400 mt-1">•</span>
              <span><strong className="text-white">Host Regular Events:</strong> Weekly meetups or monthly tournaments keep players coming back</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400 mt-1">•</span>
              <span><strong className="text-white">Promote Your Listing:</strong> Share your ChessFam venue page on social media and in your physical space</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400 mt-1">•</span>
              <span><strong className="text-white">Create a Welcoming Atmosphere:</strong> Friendly staff and comfortable seating encourage repeat visits</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400 mt-1">•</span>
              <span><strong className="text-white">Partner with Local Clubs:</strong> Reach out to clubs looking for meeting spaces</span>
            </li>
          </ul>
        </motion.section>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="text-center pt-8"
        >
          <button
            onClick={() => navigate('/register-venue')}
            className="px-8 py-4 bg-purple-500 hover:bg-purple-400 text-white font-bold rounded-xl transition-colors inline-flex items-center gap-2"
          >
            <MapPin className="w-5 h-5" />
            Register Your Venue Now
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default RegisterVenueGuide;
