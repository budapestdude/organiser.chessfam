import apiClient from './client';

export interface ChessGame {
  id: number;
  blog_id: number;
  pgn: string;
  title?: string;
  description?: string;
  order_index: number;
}

export interface ChessPuzzle {
  id: number;
  blog_id: number;
  fen: string;
  solution_moves: string[];
  hint?: string;
  difficulty?: string;
  order_index: number;
}

export interface LinkedEntity {
  id: number;
  blog_id: number;
  entity_type: string;
  entity_id: number;
  description?: string;
  entity_name?: string;
  entity_image?: string;
}

export interface Blog {
  id: number;
  author_id: number;
  title: string;
  subtitle?: string;
  content: string;
  cover_image?: string;
  tags?: string[];
  read_time_minutes?: number;
  status: 'draft' | 'published' | 'archived' | 'pending';
  published_at?: string;
  views_count: number;
  likes_count: number;
  comments_count: number;
  slug?: string;
  meta_description?: string;
  chess_category?: string;
  difficulty_level?: string;
  created_at: string;
  updated_at: string;
  author_name?: string;
  author_avatar?: string;
  hasLiked?: boolean;
  // Chess content
  chess_games?: ChessGame[];
  chess_puzzles?: ChessPuzzle[];
  linked_entities?: LinkedEntity[];
}

export interface CreateBlogInput {
  title: string;
  subtitle?: string;
  content: string;
  cover_image?: string;
  tags?: string[];
  status?: 'draft' | 'published';
  meta_description?: string;
  chess_category?: string;
  difficulty_level?: string;
  chess_games?: Array<{ pgn: string; title?: string; description?: string }>;
  chess_puzzles?: Array<{ fen: string; solution_moves: string[]; hint?: string; difficulty?: string }>;
  linked_entities?: Array<{ entity_type: string; entity_id: number; description?: string }>;
}

export interface UpdateBlogInput {
  title?: string;
  subtitle?: string;
  content?: string;
  cover_image?: string;
  tags?: string[];
  status?: 'draft' | 'published' | 'archived';
  meta_description?: string;
  chess_category?: string;
  difficulty_level?: string;
  chess_games?: Array<{ pgn: string; title?: string; description?: string }>;
  chess_puzzles?: Array<{ fen: string; solution_moves: string[]; hint?: string; difficulty?: string }>;
  linked_entities?: Array<{ entity_type: string; entity_id: number; description?: string }>;
}

export interface BlogComment {
  id: number;
  blog_id: number;
  user_id: number;
  parent_comment_id?: number;
  content: string;
  created_at: string;
  updated_at: string;
  user_name: string;
  user_avatar?: string;
}

export const blogsApi = {
  // Get all blogs (with filters)
  getBlogs: async (params?: {
    status?: 'draft' | 'published' | 'archived';
    author_id?: number;
    tags?: string[];
    search?: string;
    chess_category?: string;
    difficulty_level?: string;
    page?: number;
    limit?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.author_id) queryParams.append('author_id', params.author_id.toString());
    if (params?.tags?.length) queryParams.append('tags', params.tags.join(','));
    if (params?.search) queryParams.append('search', params.search);
    if (params?.chess_category) queryParams.append('chess_category', params.chess_category);
    if (params?.difficulty_level) queryParams.append('difficulty_level', params.difficulty_level);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const response = await apiClient.get(`/blogs?${queryParams.toString()}`);
    return response.data;
  },

  // Get single blog by ID
  getBlogById: async (id: number, incrementViews = false) => {
    const response = await apiClient.get(`/blogs/${id}?increment_views=${incrementViews}`);
    return response.data;
  },

  // Get single blog by slug
  getBlogBySlug: async (slug: string, incrementViews = false) => {
    const response = await apiClient.get(`/blogs/slug/${slug}?increment_views=${incrementViews}`);
    return response.data;
  },

  // Get current user's blogs
  getUserBlogs: async () => {
    const response = await apiClient.get('/blogs/user/my-blogs');
    return response.data;
  },

  // Create new blog
  createBlog: async (blogData: CreateBlogInput) => {
    const response = await apiClient.post('/blogs', blogData);
    return response.data;
  },

  // Update existing blog
  updateBlog: async (id: number, blogData: UpdateBlogInput) => {
    const response = await apiClient.put(`/blogs/${id}`, blogData);
    return response.data;
  },

  // Delete blog
  deleteBlog: async (id: number) => {
    const response = await apiClient.delete(`/blogs/${id}`);
    return response.data;
  },

  // Like blog
  likeBlog: async (id: number) => {
    const response = await apiClient.post(`/blogs/${id}/like`);
    return response.data;
  },

  // Unlike blog
  unlikeBlog: async (id: number) => {
    const response = await apiClient.delete(`/blogs/${id}/like`);
    return response.data;
  },

  // Get blog comments
  getComments: async (id: number) => {
    const response = await apiClient.get(`/blogs/${id}/comments`);
    return response.data;
  },

  // Add comment to blog
  addComment: async (id: number, content: string, parentCommentId?: number) => {
    const response = await apiClient.post(`/blogs/${id}/comments`, {
      content,
      parent_comment_id: parentCommentId,
    });
    return response.data;
  },

  // Delete comment
  deleteComment: async (blogId: number, commentId: number) => {
    const response = await apiClient.delete(`/blogs/${blogId}/comments/${commentId}`);
    return response.data;
  },
};
