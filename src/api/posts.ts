import apiClient from './client';

export interface Post {
  id: number;
  user_id: number;
  user_name: string;
  user_avatar: string | null;
  user_chess_title?: string | null;
  user_chess_title_verified?: boolean;
  content: string;
  image: string | null;
  images: string[] | null;
  pgn: string | null;
  hashtags?: string[];
  created_at: string;
  updated_at: string;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
  linked_entity_type?: string | null;
  linked_entity_id?: number | null;
  linked_entity_name?: string | null;
  linked_entity_image?: string | null;
}

export interface Hashtag {
  tag: string;
  usage_count: number;
  last_used_at: string;
}

export interface PostComment {
  id: number;
  post_id: number;
  user_id: number;
  user_name: string;
  user_avatar: string | null;
  user_chess_title?: string | null;
  user_chess_title_verified?: boolean;
  content: string;
  created_at: string;
}

export interface CreatePostInput {
  content: string;
  image?: string;
  images?: string[];
  pgn?: string;
  linked_entity_type?: 'tournament' | 'club' | 'challenge';
  linked_entity_id?: number;
}

export interface CreateCommentInput {
  content: string;
}

export const postsApi = {
  // Get all posts (paginated)
  getPosts: async (limit: number = 50, offset: number = 0) => {
    return apiClient.get(`/posts?limit=${limit}&offset=${offset}`);
  },

  // Get posts by user ID
  getPostsByUserId: async (userId: number, limit: number = 20, offset: number = 0) => {
    return apiClient.get(`/posts/user/${userId}?limit=${limit}&offset=${offset}`);
  },

  // Get a single post by ID
  getPost: async (postId: number) => {
    return apiClient.get(`/posts/${postId}`);
  },

  // Create a new post
  createPost: async (data: CreatePostInput) => {
    return apiClient.post('/posts', data);
  },

  // Update a post
  updatePost: async (postId: number, data: CreatePostInput) => {
    return apiClient.put(`/posts/${postId}`, data);
  },

  // Delete a post
  deletePost: async (postId: number) => {
    return apiClient.delete(`/posts/${postId}`);
  },

  // Like a post
  likePost: async (postId: number) => {
    return apiClient.post(`/posts/${postId}/like`);
  },

  // Unlike a post
  unlikePost: async (postId: number) => {
    return apiClient.delete(`/posts/${postId}/like`);
  },

  // Get comments for a post
  getComments: async (postId: number) => {
    return apiClient.get(`/posts/${postId}/comments`);
  },

  // Add a comment to a post
  addComment: async (postId: number, data: CreateCommentInput) => {
    return apiClient.post(`/posts/${postId}/comments`, data);
  },

  // Delete a comment
  deleteComment: async (postId: number, commentId: number) => {
    return apiClient.delete(`/posts/${postId}/comments/${commentId}`);
  },

  // ===== HASHTAG METHODS =====

  // Get trending hashtags
  getTrendingHashtags: async (limit: number = 20) => {
    return apiClient.get(`/posts/hashtags/trending?limit=${limit}`);
  },

  // Get posts by hashtag
  getPostsByHashtag: async (hashtag: string, limit: number = 50, offset: number = 0) => {
    // Remove # if present
    const cleanHashtag = hashtag.replace(/^#/, '');
    return apiClient.get(`/posts/hashtag/${cleanHashtag}?limit=${limit}&offset=${offset}`);
  },

  // Search hashtags
  searchHashtags: async (query: string, limit: number = 10) => {
    return apiClient.get(`/posts/hashtags/search?q=${encodeURIComponent(query)}&limit=${limit}`);
  },

  // Get hashtags used by a user
  getUserHashtags: async (userId: number, limit: number = 50) => {
    return apiClient.get(`/posts/hashtags/user/${userId}?limit=${limit}`);
  },
};
