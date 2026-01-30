import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Pencil, Trash2, Search, Eye, Clock, CheckCircle, Archive, ExternalLink, DollarSign, Lock, UserCheck, X } from 'lucide-react';
import { useStore } from '../../store';
import * as adminApi from '../../api/admin';
import { type Blog } from '../../api/blogs';

type TabType = 'all' | 'published' | 'draft' | 'archived' | 'pending' | 'paid' | 'free';

export default function AdminBlogs() {
  const navigate = useNavigate();
  const { user } = useStore();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user?.is_admin) {
      navigate('/');
      return;
    }
    fetchBlogs();
  }, [user, navigate, activeTab]);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const params: any = { limit: 100, search: searchTerm };

      if (activeTab !== 'all') {
        params.status = activeTab;
      }

      const response = await adminApi.getAllBlogs(params);
      setBlogs(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch blogs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (blogId: number, title: string) => {
    if (!confirm(`Publish "${title}"?`)) return;

    try {
      await adminApi.publishBlog(blogId);
      await fetchBlogs();
      alert('Blog published successfully');
    } catch (error: any) {
      console.error('Error publishing blog:', error);
      alert(error.response?.data?.message || 'Failed to publish blog');
    }
  };

  const handleUnpublish = async (blogId: number, title: string) => {
    if (!confirm(`Unpublish "${title}"? It will be moved to drafts.`)) return;

    try {
      await adminApi.unpublishBlog(blogId);
      await fetchBlogs();
      alert('Blog unpublished successfully');
    } catch (error: any) {
      console.error('Error unpublishing blog:', error);
      alert(error.response?.data?.message || 'Failed to unpublish blog');
    }
  };

  const handleArchive = async (blogId: number, title: string) => {
    if (!confirm(`Archive "${title}"? It will be hidden from public view.`)) return;

    try {
      await adminApi.archiveBlog(blogId);
      await fetchBlogs();
      alert('Blog archived successfully');
    } catch (error: any) {
      console.error('Error archiving blog:', error);
      alert(error.response?.data?.message || 'Failed to archive blog');
    }
  };

  const handleDelete = async (blogId: number, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) return;

    try {
      await adminApi.deleteBlogAdmin(blogId);
      await fetchBlogs();
      alert('Blog deleted successfully');
    } catch (error: any) {
      console.error('Error deleting blog:', error);
      alert(error.response?.data?.message || 'Failed to delete blog');
    }
  };

  const handleApproveAuthor = async (blogId: number, title: string, authorName: string) => {
    if (!confirm(`Approve "${title}" by ${authorName}? This will publish the blog and approve ${authorName} as an author.`)) return;

    try {
      await adminApi.approveAuthorApplication(blogId);
      await fetchBlogs();
      alert('Author approved and blog published successfully!');
    } catch (error: any) {
      console.error('Error approving author:', error);
      alert(error.response?.data?.message || 'Failed to approve author');
    }
  };

  const handleRejectAuthor = async (blogId: number, title: string, authorName: string) => {
    if (!confirm(`Reject "${title}" by ${authorName}? This will delete the blog and the author will need to resubmit.`)) return;

    try {
      await adminApi.rejectAuthorApplication(blogId);
      await fetchBlogs();
      alert('Author application rejected');
    } catch (error: any) {
      console.error('Error rejecting author:', error);
      alert(error.response?.data?.message || 'Failed to reject author');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'draft': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'archived': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'pending': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default: return 'bg-white/10 text-white/60 border-white/20';
    }
  };

  const filteredBlogs = blogs.filter(blog => {
    // Search filter
    const matchesSearch = blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      blog.author_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      blog.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    // Paid/Free filter
    if (activeTab === 'paid') {
      return (blog as any).is_paid === true;
    }
    if (activeTab === 'free') {
      return !(blog as any).is_paid;
    }

    return true;
  });

  return (
    <div className="min-h-screen py-8 px-4 md:px-8 max-w-7xl mx-auto">
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => navigate('/admin/dashboard')}
        className="flex items-center gap-2 text-white/60 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Dashboard
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-display font-bold text-white mb-2">Manage Blogs</h1>
        <p className="text-white/60">Manage and moderate blog articles</p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            activeTab === 'all'
              ? 'bg-gold-500 text-chess-darker'
              : 'bg-white/5 text-white/60 hover:bg-white/10'
          }`}
        >
          All Blogs
        </button>
        <button
          onClick={() => setActiveTab('published')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            activeTab === 'published'
              ? 'bg-gold-500 text-chess-darker'
              : 'bg-white/5 text-white/60 hover:bg-white/10'
          }`}
        >
          Published
        </button>
        <button
          onClick={() => setActiveTab('draft')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            activeTab === 'draft'
              ? 'bg-gold-500 text-chess-darker'
              : 'bg-white/5 text-white/60 hover:bg-white/10'
          }`}
        >
          Drafts
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            activeTab === 'pending'
              ? 'bg-gold-500 text-chess-darker'
              : 'bg-white/5 text-white/60 hover:bg-white/10'
          }`}
        >
          Pending Approval
        </button>
        <button
          onClick={() => setActiveTab('archived')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            activeTab === 'archived'
              ? 'bg-gold-500 text-chess-darker'
              : 'bg-white/5 text-white/60 hover:bg-white/10'
          }`}
        >
          Archived
        </button>
        <button
          onClick={() => setActiveTab('paid')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'paid'
              ? 'bg-gold-500 text-chess-darker'
              : 'bg-white/5 text-white/60 hover:bg-white/10'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          Paid
        </button>
        <button
          onClick={() => setActiveTab('free')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            activeTab === 'free'
              ? 'bg-gold-500 text-chess-darker'
              : 'bg-white/5 text-white/60 hover:bg-white/10'
          }`}
        >
          Free
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            placeholder="Search blogs by title, author, or tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white
                     placeholder-white/40 focus:outline-none focus:border-gold-500/50 transition-all"
          />
        </div>
      </div>

      {/* Blogs List */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="text-white/60">Loading blogs...</div>
        </div>
      ) : filteredBlogs.length === 0 ? (
        <div className="text-center py-20">
          <BookOpen className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <p className="text-white/60 text-lg">No blogs found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBlogs.map((blog) => (
            <motion.div
              key={blog.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-white">{blog.title}</h3>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(blog.status)}`}>
                      {blog.status}
                    </span>
                    {(blog as any).is_paid && (
                      <span className="px-3 py-1 text-xs font-medium rounded-full border bg-gold-500/20 text-gold-400 border-gold-500/30 flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        Paid
                      </span>
                    )}
                  </div>

                  {blog.subtitle && (
                    <p className="text-white/70 mb-3">{blog.subtitle}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-sm text-white/50">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatDate(blog.created_at)}
                    </span>
                    {blog.author_name && (
                      <span>by {blog.author_name}</span>
                    )}
                    {blog.views_count > 0 && (
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {blog.views_count} views
                      </span>
                    )}
                    {blog.read_time_minutes && (
                      <span>{blog.read_time_minutes} min read</span>
                    )}
                    {(blog as any).is_paid && (
                      <span className="flex items-center gap-1 text-gold-400">
                        <Lock className="w-4 h-4" />
                        {(blog as any).preview_percent}% preview
                      </span>
                    )}
                  </div>

                  {blog.tags && blog.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {blog.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs bg-blue-500/20 text-blue-400 rounded-md"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  {blog.status === 'published' && (
                    <button
                      onClick={() => navigate(`/blogs/${blog.slug || blog.id}`)}
                      className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-all"
                      title="View blog"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => navigate(`/blogs/edit/${blog.id}`)}
                    className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-all"
                    title="Edit blog"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>

                  {blog.status === 'draft' && (
                    <button
                      onClick={() => handlePublish(blog.id, blog.title)}
                      className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-all"
                      title="Publish blog"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}

                  {blog.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApproveAuthor(blog.id, blog.title, blog.author_name || 'Unknown')}
                        className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-all"
                        title="Approve author application"
                      >
                        <UserCheck className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRejectAuthor(blog.id, blog.title, blog.author_name || 'Unknown')}
                        className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all"
                        title="Reject author application"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  )}

                  {blog.status === 'published' && (
                    <>
                      <button
                        onClick={() => handleUnpublish(blog.id, blog.title)}
                        className="p-2 bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-all"
                        title="Unpublish blog"
                      >
                        <Clock className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleArchive(blog.id, blog.title)}
                        className="p-2 bg-gray-500/20 text-gray-400 rounded-lg hover:bg-gray-500/30 transition-all"
                        title="Archive blog"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => handleDelete(blog.id, blog.title)}
                    className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all"
                    title="Delete blog"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
