import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Plus, Search, Clock, Heart, MessageSquare, Eye } from 'lucide-react';
import { blogsApi, type Blog } from '../api/blogs';
import { useStore } from '../store';

const BlogsList = () => {
  const navigate = useNavigate();
  const { user } = useStore();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchBlogs();
  }, [page, searchQuery, categoryFilter, difficultyFilter]);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const response = await blogsApi.getBlogs({
        status: 'published',
        search: searchQuery || undefined,
        chess_category: categoryFilter || undefined,
        difficulty_level: difficultyFilter || undefined,
        page,
        limit: 12,
      });
      setBlogs(response.data);
      setTotalPages(response.meta?.totalPages || 1);
    } catch (error) {
      console.error('Error fetching blogs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchBlogs();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen py-8 px-4 md:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-white">
              Chess Articles & Blogs
            </h1>
          </div>
          {user && (
            <button
              onClick={() => navigate('/blogs/create')}
              className="px-6 py-3 bg-gold-500 hover:bg-gold-400 text-chess-darker font-semibold rounded-xl transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Write Article
            </button>
          )}
        </div>
        <p className="text-lg text-white/70">
          Discover insights, strategies, and stories from the chess community
        </p>
      </motion.div>

      {/* Search */}
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onSubmit={handleSearch}
        className="mb-8"
      >
        <div className="relative max-w-2xl">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search articles..."
            className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:border-gold-500 focus:outline-none"
          />
        </div>
      </motion.form>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-8 flex flex-wrap gap-4"
      >
        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-gold-500 focus:outline-none"
        >
          <option value="">All Categories</option>
          <option value="opening-theory">Opening Theory</option>
          <option value="middlegame">Middlegame</option>
          <option value="endgame">Endgame</option>
          <option value="tactics">Tactics</option>
          <option value="strategy">Strategy</option>
          <option value="game-analysis">Game Analysis</option>
          <option value="tournament-report">Tournament Report</option>
          <option value="training">Training</option>
        </select>

        <select
          value={difficultyFilter}
          onChange={(e) => {
            setDifficultyFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-gold-500 focus:outline-none"
        >
          <option value="">All Levels</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
          <option value="expert">Expert</option>
        </select>

        {(categoryFilter || difficultyFilter) && (
          <button
            onClick={() => {
              setCategoryFilter('');
              setDifficultyFilter('');
              setPage(1);
            }}
            className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
          >
            Clear Filters
          </button>
        )}
      </motion.div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500"></div>
        </div>
      )}

      {/* Blogs Grid */}
      {!loading && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.map((blog, index) => (
              <motion.article
                key={blog.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => navigate(`/blogs/${blog.slug || blog.id}`)}
                className="group cursor-pointer bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 hover:border-white/20 transition-all"
              >
                {/* Cover Image */}
                {blog.cover_image && (
                  <div className="aspect-[16/9] overflow-hidden">
                    <img
                      src={blog.cover_image}
                      alt={blog.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}

                {/* Content */}
                <div className="p-6">
                  {/* Tags & Chess Badges */}
                  {(blog.tags && blog.tags.length > 0) || blog.chess_category || blog.difficulty_level ? (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {blog.tags && blog.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-lg"
                        >
                          {tag}
                        </span>
                      ))}
                      {blog.chess_category && (
                        <span className="px-2 py-1 bg-gold-500/20 text-gold-400 text-xs rounded-lg font-semibold border border-gold-500/30">
                          {blog.chess_category.replace(/-/g, ' ')}
                        </span>
                      )}
                      {blog.difficulty_level && (
                        <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-lg border border-purple-500/30">
                          {blog.difficulty_level}
                        </span>
                      )}
                    </div>
                  ) : null}

                  {/* Title */}
                  <h2 className="text-xl font-bold text-white mb-2 group-hover:text-gold-400 transition-colors line-clamp-2">
                    {blog.title}
                  </h2>

                  {/* Subtitle */}
                  {blog.subtitle && (
                    <p className="text-white/60 text-sm mb-4 line-clamp-2">
                      {blog.subtitle}
                    </p>
                  )}

                  {/* Author & Date */}
                  <div className="flex items-center gap-3 mb-4">
                    {blog.author_avatar && (
                      <img
                        src={blog.author_avatar}
                        alt={blog.author_name}
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium">{blog.author_name}</p>
                      <p className="text-xs text-white/50">
                        {formatDate(blog.published_at || blog.created_at)}
                      </p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs text-white/50">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {blog.read_time_minutes || 5} min read
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {blog.views_count}
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      {blog.likes_count}
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      {blog.comments_count}
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>

          {/* Empty State */}
          {blogs.length === 0 && (
            <div className="text-center py-20">
              <BookOpen className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No articles found</h3>
              <p className="text-white/60">
                {searchQuery
                  ? 'Try adjusting your search terms'
                  : 'Be the first to write an article!'}
              </p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-12">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-white">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BlogsList;
