import { Request, Response, NextFunction } from 'express';
import { query } from '../../config/database';
import { sendSuccess, sendPaginatedSuccess } from '../../utils/response';
import { ValidationError, NotFoundError } from '../../utils/errors';

/**
 * Get all blogs (admin view with all statuses)
 */
export const getAllBlogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 100;
    const search = req.query.search as string;
    const status = req.query.status as string;
    const author_id = req.query.author_id as string;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      whereClause += ` AND b.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (author_id) {
      whereClause += ` AND b.author_id = $${paramIndex}`;
      params.push(parseInt(author_id));
      paramIndex++;
    }

    if (search) {
      whereClause += ` AND (LOWER(b.title) LIKE LOWER($${paramIndex}) OR LOWER(b.content) LIKE LOWER($${paramIndex}))`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    const countResult = await query(
      `SELECT COUNT(*) FROM blogs b ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await query(
      `SELECT b.*, u.name as author_name, u.avatar as author_avatar
       FROM blogs b
       LEFT JOIN users u ON b.author_id = u.id
       ${whereClause}
       ORDER BY b.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    sendPaginatedSuccess(res, result.rows, { page, limit, total }, 'Blogs retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update blog (admin can update any blog)
 */
export const updateBlog = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const blogId = parseInt(req.params.id);
    if (!blogId) throw new ValidationError('Invalid blog ID');

    const {
      title, subtitle, content, cover_image, tags, status,
      meta_description, chess_category, difficulty_level
    } = req.body;

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      values.push(title);
    }
    if (subtitle !== undefined) {
      updates.push(`subtitle = $${paramIndex++}`);
      values.push(subtitle);
    }
    if (content !== undefined) {
      updates.push(`content = $${paramIndex++}`);
      values.push(content);
    }
    if (cover_image !== undefined) {
      updates.push(`cover_image = $${paramIndex++}`);
      values.push(cover_image);
    }
    if (tags !== undefined) {
      updates.push(`tags = $${paramIndex++}`);
      values.push(JSON.stringify(tags));
    }
    if (status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(status);

      // If publishing, set published_at
      if (status === 'published') {
        updates.push(`published_at = NOW()`);
      }
    }
    if (meta_description !== undefined) {
      updates.push(`meta_description = $${paramIndex++}`);
      values.push(meta_description);
    }
    if (chess_category !== undefined) {
      updates.push(`chess_category = $${paramIndex++}`);
      values.push(chess_category);
    }
    if (difficulty_level !== undefined) {
      updates.push(`difficulty_level = $${paramIndex++}`);
      values.push(difficulty_level);
    }

    if (updates.length === 0) {
      throw new ValidationError('No fields to update');
    }

    updates.push(`updated_at = NOW()`);
    values.push(blogId);

    const result = await query(
      `UPDATE blogs SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Blog not found');
    }

    sendSuccess(res, result.rows[0], 'Blog updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete blog (admin can delete any blog)
 */
export const deleteBlog = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const blogId = parseInt(req.params.id);
    if (!blogId) throw new ValidationError('Invalid blog ID');

    const result = await query(
      'DELETE FROM blogs WHERE id = $1 RETURNING id',
      [blogId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Blog not found');
    }

    sendSuccess(res, null, 'Blog deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Publish a blog
 */
export const publishBlog = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const blogId = parseInt(req.params.id);
    if (!blogId) throw new ValidationError('Invalid blog ID');

    const result = await query(
      `UPDATE blogs
       SET status = 'published', published_at = NOW(), updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [blogId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Blog not found');
    }

    sendSuccess(res, result.rows[0], 'Blog published successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Unpublish a blog (move to draft)
 */
export const unpublishBlog = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const blogId = parseInt(req.params.id);
    if (!blogId) throw new ValidationError('Invalid blog ID');

    const result = await query(
      `UPDATE blogs
       SET status = 'draft', updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [blogId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Blog not found');
    }

    sendSuccess(res, result.rows[0], 'Blog unpublished successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Archive a blog
 */
export const archiveBlog = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const blogId = parseInt(req.params.id);
    if (!blogId) throw new ValidationError('Invalid blog ID');

    const result = await query(
      `UPDATE blogs
       SET status = 'archived', updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [blogId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Blog not found');
    }

    sendSuccess(res, result.rows[0], 'Blog archived successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Approve author application (approve first pending blog and mark author as approved)
 */
export const approveAuthorApplication = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const blogId = parseInt(req.params.id);
    if (!blogId) throw new ValidationError('Invalid blog ID');

    // Get blog and author info
    const blogCheck = await query(
      'SELECT author_id, status FROM blogs WHERE id = $1',
      [blogId]
    );

    if (blogCheck.rows.length === 0) {
      throw new NotFoundError('Blog not found');
    }

    const { author_id, status } = blogCheck.rows[0];

    if (status !== 'pending') {
      throw new ValidationError('Blog is not in pending status');
    }

    // Update blog to published
    const blogResult = await query(
      `UPDATE blogs
       SET status = 'published', published_at = NOW(), updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [blogId]
    );

    // Mark author as approved
    await query(
      `UPDATE users
       SET is_approved_author = TRUE, author_approved_at = NOW()
       WHERE id = $1`,
      [author_id]
    );

    sendSuccess(res, blogResult.rows[0], 'Author application approved and blog published');
  } catch (error) {
    next(error);
  }
};

/**
 * Reject author application (delete pending blog)
 */
export const rejectAuthorApplication = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const blogId = parseInt(req.params.id);
    const { reason } = req.body;

    if (!blogId) throw new ValidationError('Invalid blog ID');

    // Get blog info
    const blogCheck = await query(
      'SELECT status FROM blogs WHERE id = $1',
      [blogId]
    );

    if (blogCheck.rows.length === 0) {
      throw new NotFoundError('Blog not found');
    }

    if (blogCheck.rows[0].status !== 'pending') {
      throw new ValidationError('Blog is not in pending status');
    }

    // Delete the blog
    await query('DELETE FROM blogs WHERE id = $1', [blogId]);

    // TODO: Send notification to author about rejection with reason

    sendSuccess(res, null, 'Author application rejected');
  } catch (error) {
    next(error);
  }
};
