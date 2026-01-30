import { query } from '../config/database';

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
  entity_name?: string; // joined from entity table
  entity_image?: string; // joined from entity table
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
  status: 'draft' | 'published' | 'archived';
  published_at?: Date;
  views_count: number;
  likes_count: number;
  comments_count: number;
  slug?: string;
  meta_description?: string;
  chess_category?: string;
  difficulty_level?: string;
  created_at: Date;
  updated_at: Date;
  // Joined fields
  author_name?: string;
  author_avatar?: string;
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
  status?: 'draft' | 'published' | 'pending';
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
  status?: 'draft' | 'published' | 'archived' | 'pending';
  meta_description?: string;
  chess_category?: string;
  difficulty_level?: string;
  chess_games?: Array<{ pgn: string; title?: string; description?: string }>;
  chess_puzzles?: Array<{ fen: string; solution_moves: string[]; hint?: string; difficulty?: string }>;
  linked_entities?: Array<{ entity_type: string; entity_id: number; description?: string }>;
}

// Generate URL-friendly slug from title
const generateSlug = (title: string, blogId?: number): string => {
  let slug = title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .substring(0, 200); // Limit length

  if (blogId) {
    slug = `${slug}-${blogId}`;
  }

  return slug;
};

// Calculate reading time based on content
const calculateReadTime = (content: string): number => {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
};

// ========================================
// Chess Games
// ========================================
export const saveBlogChessGames = async (blogId: number, games: any[]): Promise<void> => {
  // Delete existing
  await query('DELETE FROM blog_chess_games WHERE blog_id = $1', [blogId]);

  // Insert new (limit to 10 games max)
  const limitedGames = games.slice(0, 10);
  for (let i = 0; i < limitedGames.length; i++) {
    await query(
      `INSERT INTO blog_chess_games (blog_id, pgn, title, description, order_index)
       VALUES ($1, $2, $3, $4, $5)`,
      [blogId, limitedGames[i].pgn, limitedGames[i].title, limitedGames[i].description, i]
    );
  }
};

export const getBlogChessGames = async (blogId: number): Promise<ChessGame[]> => {
  const result = await query(
    'SELECT * FROM blog_chess_games WHERE blog_id = $1 ORDER BY order_index',
    [blogId]
  );
  return result.rows;
};

// ========================================
// Chess Puzzles
// ========================================
export const saveBlogChessPuzzles = async (blogId: number, puzzles: any[]): Promise<void> => {
  await query('DELETE FROM blog_chess_puzzles WHERE blog_id = $1', [blogId]);

  const limitedPuzzles = puzzles.slice(0, 5);
  for (let i = 0; i < limitedPuzzles.length; i++) {
    await query(
      `INSERT INTO blog_chess_puzzles (blog_id, fen, solution_moves, hint, difficulty, order_index)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [blogId, limitedPuzzles[i].fen, limitedPuzzles[i].solution_moves, limitedPuzzles[i].hint, limitedPuzzles[i].difficulty, i]
    );
  }
};

export const getBlogChessPuzzles = async (blogId: number): Promise<ChessPuzzle[]> => {
  const result = await query(
    'SELECT * FROM blog_chess_puzzles WHERE blog_id = $1 ORDER BY order_index',
    [blogId]
  );
  return result.rows;
};

// ========================================
// Linked Entities
// ========================================
export const saveBlogLinkedEntities = async (blogId: number, entities: any[]): Promise<void> => {
  await query('DELETE FROM blog_linked_entities WHERE blog_id = $1', [blogId]);

  const limitedEntities = entities.slice(0, 5);
  for (const entity of limitedEntities) {
    await query(
      `INSERT INTO blog_linked_entities (blog_id, entity_type, entity_id, description)
       VALUES ($1, $2, $3, $4)`,
      [blogId, entity.entity_type, entity.entity_id, entity.description]
    );
  }
};

export const getBlogLinkedEntities = async (blogId: number): Promise<LinkedEntity[]> => {
  const result = await query(
    `SELECT ble.*,
            CASE
              WHEN ble.entity_type = 'tournament' THEN t.name
              WHEN ble.entity_type = 'club' THEN c.name
              WHEN ble.entity_type = 'venue' THEN v.name
            END as entity_name,
            CASE
              WHEN ble.entity_type = 'tournament' THEN t.image
              WHEN ble.entity_type = 'club' THEN c.image
              WHEN ble.entity_type = 'venue' THEN v.images[1]
            END as entity_image
     FROM blog_linked_entities ble
     LEFT JOIN tournaments t ON ble.entity_type = 'tournament' AND ble.entity_id = t.id
     LEFT JOIN clubs c ON ble.entity_type = 'club' AND ble.entity_id = c.id
     LEFT JOIN venues v ON ble.entity_type = 'venue' AND ble.entity_id = v.id
     WHERE ble.blog_id = $1`,
    [blogId]
  );
  return result.rows;
};

export const createBlog = async (
  authorId: number,
  blogData: CreateBlogInput
): Promise<Blog> => {
  const readTime = calculateReadTime(blogData.content);

  // Check if user is an approved author
  const authorCheck = await query(
    'SELECT is_approved_author FROM users WHERE id = $1',
    [authorId]
  );

  const isApprovedAuthor = authorCheck.rows[0]?.is_approved_author || false;

  // If not approved, check if this is their first blog
  let finalStatus = blogData.status || 'draft';
  let publishedAt = blogData.status === 'published' ? new Date() : null;

  if (!isApprovedAuthor) {
    // Check if user has any published blogs
    const blogCount = await query(
      'SELECT COUNT(*) FROM blogs WHERE author_id = $1 AND status IN ($2, $3)',
      [authorId, 'published', 'pending']
    );

    const existingBlogs = parseInt(blogCount.rows[0].count);

    if (existingBlogs === 0) {
      // This is their first blog - force it to pending for approval
      finalStatus = 'pending';
      publishedAt = null;
    }
  }

  const result = await query(
    `INSERT INTO blogs (
      author_id, title, subtitle, content, cover_image, tags,
      read_time_minutes, status, published_at, meta_description,
      chess_category, difficulty_level,
      created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
    RETURNING *`,
    [
      authorId,
      blogData.title,
      blogData.subtitle,
      blogData.content,
      blogData.cover_image,
      blogData.tags || [],
      readTime,
      finalStatus,
      publishedAt,
      blogData.meta_description,
      blogData.chess_category,
      blogData.difficulty_level,
    ]
  );

  const blog = result.rows[0];

  // Update with slug including ID
  const slug = generateSlug(blogData.title, blog.id);
  await query('UPDATE blogs SET slug = $1 WHERE id = $2', [slug, blog.id]);
  blog.slug = slug;

  // Save chess content
  if (blogData.chess_games && blogData.chess_games.length > 0) {
    await saveBlogChessGames(blog.id, blogData.chess_games);
  }
  if (blogData.chess_puzzles && blogData.chess_puzzles.length > 0) {
    await saveBlogChessPuzzles(blog.id, blogData.chess_puzzles);
  }
  if (blogData.linked_entities && blogData.linked_entities.length > 0) {
    await saveBlogLinkedEntities(blog.id, blogData.linked_entities);
  }

  return blog;
};

export const updateBlog = async (
  blogId: number,
  authorId: number,
  blogData: UpdateBlogInput
): Promise<Blog> => {
  // Check ownership
  const ownerCheck = await query('SELECT author_id FROM blogs WHERE id = $1', [blogId]);
  if (ownerCheck.rows.length === 0) {
    throw new Error('Blog not found');
  }
  if (ownerCheck.rows[0].author_id !== authorId) {
    throw new Error('Unauthorized');
  }

  const updates: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (blogData.title !== undefined) {
    updates.push(`title = $${paramCount++}`);
    values.push(blogData.title);
  }
  if (blogData.subtitle !== undefined) {
    updates.push(`subtitle = $${paramCount++}`);
    values.push(blogData.subtitle);
  }
  if (blogData.content !== undefined) {
    updates.push(`content = $${paramCount++}`);
    values.push(blogData.content);
    const readTime = calculateReadTime(blogData.content);
    updates.push(`read_time_minutes = $${paramCount++}`);
    values.push(readTime);
  }
  if (blogData.cover_image !== undefined) {
    updates.push(`cover_image = $${paramCount++}`);
    values.push(blogData.cover_image);
  }
  if (blogData.tags !== undefined) {
    updates.push(`tags = $${paramCount++}`);
    values.push(blogData.tags);
  }
  if (blogData.status !== undefined) {
    updates.push(`status = $${paramCount++}`);
    values.push(blogData.status);

    // Set published_at when changing to published
    if (blogData.status === 'published') {
      const currentStatus = await query('SELECT status, published_at FROM blogs WHERE id = $1', [blogId]);
      if (currentStatus.rows[0].status !== 'published' && !currentStatus.rows[0].published_at) {
        updates.push(`published_at = NOW()`);
      }
    }
  }
  if (blogData.meta_description !== undefined) {
    updates.push(`meta_description = $${paramCount++}`);
    values.push(blogData.meta_description);
  }
  if (blogData.chess_category !== undefined) {
    updates.push(`chess_category = $${paramCount++}`);
    values.push(blogData.chess_category);
  }
  if (blogData.difficulty_level !== undefined) {
    updates.push(`difficulty_level = $${paramCount++}`);
    values.push(blogData.difficulty_level);
  }

  updates.push(`updated_at = NOW()`);

  // Update slug if title changed
  if (blogData.title) {
    const slug = generateSlug(blogData.title, blogId);
    updates.push(`slug = $${paramCount++}`);
    values.push(slug);
  }

  values.push(blogId);

  const result = await query(
    `UPDATE blogs SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
    values
  );

  // Update chess content if provided
  if (blogData.chess_games !== undefined) {
    await saveBlogChessGames(blogId, blogData.chess_games);
  }
  if (blogData.chess_puzzles !== undefined) {
    await saveBlogChessPuzzles(blogId, blogData.chess_puzzles);
  }
  if (blogData.linked_entities !== undefined) {
    await saveBlogLinkedEntities(blogId, blogData.linked_entities);
  }

  return result.rows[0];
};

export const deleteBlog = async (blogId: number, authorId: number): Promise<void> => {
  const result = await query(
    'DELETE FROM blogs WHERE id = $1 AND author_id = $2 RETURNING id',
    [blogId, authorId]
  );

  if (result.rows.length === 0) {
    throw new Error('Blog not found or unauthorized');
  }
};

export const getBlogById = async (blogId: number, incrementViews = false): Promise<Blog | null> => {
  if (incrementViews) {
    await query('UPDATE blogs SET views_count = views_count + 1 WHERE id = $1', [blogId]);
  }

  const result = await query(
    `SELECT b.*, u.name as author_name, u.avatar as author_avatar
     FROM blogs b
     JOIN users u ON b.author_id = u.id
     WHERE b.id = $1`,
    [blogId]
  );

  if (result.rows.length === 0) return null;

  const blog = result.rows[0];

  // Fetch chess content
  blog.chess_games = await getBlogChessGames(blogId);
  blog.chess_puzzles = await getBlogChessPuzzles(blogId);
  blog.linked_entities = await getBlogLinkedEntities(blogId);

  return blog;
};

export const getBlogBySlug = async (slug: string, incrementViews = false): Promise<Blog | null> => {
  if (incrementViews) {
    await query('UPDATE blogs SET views_count = views_count + 1 WHERE slug = $1', [slug]);
  }

  const result = await query(
    `SELECT b.*, u.name as author_name, u.avatar as author_avatar
     FROM blogs b
     JOIN users u ON b.author_id = u.id
     WHERE b.slug = $1`,
    [slug]
  );

  if (result.rows.length === 0) return null;

  const blog = result.rows[0];

  // Fetch chess content
  blog.chess_games = await getBlogChessGames(blog.id);
  blog.chess_puzzles = await getBlogChessPuzzles(blog.id);
  blog.linked_entities = await getBlogLinkedEntities(blog.id);

  return blog;
};

export const getBlogs = async (filters: {
  status?: 'draft' | 'published' | 'archived';
  authorId?: number;
  tags?: string[];
  search?: string;
  chess_category?: string;
  difficulty_level?: string;
  page?: number;
  limit?: number;
}): Promise<{ blogs: Blog[]; total: number }> => {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (filters.status) {
    conditions.push(`b.status = $${paramCount++}`);
    values.push(filters.status);
  }

  if (filters.authorId) {
    conditions.push(`b.author_id = $${paramCount++}`);
    values.push(filters.authorId);
  }

  if (filters.tags && filters.tags.length > 0) {
    conditions.push(`b.tags && $${paramCount++}`);
    values.push(filters.tags);
  }

  if (filters.search) {
    conditions.push(`(b.title ILIKE $${paramCount} OR b.subtitle ILIKE $${paramCount} OR b.content ILIKE $${paramCount})`);
    values.push(`%${filters.search}%`);
    paramCount++;
  }

  if (filters.chess_category) {
    conditions.push(`b.chess_category = $${paramCount++}`);
    values.push(filters.chess_category);
  }

  if (filters.difficulty_level) {
    conditions.push(`b.difficulty_level = $${paramCount++}`);
    values.push(filters.difficulty_level);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Get total count
  const countResult = await query(
    `SELECT COUNT(*) FROM blogs b ${whereClause}`,
    values
  );
  const total = parseInt(countResult.rows[0].count);

  // Get blogs
  values.push(limit, offset);
  const result = await query(
    `SELECT b.*, u.name as author_name, u.avatar as author_avatar
     FROM blogs b
     JOIN users u ON b.author_id = u.id
     ${whereClause}
     ORDER BY b.published_at DESC NULLS LAST, b.created_at DESC
     LIMIT $${paramCount++} OFFSET $${paramCount}`,
    values
  );

  return { blogs: result.rows, total };
};

export const getUserBlogs = async (authorId: number): Promise<Blog[]> => {
  const result = await query(
    `SELECT b.*, u.name as author_name, u.avatar as author_avatar
     FROM blogs b
     JOIN users u ON b.author_id = u.id
     WHERE b.author_id = $1
     ORDER BY b.created_at DESC`,
    [authorId]
  );

  return result.rows;
};

export const likeBlog = async (blogId: number, userId: number): Promise<void> => {
  await query(
    'INSERT INTO blog_likes (blog_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [blogId, userId]
  );
};

export const unlikeBlog = async (blogId: number, userId: number): Promise<void> => {
  await query('DELETE FROM blog_likes WHERE blog_id = $1 AND user_id = $2', [blogId, userId]);
};

export const hasUserLikedBlog = async (blogId: number, userId: number): Promise<boolean> => {
  const result = await query(
    'SELECT 1 FROM blog_likes WHERE blog_id = $1 AND user_id = $2',
    [blogId, userId]
  );
  return result.rows.length > 0;
};

export const getBlogComments = async (blogId: number): Promise<any[]> => {
  const result = await query(
    `SELECT bc.*, u.name as user_name, u.avatar as user_avatar
     FROM blog_comments bc
     JOIN users u ON bc.user_id = u.id
     WHERE bc.blog_id = $1
     ORDER BY bc.created_at ASC`,
    [blogId]
  );

  return result.rows;
};

export const addBlogComment = async (
  blogId: number,
  userId: number,
  content: string,
  parentCommentId?: number
): Promise<any> => {
  const result = await query(
    `INSERT INTO blog_comments (blog_id, user_id, content, parent_comment_id, created_at, updated_at)
     VALUES ($1, $2, $3, $4, NOW(), NOW())
     RETURNING *`,
    [blogId, userId, content, parentCommentId || null]
  );

  return result.rows[0];
};

export const deleteBlogComment = async (
  commentId: number,
  userId: number
): Promise<void> => {
  await query(
    'DELETE FROM blog_comments WHERE id = $1 AND user_id = $2',
    [commentId, userId]
  );
};
