import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Eye, Loader2 } from 'lucide-react';
import { blogsApi } from '../api/blogs';
import { useStore } from '../store';
import ImageUpload from '../components/ImageUpload';

const CreateBlog = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const { user, openAuthModal } = useStore();
  const [loading, setLoading] = useState(false);
  const [fetchingBlog, setFetchingBlog] = useState(isEditMode);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    content: '',
    cover_image: '',
    tags: '',
    meta_description: '',
    chess_category: '',
    difficulty_level: '',
    status: 'draft' as 'draft' | 'published',
    is_paid: false,
    preview_percent: 30,
  });

  const [chessGames, setChessGames] = useState<Array<{ pgn: string; title?: string; description?: string }>>([]);
  const [chessPuzzles, setChessPuzzles] = useState<Array<{ fen: string; solution_moves: string[]; hint?: string; difficulty?: string }>>([]);
  const [currentGamePGN, setCurrentGamePGN] = useState('');
  const [currentGameTitle, setCurrentGameTitle] = useState('');
  const [currentPuzzleFEN, setCurrentPuzzleFEN] = useState('');
  const [currentPuzzleSolution, setCurrentPuzzleSolution] = useState('');
  const [currentPuzzleHint, setCurrentPuzzleHint] = useState('');

  if (!user) {
    openAuthModal('signup');
    navigate('/blogs');
    return null;
  }

  // Fetch blog data when in edit mode
  useEffect(() => {
    if (isEditMode && id) {
      fetchBlogData();
    }
  }, [id, isEditMode]);

  const fetchBlogData = async () => {
    try {
      setFetchingBlog(true);
      const response = await blogsApi.getBlogById(parseInt(id!));
      const blog = response.data;

      setFormData({
        title: blog.title || '',
        subtitle: blog.subtitle || '',
        content: blog.content || '',
        cover_image: blog.cover_image || '',
        tags: blog.tags?.join(', ') || '',
        meta_description: blog.meta_description || '',
        chess_category: blog.chess_category || '',
        difficulty_level: blog.difficulty_level || '',
        status: blog.status as 'draft' | 'published',
        is_paid: blog.is_paid || false,
        preview_percent: blog.preview_percent || 30,
      });

      if (blog.chess_games) {
        setChessGames(blog.chess_games);
      }
      if (blog.chess_puzzles) {
        setChessPuzzles(blog.chess_puzzles);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load blog');
    } finally {
      setFetchingBlog(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent, status: 'draft' | 'published') => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const tagsArray = formData.tags
        ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [];

      const blogData = {
        ...formData,
        tags: tagsArray,
        status,
        chess_category: formData.chess_category || undefined,
        difficulty_level: formData.difficulty_level || undefined,
        chess_games: chessGames.length > 0 ? chessGames : undefined,
        chess_puzzles: chessPuzzles.length > 0 ? chessPuzzles : undefined,
      };

      const response = isEditMode
        ? await blogsApi.updateBlog(parseInt(id!), blogData)
        : await blogsApi.createBlog(blogData);

      const blog = response.data;

      // Check if blog is pending approval (first-time author)
      if (blog.status === 'pending') {
        alert('Your blog has been submitted for review! As a first-time author, your blog will be reviewed by our team before publication. You\'ll be notified once it\'s approved, and then you can post freely.');
        navigate('/blogs');
      } else {
        navigate(`/blogs/${blog.slug || blog.id}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || `Failed to ${isEditMode ? 'update' : 'create'} blog`);
      setLoading(false);
    }
  };

  const addChessGame = () => {
    if (!currentGamePGN.trim()) {
      setError('Please enter PGN for the chess game');
      return;
    }
    setChessGames([...chessGames, {
      pgn: currentGamePGN,
      title: currentGameTitle || undefined,
    }]);
    setCurrentGamePGN('');
    setCurrentGameTitle('');
    setError(null);
  };

  const addChessPuzzle = () => {
    if (!currentPuzzleFEN.trim()) {
      setError('Please enter FEN for the puzzle');
      return;
    }
    if (!currentPuzzleSolution.trim()) {
      setError('Please enter solution moves for the puzzle');
      return;
    }
    const solutionMoves = currentPuzzleSolution.split(',').map(m => m.trim()).filter(Boolean);
    setChessPuzzles([...chessPuzzles, {
      fen: currentPuzzleFEN,
      solution_moves: solutionMoves,
      hint: currentPuzzleHint || undefined,
    }]);
    setCurrentPuzzleFEN('');
    setCurrentPuzzleSolution('');
    setCurrentPuzzleHint('');
    setError(null);
  };

  return (
    <div className="min-h-screen py-8 px-4 md:px-8 max-w-4xl mx-auto">
      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => navigate('/blogs')}
        className="flex items-center gap-2 text-white/60 hover:text-white mb-8 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Articles
      </motion.button>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-display font-bold text-white mb-2">
          {isEditMode ? 'Edit Article' : 'Write New Article'}
        </h1>
        <p className="text-white/70">
          {isEditMode ? 'Update your article' : 'Share your chess knowledge and experiences'}
        </p>
      </motion.div>

      {/* Loading State */}
      {fetchingBlog && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
          {error}
        </div>
      )}

      {/* Form */}
      {!fetchingBlog && (
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-6"
      >
        {/* Cover Image */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">
            Cover Image
          </label>
          <ImageUpload
            value={formData.cover_image}
            onChange={(url: string) => setFormData({ ...formData, cover_image: url })}
            label="Upload Cover Image"
            helperText="Recommended size: 1200x630px"
          />
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">
            Title *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Enter an engaging title..."
            required
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-gold-500 focus:outline-none"
          />
        </div>

        {/* Subtitle */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">
            Subtitle
          </label>
          <input
            type="text"
            value={formData.subtitle}
            onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
            placeholder="A brief summary or hook..."
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-gold-500 focus:outline-none"
          />
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">
            Content *
          </label>
          <textarea
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            placeholder="Write your article content here... (Markdown supported)"
            required
            rows={20}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-gold-500 focus:outline-none resize-none font-mono text-sm"
          />
          <p className="text-xs text-white/40 mt-2">
            Supports Markdown: **bold**, *italic*, [links](url), # Headings, etc.
          </p>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">
            Tags
          </label>
          <input
            type="text"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            placeholder="strategy, opening, endgame (comma-separated)"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-gold-500 focus:outline-none"
          />
        </div>

        {/* Chess Category */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Chess Category
            </label>
            <select
              value={formData.chess_category}
              onChange={(e) => setFormData({ ...formData, chess_category: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-gold-500 focus:outline-none"
            >
              <option value="">None</option>
              <option value="opening-theory">Opening Theory</option>
              <option value="middlegame">Middlegame</option>
              <option value="endgame">Endgame</option>
              <option value="tactics">Tactics</option>
              <option value="strategy">Strategy</option>
              <option value="game-analysis">Game Analysis</option>
              <option value="tournament-report">Tournament Report</option>
              <option value="training">Training</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Difficulty Level
            </label>
            <select
              value={formData.difficulty_level}
              onChange={(e) => setFormData({ ...formData, difficulty_level: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-gold-500 focus:outline-none"
            >
              <option value="">None</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="expert">Expert</option>
            </select>
          </div>
        </div>

        {/* Paid Content Settings */}
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <span className="text-gold-400">💰</span> Paid Content Settings
          </h3>
          <p className="text-white/60 text-sm mb-4">
            Make this blog available only to your subscribers. Readers will see a preview and be prompted to subscribe.
          </p>

          <div className="space-y-4">
            {/* Is Paid Toggle */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_paid"
                checked={formData.is_paid}
                onChange={(e) => setFormData({ ...formData, is_paid: e.target.checked })}
                className="w-5 h-5 rounded border-white/20 bg-white/5 text-gold-500 focus:ring-gold-500 focus:ring-offset-0"
              />
              <label htmlFor="is_paid" className="text-white font-medium cursor-pointer">
                Require subscription to read this blog
              </label>
            </div>

            {/* Preview Percentage (only shown if paid) */}
            {formData.is_paid && (
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Preview Amount: {formData.preview_percent}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="10"
                  value={formData.preview_percent}
                  onChange={(e) => setFormData({ ...formData, preview_percent: parseInt(e.target.value) })}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-white/40 mt-1">
                  <span>No preview</span>
                  <span>25%</span>
                  <span>50%</span>
                  <span>75%</span>
                  <span>Full content</span>
                </div>
                <p className="text-xs text-white/50 mt-2">
                  {formData.preview_percent === 0 && 'No preview - readers will only see the title'}
                  {formData.preview_percent > 0 && formData.preview_percent < 30 && 'Very limited preview - just a taste'}
                  {formData.preview_percent >= 30 && formData.preview_percent < 60 && 'Moderate preview - enough to get interested'}
                  {formData.preview_percent >= 60 && formData.preview_percent < 100 && 'Generous preview - most of the content'}
                  {formData.preview_percent === 100 && 'Full content visible - no paywall (not recommended for paid blogs)'}
                </p>
              </div>
            )}

            {formData.is_paid && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <p className="text-blue-400 text-sm">
                  <strong>Note:</strong> You need to set up your author pricing before publishing paid content.
                  Visit your Author Dashboard to configure subscription pricing.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Add Chess Game */}
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <span className="text-gold-400">♔</span> Add Chess Game (PGN)
          </h3>
          <div className="space-y-3">
            <input
              type="text"
              value={currentGameTitle}
              onChange={(e) => setCurrentGameTitle(e.target.value)}
              placeholder="Game title (optional)"
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-gold-500 focus:outline-none"
            />
            <textarea
              value={currentGamePGN}
              onChange={(e) => setCurrentGamePGN(e.target.value)}
              placeholder="Paste PGN here..."
              rows={4}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-gold-500 focus:outline-none resize-none font-mono text-sm"
            />
            <button
              type="button"
              onClick={addChessGame}
              className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
            >
              Add Game
            </button>
            {chessGames.length > 0 && (
              <div className="mt-3 text-sm text-white/60">
                {chessGames.length} game(s) added. Reference in content with: {`{{chess-game:1}}`}, {`{{chess-game:2}}`}, etc.
              </div>
            )}
          </div>
        </div>

        {/* Add Chess Puzzle */}
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <span className="text-gold-400">♟</span> Add Chess Puzzle
          </h3>
          <div className="space-y-3">
            <input
              type="text"
              value={currentPuzzleFEN}
              onChange={(e) => setCurrentPuzzleFEN(e.target.value)}
              placeholder="FEN position"
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-gold-500 focus:outline-none font-mono text-sm"
            />
            <input
              type="text"
              value={currentPuzzleSolution}
              onChange={(e) => setCurrentPuzzleSolution(e.target.value)}
              placeholder="Solution moves (comma-separated, e.g. Nf3, Nc6, d4)"
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-gold-500 focus:outline-none"
            />
            <input
              type="text"
              value={currentPuzzleHint}
              onChange={(e) => setCurrentPuzzleHint(e.target.value)}
              placeholder="Hint (optional)"
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-gold-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={addChessPuzzle}
              className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition-colors"
            >
              Add Puzzle
            </button>
            {chessPuzzles.length > 0 && (
              <div className="mt-3 text-sm text-white/60">
                {chessPuzzles.length} puzzle(s) added. Reference in content with: {`{{chess-puzzle:1}}`}, {`{{chess-puzzle:2}}`}, etc.
              </div>
            )}
          </div>
        </div>

        {/* Meta Description */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">
            Meta Description (SEO)
          </label>
          <textarea
            value={formData.meta_description}
            onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
            placeholder="Brief description for search engines (150-160 characters)"
            rows={2}
            maxLength={160}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-gold-500 focus:outline-none resize-none"
          />
          <p className="text-xs text-white/40 mt-1">
            {formData.meta_description.length}/160 characters
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={(e) => handleSubmit(e, 'draft')}
            disabled={loading || !formData.title || !formData.content}
            className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            Save as Draft
          </button>
          <button
            type="button"
            onClick={(e) => handleSubmit(e, 'published')}
            disabled={loading || !formData.title || !formData.content}
            className="flex-1 px-6 py-3 bg-gold-500 hover:bg-gold-400 text-chess-darker font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-chess-darker/20 border-t-chess-darker rounded-full animate-spin" />
                {isEditMode ? 'Updating...' : 'Publishing...'}
              </>
            ) : (
              <>
                <Eye className="w-5 h-5" />
                {isEditMode ? 'Update' : 'Publish Now'}
              </>
            )}
          </button>
        </div>
      </motion.form>
      )}
    </div>
  );
};

export default CreateBlog;
