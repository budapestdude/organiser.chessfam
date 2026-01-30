import { query } from '../config/database';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors';

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

export const getPosts = async (userId?: number, limit: number = 50, offset: number = 0): Promise<Post[]> => {
  const result = await query(
    `SELECT
      p.*,
      u.name as user_name,
      u.avatar as user_avatar,
      u.chess_title as user_chess_title,
      u.chess_title_verified as user_chess_title_verified,
      (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as likes_count,
      (SELECT COUNT(*) FROM post_comments WHERE post_id = p.id) as comments_count,
      ${userId ? `EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = $3) as is_liked` : 'false as is_liked'},
      CASE
        WHEN p.linked_entity_type = 'tournament' THEN t.name
        WHEN p.linked_entity_type = 'club' THEN c.name
        WHEN p.linked_entity_type = 'challenge' THEN CONCAT(cu.name, ' challenges you')
        ELSE NULL
      END as linked_entity_name,
      CASE
        WHEN p.linked_entity_type = 'tournament' THEN t.image
        WHEN p.linked_entity_type = 'club' THEN c.image
        ELSE NULL
      END as linked_entity_image
     FROM posts p
     JOIN users u ON p.user_id = u.id
     LEFT JOIN tournaments t ON p.linked_entity_type = 'tournament' AND p.linked_entity_id = t.id
     LEFT JOIN clubs c ON p.linked_entity_type = 'club' AND p.linked_entity_id = c.id
     LEFT JOIN challenges ch ON p.linked_entity_type = 'challenge' AND p.linked_entity_id = ch.id
     LEFT JOIN users cu ON ch.challenger_id = cu.id
     ORDER BY p.created_at DESC
     LIMIT $1 OFFSET $2`,
    userId ? [limit, offset, userId] : [limit, offset]
  );

  return result.rows;
};

export const getPostsByUserId = async (targetUserId: number, currentUserId?: number, limit: number = 20, offset: number = 0): Promise<Post[]> => {
  const result = await query(
    `SELECT
      p.*,
      u.name as user_name,
      u.avatar as user_avatar,
      u.chess_title as user_chess_title,
      u.chess_title_verified as user_chess_title_verified,
      (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as likes_count,
      (SELECT COUNT(*) FROM post_comments WHERE post_id = p.id) as comments_count,
      ${currentUserId ? `EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = $4) as is_liked` : 'false as is_liked'},
      CASE
        WHEN p.linked_entity_type = 'tournament' THEN t.name
        WHEN p.linked_entity_type = 'club' THEN c.name
        WHEN p.linked_entity_type = 'challenge' THEN CONCAT(cu.name, ' challenges you')
        ELSE NULL
      END as linked_entity_name,
      CASE
        WHEN p.linked_entity_type = 'tournament' THEN t.image
        WHEN p.linked_entity_type = 'club' THEN c.image
        ELSE NULL
      END as linked_entity_image
     FROM posts p
     JOIN users u ON p.user_id = u.id
     LEFT JOIN tournaments t ON p.linked_entity_type = 'tournament' AND p.linked_entity_id = t.id
     LEFT JOIN clubs c ON p.linked_entity_type = 'club' AND p.linked_entity_id = c.id
     LEFT JOIN challenges ch ON p.linked_entity_type = 'challenge' AND p.linked_entity_id = ch.id
     LEFT JOIN users cu ON ch.challenger_id = cu.id
     WHERE p.user_id = $1
     ORDER BY p.created_at DESC
     LIMIT $2 OFFSET $3`,
    currentUserId ? [targetUserId, limit, offset, currentUserId] : [targetUserId, limit, offset]
  );

  return result.rows;
};

export const getPostById = async (postId: number, userId?: number): Promise<Post> => {
  const result = await query(
    `SELECT
      p.*,
      u.name as user_name,
      u.avatar as user_avatar,
      (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as likes_count,
      (SELECT COUNT(*) FROM post_comments WHERE post_id = p.id) as comments_count,
      ${userId ? `EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = $2) as is_liked` : 'false as is_liked'}
     FROM posts p
     JOIN users u ON p.user_id = u.id
     WHERE p.id = $1`,
    userId ? [postId, userId] : [postId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Post not found');
  }

  return result.rows[0];
};

export const createPost = async (
  userId: number,
  content: string,
  image?: string,
  linkedEntityType?: string,
  linkedEntityId?: number,
  pgn?: string,
  images?: string[]
): Promise<Post> => {
  if (!content || content.trim().length === 0) {
    throw new ValidationError('Post content cannot be empty');
  }

  if (content.length > 5000) {
    throw new ValidationError('Post content cannot exceed 5000 characters');
  }

  // Validate linked entity type if provided
  if (linkedEntityType && !['tournament', 'club', 'challenge'].includes(linkedEntityType)) {
    throw new ValidationError('Invalid linked entity type');
  }

  // If linked entity type is provided, entity ID must also be provided
  if (linkedEntityType && !linkedEntityId) {
    throw new ValidationError('Linked entity ID is required when entity type is provided');
  }

  // Limit images array to 4 items
  if (images && images.length > 4) {
    throw new ValidationError('Maximum 4 images allowed per post');
  }

  const result = await query(
    `INSERT INTO posts (user_id, content, image, images, linked_entity_type, linked_entity_id, pgn, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
     RETURNING *`,
    [userId, content.trim(), image || null, images || null, linkedEntityType || null, linkedEntityId || null, pgn || null]
  );

  return getPostById(result.rows[0].id, userId);
};

export const updatePost = async (postId: number, userId: number, content: string, image?: string): Promise<Post> => {
  // Check if post exists and belongs to user
  const existingPost = await query(
    'SELECT user_id FROM posts WHERE id = $1',
    [postId]
  );

  if (existingPost.rows.length === 0) {
    throw new NotFoundError('Post not found');
  }

  if (existingPost.rows[0].user_id !== userId) {
    throw new ForbiddenError('You can only edit your own posts');
  }

  if (!content || content.trim().length === 0) {
    throw new ValidationError('Post content cannot be empty');
  }

  if (content.length > 5000) {
    throw new ValidationError('Post content cannot exceed 5000 characters');
  }

  await query(
    `UPDATE posts SET content = $1, image = $2, updated_at = NOW()
     WHERE id = $3`,
    [content.trim(), image || null, postId]
  );

  return getPostById(postId, userId);
};

export const deletePost = async (postId: number, userId: number, isAdmin: boolean = false): Promise<void> => {
  const existingPost = await query(
    'SELECT user_id FROM posts WHERE id = $1',
    [postId]
  );

  if (existingPost.rows.length === 0) {
    throw new NotFoundError('Post not found');
  }

  if (!isAdmin && existingPost.rows[0].user_id !== userId) {
    throw new ForbiddenError('You can only delete your own posts');
  }

  await query('DELETE FROM posts WHERE id = $1', [postId]);
};

export const likePost = async (postId: number, userId: number): Promise<void> => {
  // Check if post exists
  const postExists = await query('SELECT id FROM posts WHERE id = $1', [postId]);
  if (postExists.rows.length === 0) {
    throw new NotFoundError('Post not found');
  }

  // Insert like (will fail silently if already liked due to UNIQUE constraint)
  try {
    await query(
      'INSERT INTO post_likes (post_id, user_id, created_at) VALUES ($1, $2, NOW())',
      [postId, userId]
    );
  } catch (error: any) {
    // Ignore duplicate key errors (already liked)
    if (!error.message.includes('duplicate key')) {
      throw error;
    }
  }
};

export const unlikePost = async (postId: number, userId: number): Promise<void> => {
  await query(
    'DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2',
    [postId, userId]
  );
};

export const getPostComments = async (postId: number): Promise<PostComment[]> => {
  const result = await query(
    `SELECT
      pc.*,
      u.name as user_name,
      u.avatar as user_avatar,
      u.chess_title as user_chess_title,
      u.chess_title_verified as user_chess_title_verified
     FROM post_comments pc
     JOIN users u ON pc.user_id = u.id
     WHERE pc.post_id = $1
     ORDER BY pc.created_at ASC`,
    [postId]
  );

  return result.rows;
};

export const addComment = async (postId: number, userId: number, content: string): Promise<PostComment> => {
  // Check if post exists
  const postExists = await query('SELECT id FROM posts WHERE id = $1', [postId]);
  if (postExists.rows.length === 0) {
    throw new NotFoundError('Post not found');
  }

  if (!content || content.trim().length === 0) {
    throw new ValidationError('Comment content cannot be empty');
  }

  if (content.length > 2000) {
    throw new ValidationError('Comment content cannot exceed 2000 characters');
  }

  const result = await query(
    `INSERT INTO post_comments (post_id, user_id, content, created_at, updated_at)
     VALUES ($1, $2, $3, NOW(), NOW())
     RETURNING *`,
    [postId, userId, content.trim()]
  );

  // Get comment with user info
  const comment = await query(
    `SELECT
      pc.*,
      u.name as user_name,
      u.avatar as user_avatar
     FROM post_comments pc
     JOIN users u ON pc.user_id = u.id
     WHERE pc.id = $1`,
    [result.rows[0].id]
  );

  return comment.rows[0];
};

export const deleteComment = async (commentId: number, userId: number, isAdmin: boolean = false): Promise<void> => {
  const existingComment = await query(
    'SELECT user_id FROM post_comments WHERE id = $1',
    [commentId]
  );

  if (existingComment.rows.length === 0) {
    throw new NotFoundError('Comment not found');
  }

  if (!isAdmin && existingComment.rows[0].user_id !== userId) {
    throw new ForbiddenError('You can only delete your own comments');
  }

  await query('DELETE FROM post_comments WHERE id = $1', [commentId]);
};

// ===== HASHTAG FUNCTIONS =====

/**
 * Get trending hashtags (most used in last 7 days)
 */
export const getTrendingHashtags = async (limit: number = 20): Promise<Hashtag[]> => {
  const result = await query(
    `SELECT tag, usage_count, last_used_at
     FROM hashtags
     WHERE last_used_at >= NOW() - INTERVAL '7 days'
     ORDER BY usage_count DESC, last_used_at DESC
     LIMIT $1`,
    [limit]
  );

  return result.rows;
};

/**
 * Get posts by hashtag
 */
export const getPostsByHashtag = async (
  hashtag: string,
  userId?: number,
  limit: number = 50,
  offset: number = 0
): Promise<Post[]> => {
  const normalizedTag = hashtag.toLowerCase().replace(/^#/, '');

  const result = await query(
    `SELECT
      p.*,
      u.name as user_name,
      u.avatar as user_avatar,
      u.chess_title as user_chess_title,
      u.chess_title_verified as user_chess_title_verified,
      (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as likes_count,
      (SELECT COUNT(*) FROM post_comments WHERE post_id = p.id) as comments_count,
      ${userId ? `EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = $4) as is_liked` : 'false as is_liked'},
      CASE
        WHEN p.linked_entity_type = 'tournament' THEN t.name
        WHEN p.linked_entity_type = 'club' THEN c.name
        WHEN p.linked_entity_type = 'venue' THEN v.venue_name
        ELSE NULL
      END as linked_entity_name,
      CASE
        WHEN p.linked_entity_type = 'tournament' THEN t.image
        WHEN p.linked_entity_type = 'club' THEN c.image
        WHEN p.linked_entity_type = 'venue' THEN v.image_url
        ELSE NULL
      END as linked_entity_image
     FROM posts p
     JOIN users u ON p.user_id = u.id
     LEFT JOIN tournaments t ON p.linked_entity_type = 'tournament' AND p.linked_entity_id = t.id
     LEFT JOIN clubs c ON p.linked_entity_type = 'club' AND p.linked_entity_id = c.id
     LEFT JOIN venues v ON p.linked_entity_type = 'venue' AND p.linked_entity_id = v.id
     WHERE $1 = ANY(p.hashtags)
     ORDER BY p.created_at DESC
     LIMIT $2 OFFSET $3`,
    userId ? [normalizedTag, limit, offset, userId] : [normalizedTag, limit, offset]
  );

  return result.rows;
};

/**
 * Search hashtags by prefix
 */
export const searchHashtags = async (prefix: string, limit: number = 10): Promise<Hashtag[]> => {
  const normalizedPrefix = prefix.toLowerCase().replace(/^#/, '');

  const result = await query(
    `SELECT tag, usage_count, last_used_at
     FROM hashtags
     WHERE tag LIKE $1
     ORDER BY usage_count DESC, tag ASC
     LIMIT $2`,
    [`${normalizedPrefix}%`, limit]
  );

  return result.rows;
};

/**
 * Get all hashtags used by a specific user
 */
export const getUserHashtags = async (userId: number, limit: number = 50): Promise<Hashtag[]> => {
  const result = await query(
    `SELECT
      unnest(hashtags) as tag,
      COUNT(*) as usage_count,
      MAX(created_at) as last_used_at
     FROM posts
     WHERE user_id = $1
       AND hashtags IS NOT NULL
       AND array_length(hashtags, 1) > 0
     GROUP BY tag
     ORDER BY usage_count DESC, last_used_at DESC
     LIMIT $2`,
    [userId, limit]
  );

  return result.rows;
};
