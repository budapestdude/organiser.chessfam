import { Request, Response, NextFunction } from 'express';
import * as blogsService from '../services/blogsService';
import * as blogAccessService from '../services/blogAccessService';
import { Chess } from 'chess.js';

// PGN validation helper
const validatePgn = (pgn: string): boolean => {
  try {
    const chess = new Chess();
    chess.loadPgn(pgn);
    return true;
  } catch {
    return false;
  }
};

// FEN validation helper
const validateFen = (fen: string): boolean => {
  try {
    new Chess(fen);
    return true;
  } catch {
    return false;
  }
};

export const createBlog = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Validate chess games
    if (req.body.chess_games) {
      for (const game of req.body.chess_games) {
        if (!validatePgn(game.pgn)) {
          return res.status(400).json({
            error: `Invalid PGN format in game: ${game.title || 'Untitled'}`
          });
        }
      }
    }

    // Validate chess puzzles
    if (req.body.chess_puzzles) {
      for (const puzzle of req.body.chess_puzzles) {
        if (!validateFen(puzzle.fen)) {
          return res.status(400).json({ error: 'Invalid FEN format in puzzle' });
        }
        if (!puzzle.solution_moves || puzzle.solution_moves.length === 0) {
          return res.status(400).json({ error: 'Puzzle must have solution moves' });
        }
      }
    }

    const blog = await blogsService.createBlog(userId, req.body);
    res.status(201).json({ success: true, data: blog });
  } catch (error) {
    next(error);
  }
};

export const updateBlog = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Validate chess games
    if (req.body.chess_games) {
      for (const game of req.body.chess_games) {
        if (!validatePgn(game.pgn)) {
          return res.status(400).json({
            error: `Invalid PGN format in game: ${game.title || 'Untitled'}`
          });
        }
      }
    }

    // Validate chess puzzles
    if (req.body.chess_puzzles) {
      for (const puzzle of req.body.chess_puzzles) {
        if (!validateFen(puzzle.fen)) {
          return res.status(400).json({ error: 'Invalid FEN format in puzzle' });
        }
        if (!puzzle.solution_moves || puzzle.solution_moves.length === 0) {
          return res.status(400).json({ error: 'Puzzle must have solution moves' });
        }
      }
    }

    const blogId = parseInt(req.params.id);
    const blog = await blogsService.updateBlog(blogId, userId, req.body);
    res.json({ success: true, data: blog });
  } catch (error: any) {
    if (error.message === 'Blog not found') {
      return res.status(404).json({ error: 'Blog not found' });
    }
    if (error.message === 'Unauthorized') {
      return res.status(403).json({ error: 'You can only edit your own blogs' });
    }
    next(error);
  }
};

export const deleteBlog = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const blogId = parseInt(req.params.id);
    await blogsService.deleteBlog(blogId, userId);
    res.json({ success: true, message: 'Blog deleted successfully' });
  } catch (error: any) {
    if (error.message === 'Blog not found or unauthorized') {
      return res.status(404).json({ error: 'Blog not found or you do not have permission to delete it' });
    }
    next(error);
  }
};

export const getBlogById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const blogId = parseInt(req.params.id);
    const incrementViews = req.query.increment_views === 'true';
    const userId = (req as any).user?.userId || null;

    // Get blog with access control
    const { blog, accessResult, content } = await blogAccessService.getBlogWithAccess(
      blogId,
      userId
    );

    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    // Increment views if requested
    if (incrementViews) {
      await blogsService.getBlogById(blogId, true);
    }

    // Check if user has liked this blog
    let hasLiked = false;
    if (userId) {
      hasLiked = await blogsService.hasUserLikedBlog(blogId, userId);
    }

    res.json({
      success: true,
      data: {
        ...blog,
        content, // Full or preview content based on access
        hasLiked,
        accessInfo: {
          hasAccess: accessResult.hasAccess,
          accessLevel: accessResult.accessLevel,
          requiresSubscription: accessResult.requiresSubscription,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getBlogBySlug = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const slug = req.params.slug;
    const incrementViews = req.query.increment_views === 'true';
    const userId = (req as any).user?.userId || null;

    // First get the blog to find its ID
    const blogBasic = await blogsService.getBlogBySlug(slug, incrementViews);

    if (!blogBasic) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    // Now get blog with access control
    const { blog, accessResult, content } = await blogAccessService.getBlogWithAccess(
      blogBasic.id,
      userId
    );

    // Check if user has liked this blog
    let hasLiked = false;
    if (userId) {
      hasLiked = await blogsService.hasUserLikedBlog(blogBasic.id, userId);
    }

    res.json({
      success: true,
      data: {
        ...blog,
        content, // Full or preview content based on access
        hasLiked,
        accessInfo: {
          hasAccess: accessResult.hasAccess,
          accessLevel: accessResult.accessLevel,
          requiresSubscription: accessResult.requiresSubscription,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getBlogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, author_id, tags, search, chess_category, difficulty_level, page, limit } = req.query;

    const filters: any = {};

    if (status) {
      filters.status = status as string;
    } else {
      // Default to only published blogs for public view
      filters.status = 'published';
    }

    if (author_id) {
      filters.authorId = parseInt(author_id as string);
    }

    if (tags) {
      filters.tags = (tags as string).split(',');
    }

    if (search) {
      filters.search = search as string;
    }

    if (chess_category) {
      filters.chess_category = chess_category as string;
    }

    if (difficulty_level) {
      filters.difficulty_level = difficulty_level as string;
    }

    if (page) {
      filters.page = parseInt(page as string);
    }

    if (limit) {
      filters.limit = parseInt(limit as string);
    }

    const result = await blogsService.getBlogs(filters);

    res.json({
      success: true,
      data: result.blogs,
      meta: {
        total: result.total,
        page: filters.page || 1,
        limit: filters.limit || 20,
        totalPages: Math.ceil(result.total / (filters.limit || 20)),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getUserBlogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const blogs = await blogsService.getUserBlogs(userId);
    res.json({ success: true, data: blogs });
  } catch (error) {
    next(error);
  }
};

export const likeBlog = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const blogId = parseInt(req.params.id);
    await blogsService.likeBlog(blogId, userId);

    res.json({ success: true, message: 'Blog liked' });
  } catch (error) {
    next(error);
  }
};

export const unlikeBlog = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const blogId = parseInt(req.params.id);
    await blogsService.unlikeBlog(blogId, userId);

    res.json({ success: true, message: 'Blog unliked' });
  } catch (error) {
    next(error);
  }
};

export const getBlogComments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const blogId = parseInt(req.params.id);
    const comments = await blogsService.getBlogComments(blogId);

    res.json({ success: true, data: comments });
  } catch (error) {
    next(error);
  }
};

export const addBlogComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const blogId = parseInt(req.params.id);
    const { content, parent_comment_id } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    const comment = await blogsService.addBlogComment(blogId, userId, content, parent_comment_id);

    res.status(201).json({ success: true, data: comment });
  } catch (error) {
    next(error);
  }
};

export const deleteBlogComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const commentId = parseInt(req.params.commentId);
    await blogsService.deleteBlogComment(commentId, userId);

    res.json({ success: true, message: 'Comment deleted' });
  } catch (error) {
    next(error);
  }
};

export const checkBlogAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const blogId = parseInt(req.params.id);
    const userId = (req as any).user?.userId || null;

    const accessResult = await blogAccessService.checkBlogAccess(blogId, userId);

    res.json({
      success: true,
      data: accessResult,
    });
  } catch (error) {
    next(error);
  }
};
