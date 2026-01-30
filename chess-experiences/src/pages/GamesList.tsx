import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gamesApi } from '../api/games';
import type { GameWithDetails } from '../types/game';
import { useStore } from '../store';
import { gameLocations } from '../data';

const GamesList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useStore();
  const isAuthenticated = !!user;
  const [games, setGames] = useState<GameWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState({
    venue: '',
    player_level: '',
    date_from: ''
  });

  const fetchGames = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await gamesApi.getGames({
        status: 'open',
        ...filter
      });
      setGames(response.data);
    } catch (err: any) {
      setError('Failed to load games');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
  }, [filter]);

  const handleJoinGame = async (gameId: number) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      await gamesApi.joinGame(gameId);
      fetchGames();
      alert('Successfully joined the game!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to join game');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Find a Game</h1>
          <p className="text-gray-600">Discover chess games happening at venues near you. Visit a venue page to create your own game.</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Venue
              </label>
              <input
                type="text"
                value={filter.venue}
                onChange={(e) => setFilter({ ...filter, venue: e.target.value })}
                placeholder="Search by venue..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Player Level
              </label>
              <select
                value={filter.player_level}
                onChange={(e) => setFilter({ ...filter, player_level: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Any Level</option>
                <option value="Beginner (0-1000)">Beginner</option>
                <option value="Intermediate (1000-1500)">Intermediate</option>
                <option value="Advanced (1500-2000)">Advanced</option>
                <option value="Expert (2000+)">Expert</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Date
              </label>
              <input
                type="date"
                value={filter.date_from}
                onChange={(e) => setFilter({ ...filter, date_from: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading games...</p>
          </div>
        ) : games.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <p className="text-xl text-gray-600">No games found</p>
            <p className="text-gray-500 mt-2">Try adjusting your filters or create a new game!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {games.map((game) => (
              <div
                key={game.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  {/* Venue Name */}
                  <h3
                    className="text-xl font-bold mb-2 text-blue-600 hover:text-blue-800 cursor-pointer"
                    onClick={() => {
                      const venue = gameLocations.find(v => v.name === game.venue_name);
                      if (venue) navigate(`/location/${venue.id}`);
                    }}
                  >
                    {game.venue_name}
                  </h3>

                  {/* Date and Time */}
                  <div className="flex items-center text-gray-600 mb-4">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>
                      {formatDate(game.game_date)} at {formatTime(game.game_time)}
                    </span>
                  </div>

                  {/* Creator */}
                  <div className="flex items-center mb-4">
                    <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-gray-700">
                      {game.creator_name} ({game.creator_rating})
                    </span>
                  </div>

                  {/* Time Control */}
                  {game.time_control && (
                    <div className="mb-2">
                      <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                        {game.time_control}
                      </span>
                    </div>
                  )}

                  {/* Player Level */}
                  {game.player_level && (
                    <div className="mb-3">
                      <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                        {game.player_level}
                      </span>
                    </div>
                  )}

                  {/* Description */}
                  {game.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {game.description}
                    </p>
                  )}

                  {/* Players Count */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-600">
                      {game.participant_count} / {game.max_players} players
                    </span>
                    <div className="w-full max-w-[120px] bg-gray-200 rounded-full h-2 ml-3">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${(game.participant_count / game.max_players) * 100}%`
                        }}
                      />
                    </div>
                  </div>

                  {/* Join Button */}
                  <button
                    onClick={() => handleJoinGame(game.id)}
                    disabled={game.participant_count >= game.max_players}
                    className={`w-full py-2 rounded-lg font-semibold transition-colors ${
                      game.participant_count >= game.max_players
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {game.participant_count >= game.max_players ? 'Game Full' : 'Join Game'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GamesList;
