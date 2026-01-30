import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Send, Trash2, Loader2, Gamepad2, Trophy, Crown, Swords, Flame, Brain, Quote, BookOpen, Lightbulb, Zap, Image as ImageIcon, X, ExternalLink, FileText, Users, Home, MapPin, Clock, Eye, Hash, TrendingUp } from 'lucide-react';
import { postsApi, type Post as PostType, type PostComment } from '../api/posts';
import { uploadsApi } from '../api/uploads';
import { challengesApi } from '../api/challenges';
import { blogsApi, type Blog } from '../api/blogs';
import { useStore } from '../store';
import { Helmet } from 'react-helmet-async';
import ChessGameViewer from '../components/ChessGameViewer';
import Avatar from '../components/Avatar';
import LinkPreview from '../components/LinkPreview';
import { extractUrls } from '../api/linkPreview';

type FeedTab = 'my-feed' | 'local' | 'tournaments' | 'articles';

export default function Feed() {
  const navigate = useNavigate();
  const { user, openAuthModal } = useStore();
  const [posts, setPosts] = useState<PostType[]>([]);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FeedTab>('my-feed');
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedImageFiles, setSelectedImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showNewPost, setShowNewPost] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [linkedEntityType, setLinkedEntityType] = useState<'tournament' | 'club' | 'challenge' | null>(null);
  const [linkedEntityId, setLinkedEntityId] = useState<number | null>(null);
  const [pgnContent, setPgnContent] = useState<string>('');
  const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set());
  const [comments, setComments] = useState<Record<number, PostComment[]>>({});
  const [newComment, setNewComment] = useState<Record<number, string>>({});
  const [trendingHashtags, setTrendingHashtags] = useState<any[]>([]);
  const [selectedHashtag, setSelectedHashtag] = useState<string | null>(null);
  const [hashtagSuggestions, setHashtagSuggestions] = useState<any[]>([]);
  const [showHashtagSuggestions, setShowHashtagSuggestions] = useState(false);

  useEffect(() => {
    fetchPosts();
    fetchTrendingHashtags();
  }, []);

  useEffect(() => {
    if (activeTab === 'articles') {
      fetchBlogs();
    }
  }, [activeTab]);

  useEffect(() => {
    if (selectedHashtag) {
      fetchPostsByHashtag(selectedHashtag);
    } else {
      fetchPosts();
    }
  }, [selectedHashtag]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await postsApi.getPosts(50, 0);
      setPosts(response.data.data);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const response = await blogsApi.getBlogs({ status: 'published', limit: 20 });
      setBlogs(response.data);
    } catch (error) {
      console.error('Failed to fetch blogs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrendingHashtags = async () => {
    try {
      const response = await postsApi.getTrendingHashtags(10);
      setTrendingHashtags(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch trending hashtags:', error);
    }
  };

  const fetchPostsByHashtag = async (hashtag: string) => {
    try {
      setLoading(true);
      const response = await postsApi.getPostsByHashtag(hashtag, 50, 0);
      setPosts(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch posts by hashtag:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleHashtagClick = (hashtag: string) => {
    setSelectedHashtag(hashtag);
    setActiveTab('my-feed');
  };

  const handlePostContentChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value;
    setNewPostContent(content);

    // Check if user is typing a hashtag
    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = content.substring(0, cursorPosition);
    const hashtagMatch = textBeforeCursor.match(/#(\w*)$/);

    if (hashtagMatch) {
      const query = hashtagMatch[1];
      if (query.length > 0) {
        try {
          const response = await postsApi.searchHashtags(query, 5);
          setHashtagSuggestions(response.data.data || []);
          setShowHashtagSuggestions(true);
        } catch (error) {
          console.error('Failed to search hashtags:', error);
        }
      } else {
        // Show trending hashtags when user just types #
        setHashtagSuggestions(trendingHashtags.slice(0, 5));
        setShowHashtagSuggestions(true);
      }
    } else {
      setShowHashtagSuggestions(false);
    }
  };

  const insertHashtag = (hashtag: string) => {
    const cursorPosition = (document.querySelector('textarea') as HTMLTextAreaElement)?.selectionStart || 0;
    const textBeforeCursor = newPostContent.substring(0, cursorPosition);
    const textAfterCursor = newPostContent.substring(cursorPosition);

    // Replace the partial hashtag with the selected one
    const beforeHash = textBeforeCursor.replace(/#\w*$/, `#${hashtag} `);
    setNewPostContent(beforeHash + textAfterCursor);
    setShowHashtagSuggestions(false);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Check if adding these files would exceed 4 images
    if (selectedImageFiles.length + files.length > 4) {
      alert('Maximum 4 images allowed per post');
      return;
    }

    // Validate each file
    for (const file of files) {
      // Check file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert('Each image must be less than 5MB');
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        alert('Please select only image files');
        return;
      }
    }

    // Add files to state
    setSelectedImageFiles(prev => [...prev, ...files]);

    // Create previews for new files
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setSelectedImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handlePgnSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.name.endsWith('.pgn')) {
      alert('Please select a PGN file');
      return;
    }

    // Read the file content
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setPgnContent(content);
    };
    reader.readAsText(file);
  };

  const handleCreatePost = async () => {
    if (!user) {
      openAuthModal('login');
      return;
    }

    if (!newPostContent.trim()) {
      return;
    }

    try {
      setSubmitting(true);

      let imageUrls: string[] = [];

      // Upload all images if files are selected
      if (selectedImageFiles.length > 0) {
        setUploadingImage(true);
        const uploadPromises = selectedImageFiles.map(file => uploadsApi.uploadImage(file));
        const uploadResponses = await Promise.all(uploadPromises);
        imageUrls = uploadResponses.map(response => response.url);
        setUploadingImage(false);
      }

      await postsApi.createPost({
        content: newPostContent,
        images: imageUrls.length > 0 ? imageUrls : undefined,
        pgn: pgnContent || undefined,
        linked_entity_type: linkedEntityType || undefined,
        linked_entity_id: linkedEntityId || undefined,
      });

      setNewPostContent('');
      setSelectedImageFiles([]);
      setImagePreviews([]);
      setPgnContent('');
      setLinkedEntityType(null);
      setLinkedEntityId(null);
      setShowNewPost(false);
      fetchPosts();
    } catch (error) {
      console.error('Failed to create post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setSubmitting(false);
      setUploadingImage(false);
    }
  };

  const handleLikePost = async (postId: number) => {
    if (!user) {
      openAuthModal('login');
      return;
    }

    // Store the original state for potential rollback
    const originalPost = posts.find(p => p.id === postId);
    if (!originalPost) return;

    // Optimistic update - update UI immediately using functional setState
    setPosts(prevPosts => prevPosts.map(post =>
      post.id === postId
        ? {
            ...post,
            is_liked: !post.is_liked,
            likes_count: Number(post.likes_count) + (post.is_liked ? -1 : 1)
          }
        : post
    ));

    try {
      // Make API call in background
      if (originalPost.is_liked) {
        await postsApi.unlikePost(postId);
      } else {
        await postsApi.likePost(postId);
      }
    } catch (error) {
      console.error('Failed to like/unlike post:', error);
      // Revert to original state on error
      setPosts(prevPosts => prevPosts.map(post =>
        post.id === postId
          ? {
              ...post,
              is_liked: originalPost.is_liked,
              likes_count: originalPost.likes_count
            }
          : post
      ));
      alert('Failed to update like. Please try again.');
    }
  };

  const handleDeletePost = async (postId: number) => {
    if (!confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      await postsApi.deletePost(postId);
      setPosts(posts.filter(post => post.id !== postId));
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
  };

  const toggleComments = async (postId: number) => {
    const newExpanded = new Set(expandedComments);
    if (newExpanded.has(postId)) {
      newExpanded.delete(postId);
      setExpandedComments(newExpanded);
    } else {
      newExpanded.add(postId);
      setExpandedComments(newExpanded);

      if (!comments[postId]) {
        try {
          const response = await postsApi.getComments(postId);
          setComments({ ...comments, [postId]: response.data.data });
        } catch (error) {
          console.error('Failed to fetch comments:', error);
        }
      }
    }
  };

  const handleAddComment = async (postId: number) => {
    if (!user) {
      openAuthModal('login');
      return;
    }

    const content = newComment[postId];
    if (!content?.trim()) {
      return;
    }

    try {
      const response = await postsApi.addComment(postId, { content });
      const newCommentData = response.data.data;

      setComments({
        ...comments,
        [postId]: [...(comments[postId] || []), newCommentData]
      });

      setPosts(posts.map(post =>
        post.id === postId
          ? { ...post, comments_count: post.comments_count + 1 }
          : post
      ));

      setNewComment({ ...newComment, [postId]: '' });
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  const handleAcceptChallenge = async (challengeId: number) => {
    if (!user) {
      openAuthModal('login');
      return;
    }

    if (!confirm('Accept this challenge?')) {
      return;
    }

    try {
      await challengesApi.respondToChallenge(challengeId, 'accepted');
      alert('Challenge accepted! Check your games.');
      // Optionally refresh posts or update the specific post
    } catch (error: any) {
      console.error('Failed to accept challenge:', error);
      alert(error.response?.data?.message || 'Failed to accept challenge');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Filter posts based on active tab
  const filteredPosts = posts.filter(post => {
    switch (activeTab) {
      case 'my-feed':
        // Show all posts for now (in future, could filter by following)
        return true;
      case 'local':
        // Show posts without linked entities (general community posts)
        // In future, could filter by location
        return !post.linked_entity_type;
      case 'tournaments':
        // Show posts linked to tournaments
        return post.linked_entity_type === 'tournament';
      case 'articles':
        // Show posts with PGN or longer content (articles/analysis)
        return post.pgn || post.content.length > 500;
      default:
        return true;
    }
  });

  const trendingPosts = posts.slice(0, 5).sort((a, b) => b.likes_count - a.likes_count);

  return (
    <>
      <Helmet>
        <title>Chess Community Feed | ChessFam</title>
        <meta
          name="description"
          content="Join the ChessFam community. Share your chess moments, connect with players, and stay updated with the latest chess news."
        />
      </Helmet>

      <div className="min-h-screen py-8 px-4 md:px-8 lg:px-16">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-display font-bold text-white mb-2">Community Feed</h1>
            <p className="text-white/60">Real people, real chess</p>
          </motion.div>

          {/* Quick Actions - Mobile/Tablet */}
          <div className="lg:hidden mb-6">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate('/games')}
                className="flex items-center gap-2 p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <Gamepad2 className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-left min-w-0">
                  <p className="text-white/90 font-medium text-sm truncate">Schedule Game</p>
                </div>
              </button>

              <button
                onClick={() => navigate('/tournaments')}
                className="flex items-center gap-2 p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <Trophy className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-left min-w-0">
                  <p className="text-white/90 font-medium text-sm truncate">Tournaments</p>
                </div>
              </button>

              <button
                onClick={() => navigate('/masters')}
                className="flex items-center gap-2 p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-gold-500/20 flex items-center justify-center flex-shrink-0">
                  <Crown className="w-4 h-4 text-gold-400" />
                </div>
                <div className="text-left min-w-0">
                  <p className="text-white/90 font-medium text-sm truncate">Book GM</p>
                </div>
              </button>

              <button
                onClick={() => navigate('/challenges')}
                className="flex items-center gap-2 p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
                  <Swords className="w-4 h-4 text-red-400" />
                </div>
                <div className="text-left min-w-0">
                  <p className="text-white/90 font-medium text-sm truncate">Challenges</p>
                </div>
              </button>

              <button
                onClick={() => navigate('/clubs')}
                className="flex items-center gap-2 p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <Users className="w-4 h-4 text-green-400" />
                </div>
                <div className="text-left min-w-0">
                  <p className="text-white/90 font-medium text-sm truncate">Find a Club</p>
                </div>
              </button>
            </div>
          </div>

          {/* Three Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Sidebar - Quick Actions (Desktop) */}
            <div className="hidden lg:block lg:col-span-3">
              <div className="sticky top-24 space-y-3">
                <h2 className="text-lg font-semibold text-white mb-3">Quick Actions</h2>

                <button
                  onClick={() => navigate('/games')}
                  className="w-full flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/20 transition-all group"
                >
                  <div className="w-9 h-9 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <Gamepad2 className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-white/90 font-medium text-sm">Schedule a Game</p>
                    <p className="text-white/40 text-xs">Find opponents</p>
                  </div>
                </button>

                <button
                  onClick={() => navigate('/tournaments')}
                  className="w-full flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/20 transition-all group"
                >
                  <div className="w-9 h-9 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <Trophy className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-white/90 font-medium text-sm">Tournaments</p>
                    <p className="text-white/40 text-xs">Join events</p>
                  </div>
                </button>

                <button
                  onClick={() => navigate('/masters')}
                  className="w-full flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/20 transition-all group"
                >
                  <div className="w-9 h-9 rounded-lg bg-gold-500/20 flex items-center justify-center">
                    <Crown className="w-4 h-4 text-gold-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-white/90 font-medium text-sm">Book a GM</p>
                    <p className="text-white/40 text-xs">Learn from pros</p>
                  </div>
                </button>

                <button
                  onClick={() => navigate('/challenges')}
                  className="w-full flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/20 transition-all group"
                >
                  <div className="w-9 h-9 rounded-lg bg-red-500/20 flex items-center justify-center">
                    <Swords className="w-4 h-4 text-red-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-white/90 font-medium text-sm">Open Challenges</p>
                    <p className="text-white/40 text-xs">Find opponents</p>
                  </div>
                </button>

                <button
                  onClick={() => navigate('/clubs')}
                  className="w-full flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/20 transition-all group"
                >
                  <div className="w-9 h-9 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <Users className="w-4 h-4 text-green-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-white/90 font-medium text-sm">Find a Club</p>
                    <p className="text-white/40 text-xs">Join community</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Center - Main Feed */}
            <div className="lg:col-span-6">
              {/* Tabs */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 backdrop-blur-sm rounded-xl p-4 mb-6 border border-white/10"
              >
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                  <button
                    onClick={() => setActiveTab('my-feed')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap ${
                      activeTab === 'my-feed'
                        ? 'bg-gold-500 text-chess-darker'
                        : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10'
                    }`}
                  >
                    <Home className="w-4 h-4" />
                    My Feed
                  </button>

                  <button
                    onClick={() => setActiveTab('local')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap ${
                      activeTab === 'local'
                        ? 'bg-gold-500 text-chess-darker'
                        : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10'
                    }`}
                  >
                    <MapPin className="w-4 h-4" />
                    Local
                  </button>

                  <button
                    onClick={() => setActiveTab('tournaments')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap ${
                      activeTab === 'tournaments'
                        ? 'bg-gold-500 text-chess-darker'
                        : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10'
                    }`}
                  >
                    <Trophy className="w-4 h-4" />
                    Tournaments
                  </button>

                  <button
                    onClick={() => setActiveTab('articles')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap ${
                      activeTab === 'articles'
                        ? 'bg-gold-500 text-chess-darker'
                        : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    Articles
                  </button>
                </div>
              </motion.div>

              {/* Create New Post */}
              {user && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/5 backdrop-blur-sm rounded-xl p-6 mb-6 border border-white/10"
                >
                  {!showNewPost ? (
                    <button
                      onClick={() => setShowNewPost(true)}
                      className="w-full text-left px-4 py-3 bg-white/5 rounded-lg text-white/50 hover:bg-white/10 hover:text-white/70 transition-colors"
                    >
                      What's on your mind, {user.name}?
                    </button>
                  ) : (
                    <div className="space-y-4">
                      <div className="relative">
                        <textarea
                          value={newPostContent}
                          onChange={handlePostContentChange}
                          placeholder="Share your thoughts... Use #hashtags to categorize your post!"
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-gold-500 resize-none"
                          rows={4}
                          maxLength={5000}
                        />

                        {/* Hashtag Autocomplete Dropdown */}
                        {showHashtagSuggestions && hashtagSuggestions.length > 0 && (
                          <div className="absolute z-10 mt-1 w-full max-w-xs bg-chess-darker border border-white/20 rounded-lg shadow-xl overflow-hidden">
                            {hashtagSuggestions.map((hashtag, index) => (
                              <button
                                key={index}
                                onClick={() => insertHashtag(hashtag.tag)}
                                className="w-full flex items-center justify-between px-4 py-2 hover:bg-white/10 transition-colors text-left"
                              >
                                <div className="flex items-center gap-2">
                                  <Hash className="w-4 h-4 text-blue-400" />
                                  <span className="text-white">{hashtag.tag}</span>
                                </div>
                                {hashtag.usage_count && (
                                  <span className="text-xs text-white/40">
                                    {hashtag.usage_count} posts
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="text-xs text-white/40">
                        <Hash className="w-3 h-3 inline" /> Tip: Use hashtags like #chess #tournament #tactics to help others discover your post
                      </div>

                      {/* Image Previews */}
                      {imagePreviews.length > 0 && (
                        <div className={`grid gap-2 ${
                          imagePreviews.length === 1 ? 'grid-cols-1' :
                          imagePreviews.length === 2 ? 'grid-cols-2' :
                          imagePreviews.length === 3 ? 'grid-cols-3' :
                          'grid-cols-2'
                        }`}>
                          {imagePreviews.map((preview, index) => (
                            <div key={index} className="relative">
                              <img
                                src={preview}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-40 object-cover rounded-lg"
                              />
                              <button
                                onClick={() => removeImage(index)}
                                className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 rounded-full text-white transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* PGN Preview */}
                      {pgnContent && (
                        <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-white/70 text-sm flex items-center gap-2">
                              <FileText className="w-4 h-4" />
                              Chess Game PGN
                            </span>
                            <button
                              onClick={() => setPgnContent('')}
                              className="text-white/40 hover:text-white/70 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="text-xs text-white/50 font-mono max-h-20 overflow-y-auto">
                            {pgnContent.substring(0, 200)}...
                          </div>
                        </div>
                      )}

                      {/* Image & PGN Upload Buttons */}
                      <div className="flex items-center gap-3">
                        <label className={`flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg cursor-pointer transition-colors text-white/70 hover:text-white text-sm ${selectedImageFiles.length >= 4 ? 'opacity-50 cursor-not-allowed' : ''}`}>
                          <ImageIcon className="w-4 h-4" />
                          {selectedImageFiles.length > 0 ? `${selectedImageFiles.length} image${selectedImageFiles.length > 1 ? 's' : ''} (max 4)` : 'Add Images (max 4)'}
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageSelect}
                            className="hidden"
                            disabled={selectedImageFiles.length >= 4}
                          />
                        </label>

                        <label className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg cursor-pointer transition-colors text-white/70 hover:text-white text-sm">
                          <FileText className="w-4 h-4" />
                          {pgnContent ? 'PGN Added' : 'Add PGN'}
                          <input
                            type="file"
                            accept=".pgn"
                            onChange={handlePgnSelect}
                            className="hidden"
                          />
                        </label>

                        {uploadingImage && (
                          <div className="flex items-center gap-2 text-white/60 text-sm">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Uploading...
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => {
                            setShowNewPost(false);
                            setNewPostContent('');
                            setSelectedImageFiles([]);
                            setImagePreviews([]);
                            setPgnContent('');
                          }}
                          className="px-4 py-2 text-white/60 hover:text-white transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleCreatePost}
                          disabled={!newPostContent.trim() || submitting || uploadingImage}
                          className="px-6 py-2 bg-gold-500 text-chess-darker font-semibold rounded-lg hover:bg-gold-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {submitting ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              {uploadingImage ? 'Uploading...' : 'Posting...'}
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              Post
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Posts Feed */}
              {activeTab === 'articles' ? (
                // Articles/Blogs Tab
                loading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
                  </div>
                ) : blogs.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="w-16 h-16 text-white/20 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No articles yet</h3>
                    <p className="text-white/60 mb-6">Be the first to write an article!</p>
                    {user && (
                      <button
                        onClick={() => navigate('/blogs/create')}
                        className="px-6 py-3 bg-gold-500 hover:bg-gold-400 text-chess-darker font-semibold rounded-xl transition-colors"
                      >
                        Write Article
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {blogs.map((blog, index) => (
                      <motion.article
                        key={blog.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => navigate(`/blogs/${blog.slug || blog.id}`)}
                        className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer group"
                      >
                        {/* Cover Image */}
                        {blog.cover_image && (
                          <div className="w-full h-48 overflow-hidden">
                            <img
                              src={blog.cover_image}
                              alt={blog.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        )}

                        <div className="p-6">
                          {/* Tags */}
                          {blog.tags && blog.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                              {blog.tags.map((tag, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-1 bg-gold-500/20 text-gold-400 text-xs font-medium rounded-full border border-gold-500/30"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Title and Subtitle */}
                          <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-gold-400 transition-colors">
                            {blog.title}
                          </h2>
                          {blog.subtitle && (
                            <p className="text-white/70 mb-4 line-clamp-2">
                              {blog.subtitle}
                            </p>
                          )}

                          {/* Author and Meta Info */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {blog.author_avatar ? (
                                <img
                                  src={blog.author_avatar}
                                  alt={blog.author_name}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-500 to-amber-600 flex items-center justify-center text-white text-sm font-bold">
                                  {blog.author_name?.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className="text-sm">
                                <div className="font-medium text-white">{blog.author_name}</div>
                                <div className="text-white/50">
                                  {blog.published_at && new Date(blog.published_at).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </div>
                              </div>
                            </div>

                            {/* Stats */}
                            <div className="flex items-center gap-4 text-sm text-white/60">
                              {blog.read_time_minutes && (
                                <div className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  <span>{blog.read_time_minutes} min</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <Eye className="w-4 h-4" />
                                <span>{blog.views_count}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Heart className="w-4 h-4" />
                                <span>{blog.likes_count}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MessageCircle className="w-4 h-4" />
                                <span>{blog.comments_count}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.article>
                    ))}
                  </div>
                )
              ) : (
                // Other Tabs - Posts Feed
                loading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
                  </div>
                ) : filteredPosts.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-white/50">
                      {posts.length === 0
                        ? "No posts yet. Be the first to share!"
                        : "No posts in this category yet."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {filteredPosts.map((post, index) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
                    >
                      {/* Post Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={post.user_avatar}
                            name={post.user_name}
                            size="md"
                            chessTitle={post.user_chess_title ?? undefined}
                            chessTitleVerified={post.user_chess_title_verified}
                          />
                          <div>
                            <button
                              onClick={() => navigate(`/player/${post.user_id}`)}
                              className="font-semibold text-white hover:text-gold-400 transition-colors text-left"
                            >
                              {post.user_name}
                            </button>
                            <div className="text-xs text-white/50">{formatDate(post.created_at)}</div>
                          </div>
                        </div>

                        {user && user.id === post.user_id && (
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="text-white/40 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Post Content */}
                      <div className="mb-4">
                        <p className="text-white whitespace-pre-wrap">{post.content}</p>

                        {/* Link Previews/Embeds */}
                        {(() => {
                          const urls = extractUrls(post.content);
                          if (urls.length > 0) {
                            // Show preview for first URL only (to avoid clutter)
                            return <LinkPreview url={urls[0]} />;
                          }
                          return null;
                        })()}

                        {/* Multiple Images Grid */}
                        {post.images && post.images.length > 0 && (
                          <div className={`mt-4 grid gap-2 ${
                            post.images.length === 1 ? 'grid-cols-1' :
                            post.images.length === 2 ? 'grid-cols-2' :
                            post.images.length === 3 ? 'grid-cols-3' :
                            'grid-cols-2'
                          }`}>
                            {post.images.map((img, index) => (
                              <div key={index} className="relative rounded-lg overflow-hidden group">
                                <img
                                  src={img}
                                  alt={`Post image ${index + 1}`}
                                  className={`w-full object-cover ${
                                    post.images!.length === 1 ? 'max-h-96' :
                                    post.images!.length === 4 && index >= 2 ? 'h-48' : 'h-64'
                                  }`}
                                />
                                {/* CTA Overlay only on first image for linked entities */}
                                {index === 0 && post.linked_entity_type && post.linked_entity_id && (
                                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-4">
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1">
                                        <div className="text-xs text-white/60 uppercase tracking-wide mb-1">
                                          {post.linked_entity_type === 'tournament' && 'Tournament'}
                                          {post.linked_entity_type === 'club' && 'Club'}
                                          {post.linked_entity_type === 'challenge' && 'Challenge'}
                                        </div>
                                        <div className="text-white font-semibold mb-1">
                                          {post.linked_entity_name}
                                        </div>
                                      </div>
                                      <div className="ml-4">
                                        {post.linked_entity_type === 'challenge' ? (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleAcceptChallenge(post.linked_entity_id!);
                                            }}
                                            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
                                          >
                                            <Swords className="w-4 h-4" />
                                            Accept Challenge
                                          </button>
                                        ) : (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              const routes = {
                                                tournament: `/tournament/${post.linked_entity_id}`,
                                                club: `/club/${post.linked_entity_id}`,
                                                challenge: `/challenges`,
                                              };
                                              navigate(routes[post.linked_entity_type as keyof typeof routes]);
                                            }}
                                            className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
                                          >
                                            Learn More
                                            <ExternalLink className="w-4 h-4" />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Single Image (legacy support) */}
                        {post.image && !post.images && (
                          <div className="relative mt-4 rounded-lg overflow-hidden group">
                            <img
                              src={post.image}
                              alt="Post image"
                              className="w-full object-cover max-h-96"
                            />
                            {/* CTA Overlay for linked entities */}
                            {post.linked_entity_type && post.linked_entity_id && (
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="text-xs text-white/60 uppercase tracking-wide mb-1">
                                      {post.linked_entity_type === 'tournament' && 'Tournament'}
                                      {post.linked_entity_type === 'club' && 'Club'}
                                      {post.linked_entity_type === 'challenge' && 'Challenge'}
                                    </div>
                                    <div className="text-white font-semibold mb-1">
                                      {post.linked_entity_name}
                                    </div>
                                  </div>
                                  <div className="ml-4">
                                    {post.linked_entity_type === 'challenge' ? (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleAcceptChallenge(post.linked_entity_id!);
                                        }}
                                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
                                      >
                                        <Swords className="w-4 h-4" />
                                        Accept Challenge
                                      </button>
                                    ) : (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const routes = {
                                            tournament: `/tournament/${post.linked_entity_id}`,
                                            club: `/club/${post.linked_entity_id}`,
                                            challenge: `/challenges`,
                                          };
                                          navigate(routes[post.linked_entity_type as keyof typeof routes]);
                                        }}
                                        className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
                                      >
                                        Learn More
                                        <ExternalLink className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Chess Game Viewer */}
                        {post.pgn && (
                          <div className="mt-4">
                            <ChessGameViewer pgn={post.pgn} />
                          </div>
                        )}

                        {/* Hashtags */}
                        {post.hashtags && post.hashtags.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {post.hashtags.map((tag, index) => (
                              <button
                                key={index}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleHashtagClick(tag);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-full text-sm font-medium transition-colors border border-blue-500/20 hover:border-blue-500/40"
                              >
                                <Hash className="w-3 h-3" />
                                {tag}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Post Actions */}
                      <div className="flex items-center gap-6 pt-4 border-t border-white/10">
                        <button
                          onClick={() => handleLikePost(post.id)}
                          className="flex items-center gap-2 text-white/60 hover:text-gold-400 transition-colors"
                        >
                          <Heart className={`w-5 h-5 ${post.is_liked ? 'fill-gold-400 text-gold-400' : ''}`} />
                          <span className="text-sm">{post.likes_count}</span>
                        </button>

                        <button
                          onClick={() => toggleComments(post.id)}
                          className="flex items-center gap-2 text-white/60 hover:text-blue-400 transition-colors"
                        >
                          <MessageCircle className="w-5 h-5" />
                          <span className="text-sm">{post.comments_count}</span>
                        </button>
                      </div>

                      {/* Comments Section */}
                      {expandedComments.has(post.id) && (
                        <div className="mt-4 pt-4 border-t border-white/10 space-y-4">
                          {comments[post.id]?.map((comment) => (
                            <div key={comment.id} className="flex gap-3">
                              <Avatar
                                src={comment.user_avatar}
                                name={comment.user_name}
                                size="sm"
                                chessTitle={comment.user_chess_title ?? undefined}
                                chessTitleVerified={comment.user_chess_title_verified}
                                className="flex-shrink-0"
                              />
                              <div className="flex-1">
                                <div className="bg-white/5 rounded-lg p-3">
                                  <button
                                    onClick={() => navigate(`/player/${comment.user_id}`)}
                                    className="font-semibold text-white text-sm mb-1 hover:text-gold-400 transition-colors"
                                  >
                                    {comment.user_name}
                                  </button>
                                  <p className="text-white/80 text-sm">{comment.content}</p>
                                </div>
                                <div className="text-xs text-white/40 mt-1 ml-3">{formatDate(comment.created_at)}</div>
                              </div>
                            </div>
                          ))}

                          {user && (
                            <div className="flex gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-500 to-amber-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                {user.avatar ? (
                                  <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                  user.name.charAt(0).toUpperCase()
                                )}
                              </div>
                              <div className="flex-1 flex gap-2">
                                <input
                                  type="text"
                                  value={newComment[post.id] || ''}
                                  onChange={(e) => setNewComment({ ...newComment, [post.id]: e.target.value })}
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                      e.preventDefault();
                                      handleAddComment(post.id);
                                    }
                                  }}
                                  placeholder="Write a comment..."
                                  className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-gold-500 text-sm"
                                />
                                <button
                                  onClick={() => handleAddComment(post.id)}
                                  disabled={!newComment[post.id]?.trim()}
                                  className="px-4 py-2 bg-gold-500 text-chess-darker font-semibold rounded-lg hover:bg-gold-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <Send className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
                )
              )}
            </div>

            {/* Right Sidebar - Widgets */}
            <div className="lg:col-span-3 space-y-6">
              {/* Trending Posts Widget */}
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 sticky top-24">
                <div className="flex items-center gap-2 mb-4">
                  <Flame className="w-5 h-5 text-orange-400" />
                  <h3 className="font-semibold text-white">Trending</h3>
                </div>
                <div className="space-y-3">
                  {trendingPosts.slice(0, 3).map((post) => (
                    <div key={post.id} className="group cursor-pointer">
                      <p className="text-white/80 text-sm line-clamp-2 group-hover:text-white transition-colors">
                        {post.content}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-white/40">
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          {post.likes_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-3 h-3" />
                          {post.comments_count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trending Hashtags Widget */}
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-400" />
                    <h3 className="font-semibold text-white">Trending Tags</h3>
                  </div>
                  {selectedHashtag && (
                    <button
                      onClick={() => setSelectedHashtag(null)}
                      className="text-xs text-white/50 hover:text-white transition-colors"
                    >
                      Clear filter
                    </button>
                  )}
                </div>
                {selectedHashtag && (
                  <div className="mb-3 p-2 bg-blue-500/10 rounded-lg border border-blue-500/30">
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-blue-400" />
                      <span className="text-sm text-blue-400 font-medium">Filtered by: #{selectedHashtag}</span>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  {trendingHashtags.length > 0 ? (
                    trendingHashtags.map((hashtag, index) => (
                      <button
                        key={index}
                        onClick={() => handleHashtagClick(hashtag.tag)}
                        className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${
                          selectedHashtag === hashtag.tag
                            ? 'bg-blue-500/20 border border-blue-500/40'
                            : 'hover:bg-white/5 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Hash className="w-4 h-4 text-blue-400" />
                          <span className="text-white/90 text-sm font-medium">
                            {hashtag.tag}
                          </span>
                        </div>
                        <span className="text-xs text-white/40">
                          {hashtag.usage_count} {hashtag.usage_count === 1 ? 'post' : 'posts'}
                        </span>
                      </button>
                    ))
                  ) : (
                    <p className="text-white/40 text-sm text-center py-3">
                      No trending tags yet
                    </p>
                  )}
                </div>
              </div>

              {/* Daily Chess Puzzle */}
              <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 backdrop-blur-sm rounded-xl p-4 border border-purple-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <Brain className="w-5 h-5 text-purple-400" />
                  <h3 className="font-semibold text-white">Daily Puzzle</h3>
                </div>
                <div className="space-y-3">
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <p className="text-white/90 text-sm mb-2">White to move and win</p>
                    <div className="w-full aspect-square bg-chess-darker/50 rounded-lg flex items-center justify-center mb-2">
                      <div className="text-white/40 text-xs text-center">
                        Chess board<br/>position here
                      </div>
                    </div>
                    <button className="w-full py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-sm font-medium rounded-lg transition-colors border border-purple-500/30">
                      Solve Puzzle
                    </button>
                  </div>
                  <p className="text-white/40 text-xs">Difficulty: ★★★☆☆</p>
                </div>
              </div>

              {/* Chess Quote of the Day */}
              <div className="bg-gradient-to-br from-gold-500/10 to-amber-500/10 backdrop-blur-sm rounded-xl p-4 border border-gold-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <Quote className="w-5 h-5 text-gold-400" />
                  <h3 className="font-semibold text-white">Quote of the Day</h3>
                </div>
                <blockquote className="text-white/80 text-sm italic mb-2">
                  "Chess is life in miniature. Chess is a struggle, chess battles."
                </blockquote>
                <p className="text-white/50 text-xs">— Garry Kasparov</p>
              </div>

              {/* Opening of the Day */}
              <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-sm rounded-xl p-4 border border-blue-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-5 h-5 text-blue-400" />
                  <h3 className="font-semibold text-white">Opening Spotlight</h3>
                </div>
                <div className="space-y-2">
                  <h4 className="text-white font-semibold">Sicilian Defense</h4>
                  <p className="text-white/70 text-sm">1. e4 c5</p>
                  <p className="text-white/60 text-xs line-clamp-3">
                    The Sicilian is the most popular and best-scoring response to White's first move.
                    It creates an asymmetrical position with excellent winning chances for Black.
                  </p>
                  <button className="text-blue-400 hover:text-blue-300 text-xs font-medium transition-colors">
                    Learn More →
                  </button>
                </div>
              </div>

              {/* Chess Tip */}
              <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-sm rounded-xl p-4 border border-green-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="w-5 h-5 text-green-400" />
                  <h3 className="font-semibold text-white">Quick Tip</h3>
                </div>
                <p className="text-white/80 text-sm">
                  <strong className="text-green-400">Control the Center:</strong> Knights and bishops
                  are most effective when they control central squares. Aim to occupy d4, d5, e4, and e5
                  early in the game.
                </p>
              </div>

              {/* Tactic of the Day */}
              <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 backdrop-blur-sm rounded-xl p-4 border border-red-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-5 h-5 text-red-400" />
                  <h3 className="font-semibold text-white">Tactic Spotlight</h3>
                </div>
                <div className="space-y-2">
                  <h4 className="text-white font-semibold text-sm">The Fork</h4>
                  <p className="text-white/70 text-xs">
                    A knight attacks two or more pieces simultaneously. The opponent can only save one,
                    usually resulting in material gain.
                  </p>
                  <div className="flex gap-2 pt-2">
                    <span className="px-2 py-1 bg-red-500/20 text-red-300 text-xs rounded-full border border-red-500/30">
                      Beginner
                    </span>
                    <span className="px-2 py-1 bg-white/5 text-white/60 text-xs rounded-full border border-white/10">
                      Knights
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
