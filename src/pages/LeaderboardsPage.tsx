import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp, Star, Zap, Award, Medal } from 'lucide-react';
import Leaderboard from '../components/Leaderboard';

type LeaderboardType = 'xp' | 'level' | 'games_played' | 'streak' | 'reviews' | 'rating';

const LeaderboardsPage = () => {
  const [selectedType, setSelectedType] = useState<LeaderboardType>('xp');

  const leaderboardTypes = [
    { id: 'xp' as LeaderboardType, label: 'XP', icon: Zap, color: 'text-yellow-400' },
    { id: 'level' as LeaderboardType, label: 'Level', icon: TrendingUp, color: 'text-blue-400' },
    { id: 'games_played' as LeaderboardType, label: 'Games', icon: Trophy, color: 'text-green-400' },
    { id: 'streak' as LeaderboardType, label: 'Streak', icon: Star, color: 'text-orange-400' },
    { id: 'reviews' as LeaderboardType, label: 'Reviews', icon: Award, color: 'text-purple-400' },
    { id: 'rating' as LeaderboardType, label: 'Rating', icon: Medal, color: 'text-red-400' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <Trophy className="w-10 h-10 text-yellow-400" />
            <div>
              <h1 className="text-4xl font-bold text-white">Leaderboards</h1>
              <p className="text-white/60">Compete with the ChessFam community</p>
            </div>
          </div>
        </motion.div>

        {/* Type Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="bg-white/5 rounded-2xl p-2 border border-white/10">
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {leaderboardTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = selectedType === type.id;

                return (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${
                      isSelected
                        ? 'bg-white/10 border-2 border-white/20'
                        : 'bg-white/5 border-2 border-transparent hover:bg-white/10'
                    }`}
                  >
                    <Icon className={`w-6 h-6 ${isSelected ? type.color : 'text-white/50'}`} />
                    <span
                      className={`text-sm font-medium ${
                        isSelected ? 'text-white' : 'text-white/50'
                      }`}
                    >
                      {type.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Info Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <div className="bg-gradient-to-br from-yellow-500/20 to-amber-600/20 rounded-2xl p-6 border border-yellow-500/30">
            <Trophy className="w-8 h-8 text-yellow-400 mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">Top Players</h3>
            <p className="text-white/70 text-sm">
              Compete for the top spot on various leaderboards. Rankings update in real-time!
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-2xl p-6 border border-blue-500/30">
            <TrendingUp className="w-8 h-8 text-blue-400 mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">Earn XP</h3>
            <p className="text-white/70 text-sm">
              Play games, write reviews, upload PGN files, and check in daily to climb the ranks.
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 rounded-2xl p-6 border border-green-500/30">
            <Star className="w-8 h-8 text-green-400 mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">Weekly Reset</h3>
            <p className="text-white/70 text-sm">
              Some leaderboards reset weekly, giving everyone a chance to reach the top!
            </p>
          </div>
        </motion.div>

        {/* Leaderboard */}
        <motion.div
          key={selectedType}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Leaderboard type={selectedType} limit={100} showUserRank={true} />
        </motion.div>

        {/* How to Rank Up */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 bg-white/5 rounded-2xl p-6 border border-white/10"
        >
          <h3 className="text-xl font-semibold text-white mb-4">How to Rank Up</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-400 font-bold">50</span>
                </div>
                <div>
                  <p className="text-white font-medium">Complete Games</p>
                  <p className="text-white/60 text-sm">Finish a game to earn 50 XP</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-green-400 font-bold">25</span>
                </div>
                <div>
                  <p className="text-white font-medium">Upload PGN</p>
                  <p className="text-white/60 text-sm">Share your game notation for 25 XP</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-400 font-bold">15</span>
                </div>
                <div>
                  <p className="text-white font-medium">Write Reviews</p>
                  <p className="text-white/60 text-sm">Review your opponents for 15 XP</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-yellow-400 font-bold">10</span>
                </div>
                <div>
                  <p className="text-white font-medium">Daily Check-in</p>
                  <p className="text-white/60 text-sm">Build a streak for consistent rewards</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-orange-400 font-bold">∞</span>
                </div>
                <div>
                  <p className="text-white font-medium">Earn Badges</p>
                  <p className="text-white/60 text-sm">Get recognized for good sportsmanship</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-red-400 font-bold">∞</span>
                </div>
                <div>
                  <p className="text-white font-medium">Improve Rating</p>
                  <p className="text-white/60 text-sm">Win games to climb the rating ladder</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LeaderboardsPage;
