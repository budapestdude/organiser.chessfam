import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart, MessageSquare, Clock, Eye, Share2 } from 'lucide-react';
import { blogsApi, type Blog } from '../api/blogs';
import { useStore } from '../store';
import ChessGameViewer from '../components/ChessGameViewer';
import ChessPositionViewer from '../components/ChessPositionViewer';
import ChessPuzzle from '../components/ChessPuzzle';
import ChessNotationText from '../components/ChessNotationText';
import BlogPaywall from '../components/BlogPaywall';

const BlogDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useStore();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasLiked, setHasLiked] = useState(false);
  const [accessInfo, setAccessInfo] = useState<any>(null);

  useEffect(() => {
    if (slug) {
      fetchBlog();
    }
  }, [slug]);

  const fetchBlog = async () => {
    try {
      const response = await blogsApi.getBlogBySlug(slug!, true);
      setBlog(response.data);
      setHasLiked(response.data.hasLiked || false);
      setAccessInfo(response.data.accessInfo || null);
    } catch (error) {
      console.error('Error fetching blog:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!user || !blog) return;

    try {
      if (hasLiked) {
        await blogsApi.unlikeBlog(blog.id);
        setBlog({ ...blog, likes_count: blog.likes_count - 1 });
        setHasLiked(false);
      } else {
        await blogsApi.likeBlog(blog.id);
        setBlog({ ...blog, likes_count: blog.likes_count + 1 });
        setHasLiked(true);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderContent = () => {
    if (!blog) return null;

    let content = blog.content;
    let keyIndex = 0;

    // Parse and replace chess game markers
    const gamePattern = /\{\{chess-game:(\d+)\}\}/g;
    const gameMatches = Array.from(content.matchAll(gamePattern));

    for (const match of gameMatches) {
      const gameIdx = parseInt(match[1]) - 1;
      const game = blog.chess_games?.[gameIdx];
      if (game) {
        const placeholder = `__CHESS_GAME_${match[1]}__`;
        content = content.replace(match[0], placeholder);
      }
    }

    // Parse and replace position markers
    const positionPattern = /\{\{chess-position:([^:}]+)(?::interactive)?\}\}/g;
    const positionMatches = Array.from(content.matchAll(positionPattern));

    for (const match of positionMatches) {
      const placeholder = `__CHESS_POS_${keyIndex++}__`;
      content = content.replace(match[0], placeholder);
    }

    // Parse and replace puzzle markers
    const puzzlePattern = /\{\{chess-puzzle:(\d+)\}\}/g;
    const puzzleMatches = Array.from(content.matchAll(puzzlePattern));

    for (const match of puzzleMatches) {
      const puzzleIdx = parseInt(match[1]) - 1;
      const puzzle = blog.chess_puzzles?.[puzzleIdx];
      if (puzzle) {
        const placeholder = `__CHESS_PUZZLE_${match[1]}__`;
        content = content.replace(match[0], placeholder);
      }
    }

    // Split content by placeholders and render
    const segments = content.split(/(__CHESS_(?:GAME|POS|PUZZLE)_\d+__)/);

    return (
      <>
        {segments.map((segment, idx) => {
          // Check for game placeholder
          const gameMatch = segment.match(/__CHESS_GAME_(\d+)__/);
          if (gameMatch) {
            const gameIdx = parseInt(gameMatch[1]) - 1;
            const game = blog.chess_games?.[gameIdx];
            if (game) {
              return (
                <div key={idx} className="my-6">
                  {game.title && <h4 className="text-white font-semibold mb-2">{game.title}</h4>}
                  {game.description && <p className="text-white/70 mb-3">{game.description}</p>}
                  <ChessGameViewer pgn={game.pgn} />
                </div>
              );
            }
          }

          // Check for position placeholder
          const posMatch = segment.match(/__CHESS_POS_\d+__/);
          if (posMatch) {
            // Find the original match to get FEN and interactive flag
            const originalMatch = positionMatches.find((_m) => {
              const placeholder = `__CHESS_POS_${keyIndex}__`;
              return segment === placeholder;
            });
            // For simplicity, render with default FEN if not found
            if (originalMatch) {
              const fen = originalMatch[1];
              const interactive = originalMatch[0].includes(':interactive');
              return <ChessPositionViewer key={idx} fen={fen} interactive={interactive} />;
            }
          }

          // Check for puzzle placeholder
          const puzzleMatch = segment.match(/__CHESS_PUZZLE_(\d+)__/);
          if (puzzleMatch) {
            const puzzleIdx = parseInt(puzzleMatch[1]) - 1;
            const puzzle = blog.chess_puzzles?.[puzzleIdx];
            if (puzzle) {
              return (
                <ChessPuzzle
                  key={idx}
                  fen={puzzle.fen}
                  solutionMoves={puzzle.solution_moves}
                  hint={puzzle.hint}
                />
              );
            }
          }

          // Regular text content - wrap in ChessNotationText
          return segment ? <ChessNotationText key={idx} content={segment} /> : null;
        })}
      </>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500"></div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Article not found</h2>
          <button
            onClick={() => navigate('/blogs')}
            className="text-gold-400 hover:text-gold-300"
          >
            Back to articles
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
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

        {/* Cover Image */}
        {blog.cover_image && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="aspect-[21/9] rounded-2xl overflow-hidden mb-8"
          >
            <img
              src={blog.cover_image}
              alt={blog.title}
              className="w-full h-full object-cover"
            />
          </motion.div>
        )}

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          {/* Tags & Chess Badges */}
          {(blog.tags && blog.tags.length > 0) || blog.chess_category || blog.difficulty_level ? (
            <div className="flex flex-wrap gap-2 mb-4">
              {blog.tags && blog.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-blue-500/20 text-blue-400 text-sm rounded-lg"
                >
                  {tag}
                </span>
              ))}
              {blog.chess_category && (
                <span className="px-3 py-1 bg-gold-500/20 text-gold-400 text-sm rounded-lg font-semibold border border-gold-500/30">
                  {blog.chess_category.replace(/-/g, ' ')}
                </span>
              )}
              {blog.difficulty_level && (
                <span className="px-3 py-1 bg-purple-500/20 text-purple-400 text-sm rounded-lg border border-purple-500/30">
                  {blog.difficulty_level}
                </span>
              )}
            </div>
          ) : null}

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
            {blog.title}
          </h1>

          {/* Subtitle */}
          {blog.subtitle && (
            <p className="text-xl text-white/70 mb-6">{blog.subtitle}</p>
          )}

          {/* Author & Meta */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              {blog.author_avatar && (
                <img
                  src={blog.author_avatar}
                  alt={blog.author_name}
                  className="w-12 h-12 rounded-full"
                />
              )}
              <div>
                <p className="font-semibold text-white">{blog.author_name}</p>
                <p className="text-sm text-white/50">
                  {formatDate(blog.published_at || blog.created_at)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-white/50">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {blog.read_time_minutes} min read
              </div>
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {blog.views_count} views
              </div>
            </div>
          </div>
        </motion.div>

        {/* Engagement Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-4 py-4 mb-8 border-y border-white/10"
        >
          <button
            onClick={handleLike}
            disabled={!user}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              hasLiked
                ? 'bg-red-500/20 text-red-400'
                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Heart className={`w-5 h-5 ${hasLiked ? 'fill-current' : ''}`} />
            {blog.likes_count}
          </button>

          <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg text-white/60">
            <MessageSquare className="w-5 h-5" />
            {blog.comments_count}
          </div>

          <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors ml-auto">
            <Share2 className="w-5 h-5" />
            Share
          </button>
        </motion.div>

        {/* Content or Paywall */}
        {accessInfo && !accessInfo.hasAccess && accessInfo.requiresSubscription ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <BlogPaywall
              authorId={blog.author_id}
              authorName={blog.author_name || 'Author'}
              previewContent={blog.content || ''}
            />
          </motion.div>
        ) : (
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="prose prose-invert prose-lg max-w-none mb-12"
          >
            <div className="leading-relaxed" style={{ lineHeight: '1.8' }}>
              {renderContent()}
            </div>
          </motion.article>
        )}
      </div>
    </div>
  );
};

export default BlogDetail;
