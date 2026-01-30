import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Users, Calendar, MessageSquare, CheckCircle, Star } from 'lucide-react';

const CreateClubGuide = () => {
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
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white">
            How to Create a Chess Club
          </h1>
        </div>
        <p className="text-lg text-white/70">
          Build a thriving chess community by starting your own club on ChessFam
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
            <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-blue-400 font-bold">1</span>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-3">Define Your Club Identity</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Building2 className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-white mb-1">Club Name & Description</h3>
                    <p className="text-sm text-white/60">
                      Choose a memorable name and write a compelling description. Explain your club's mission, who it's for, and what makes it unique.
                    </p>
                  </div>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <h3 className="font-semibold text-white mb-2">Examples of Good Club Descriptions:</h3>
                  <ul className="text-sm text-white/60 space-y-2 ml-4 list-disc">
                    <li>"Family-friendly club meeting every Saturday for casual games and coaching"</li>
                    <li>"Competitive club for rated players seeking tournament preparation"</li>
                    <li>"Beginner-focused club with free lessons and friendly atmosphere"</li>
                    <li>"University chess club for students and faculty"</li>
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
            <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-blue-400 font-bold">2</span>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-3">Set Meeting Location & Schedule</h2>
              <div className="space-y-3">
                <div className="bg-white/5 rounded-lg p-4">
                  <h3 className="font-semibold text-white mb-2">Choose Venue(s)</h3>
                  <p className="text-sm text-white/60 mb-2">
                    Clubs can meet at multiple locations:
                  </p>
                  <ul className="text-sm text-white/60 space-y-1 ml-4 list-disc">
                    <li>Select from existing venues on ChessFam</li>
                    <li>Add multiple venues if you meet at different locations</li>
                    <li>Include online meeting options if hybrid</li>
                  </ul>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-5 h-5 text-purple-400" />
                    <h3 className="font-semibold text-white">Meeting Schedule</h3>
                  </div>
                  <p className="text-sm text-white/60">
                    Specify when your club meets. Be clear about day, time, and frequency (e.g., "Every Tuesday 6-9 PM" or "First Saturday of each month").
                  </p>
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
            <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-blue-400 font-bold">3</span>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-3">Configure Membership Options</h2>
              <div className="space-y-3">
                <div className="bg-white/5 rounded-lg p-4">
                  <h3 className="font-semibold text-white mb-2">Membership Type</h3>
                  <p className="text-sm text-white/60 mb-3">Choose how people can join:</p>
                  <ul className="text-sm text-white/60 space-y-1 ml-4 list-disc">
                    <li><strong className="text-white">Open Club:</strong> Anyone can join automatically</li>
                    <li><strong className="text-white">Approval Required:</strong> You review and approve each member</li>
                    <li><strong className="text-white">Invite Only:</strong> Members can only join via invitation</li>
                  </ul>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <h3 className="font-semibold text-white mb-2">Membership Fees</h3>
                  <p className="text-sm text-white/60">
                    Set membership fees if needed (monthly, yearly, or one-time). Free clubs are also great for building community!
                  </p>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <h3 className="font-semibold text-white mb-2">Member Limits</h3>
                  <p className="text-sm text-white/60">
                    Optionally set a maximum number of members if your venue has space constraints.
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
            <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-blue-400 font-bold">4</span>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-3">Add Visual Content</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-white mb-1">Cover Image</h3>
                    <p className="text-sm text-white/60">
                      Upload an attractive cover image. This could be your club logo, a photo from a meeting, or an action shot of members playing.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-white mb-1">Photo Gallery</h3>
                    <p className="text-sm text-white/60">
                      Add multiple photos showing your meeting space, members playing, events, and club activities. Photos help potential members envision joining!
                    </p>
                  </div>
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
            <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-blue-400 font-bold">5</span>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-3">Launch & Grow Your Club</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Star className="w-5 h-5 text-yellow-400 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-white mb-1">Submit for Approval</h3>
                    <p className="text-sm text-white/60">
                      Your club will be reviewed and typically approved within 24 hours. You'll receive a notification when it's live.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-white mb-1">Invite Members</h3>
                    <p className="text-sm text-white/60">
                      Share your club page on social media, with local players, and in chess communities. The more active your club, the more it will grow!
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MessageSquare className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-white mb-1">Use Club Features</h3>
                    <p className="text-sm text-white/60">
                      Post announcements, schedule events, share tournament results, and use the club chat to keep members engaged.
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
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-transparent border border-blue-500/20 rounded-2xl p-6"
        >
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-400" />
            Pro Tips for Successful Clubs
          </h2>
          <ul className="space-y-3 text-white/70">
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">•</span>
              <span><strong className="text-white">Consistent Schedule:</strong> Meet regularly on the same day/time so members can plan ahead</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">•</span>
              <span><strong className="text-white">Welcome Beginners:</strong> Clubs that welcome all skill levels tend to grow faster and be more sustainable</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">•</span>
              <span><strong className="text-white">Organize Events:</strong> Regular internal tournaments, simuls, and lectures keep members engaged</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">•</span>
              <span><strong className="text-white">Active Leadership:</strong> Post updates regularly and respond to member questions quickly</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">•</span>
              <span><strong className="text-white">Community Building:</strong> Foster a friendly, inclusive atmosphere where everyone feels welcome</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">•</span>
              <span><strong className="text-white">Promote Locally:</strong> Reach out to local schools, libraries, and community centers to spread the word</span>
            </li>
          </ul>
        </motion.section>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="text-center pt-8"
        >
          <button
            onClick={() => navigate('/clubs/create')}
            className="px-8 py-4 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-xl transition-colors inline-flex items-center gap-2"
          >
            <Building2 className="w-5 h-5" />
            Create Your Club Now
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default CreateClubGuide;
