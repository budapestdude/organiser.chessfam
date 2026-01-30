import { Request, Response, NextFunction } from 'express';
import * as postsService from '../services/postsService';
import { ValidationError } from '../utils/errors';

export const getPosts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const posts = await postsService.getPosts(userId, limit, offset);

    res.status(200).json({
      success: true,
      data: posts,
      meta: {
        limit,
        offset,
        count: posts.length
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getPostsByUserId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const targetUserId = parseInt(req.params.userId);
    const currentUserId = (req as any).user?.userId;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    if (isNaN(targetUserId)) {
      throw new ValidationError('Invalid user ID');
    }

    const posts = await postsService.getPostsByUserId(targetUserId, currentUserId, limit, offset);

    res.status(200).json({
      success: true,
      data: posts,
      meta: {
        limit,
        offset,
        count: posts.length
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getPostById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const postId = parseInt(req.params.id);
    const userId = (req as any).user?.userId;

    if (isNaN(postId)) {
      throw new ValidationError('Invalid post ID');
    }

    const post = await postsService.getPostById(postId, userId);

    res.status(200).json({
      success: true,
      data: post
    });
  } catch (error) {
    next(error);
  }
};

export const createPost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      throw new ValidationError('Authentication required');
    }

    const { content, image, images, linked_entity_type, linked_entity_id, pgn } = req.body;

    const post = await postsService.createPost(
      userId,
      content,
      image,
      linked_entity_type,
      linked_entity_id,
      pgn,
      images
    );

    res.status(201).json({
      success: true,
      data: post
    });
  } catch (error) {
    next(error);
  }
};

export const updatePost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      throw new ValidationError('Authentication required');
    }

    const postId = parseInt(req.params.id);
    if (isNaN(postId)) {
      throw new ValidationError('Invalid post ID');
    }

    const { content, image } = req.body;

    const post = await postsService.updatePost(postId, userId, content, image);

    res.status(200).json({
      success: true,
      data: post
    });
  } catch (error) {
    next(error);
  }
};

export const deletePost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const isAdmin = (req as any).user?.is_admin || false;

    if (!userId) {
      throw new ValidationError('Authentication required');
    }

    const postId = parseInt(req.params.id);
    if (isNaN(postId)) {
      throw new ValidationError('Invalid post ID');
    }

    await postsService.deletePost(postId, userId, isAdmin);

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const likePost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      throw new ValidationError('Authentication required');
    }

    const postId = parseInt(req.params.id);
    if (isNaN(postId)) {
      throw new ValidationError('Invalid post ID');
    }

    await postsService.likePost(postId, userId);

    res.status(200).json({
      success: true,
      message: 'Post liked successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const unlikePost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      throw new ValidationError('Authentication required');
    }

    const postId = parseInt(req.params.id);
    if (isNaN(postId)) {
      throw new ValidationError('Invalid post ID');
    }

    await postsService.unlikePost(postId, userId);

    res.status(200).json({
      success: true,
      message: 'Post unliked successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const getPostComments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const postId = parseInt(req.params.id);
    if (isNaN(postId)) {
      throw new ValidationError('Invalid post ID');
    }

    const comments = await postsService.getPostComments(postId);

    res.status(200).json({
      success: true,
      data: comments
    });
  } catch (error) {
    next(error);
  }
};

export const addComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      throw new ValidationError('Authentication required');
    }

    const postId = parseInt(req.params.id);
    if (isNaN(postId)) {
      throw new ValidationError('Invalid post ID');
    }

    const { content } = req.body;

    const comment = await postsService.addComment(postId, userId, content);

    res.status(201).json({
      success: true,
      data: comment
    });
  } catch (error) {
    next(error);
  }
};

export const deleteComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const isAdmin = (req as any).user?.is_admin || false;

    if (!userId) {
      throw new ValidationError('Authentication required');
    }

    const commentId = parseInt(req.params.commentId);
    if (isNaN(commentId)) {
      throw new ValidationError('Invalid comment ID');
    }

    await postsService.deleteComment(commentId, userId, isAdmin);

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// ===== HASHTAG ENDPOINTS =====

export const getTrendingHashtags = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;

    const hashtags = await postsService.getTrendingHashtags(limit);

    res.status(200).json({
      success: true,
      data: hashtags
    });
  } catch (error) {
    next(error);
  }
};

export const getPostsByHashtag = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hashtag = req.params.hashtag;
    if (!hashtag) {
      throw new ValidationError('Hashtag is required');
    }

    const userId = (req as any).user?.userId;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const posts = await postsService.getPostsByHashtag(hashtag, userId, limit, offset);

    res.status(200).json({
      success: true,
      data: posts,
      meta: {
        hashtag,
        limit,
        offset,
        count: posts.length
      }
    });
  } catch (error) {
    next(error);
  }
};

export const searchHashtags = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = req.query.q as string;
    if (!query) {
      throw new ValidationError('Search query is required');
    }

    const limit = parseInt(req.query.limit as string) || 10;

    const hashtags = await postsService.searchHashtags(query, limit);

    res.status(200).json({
      success: true,
      data: hashtags
    });
  } catch (error) {
    next(error);
  }
};

export const getUserHashtags = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      throw new ValidationError('Invalid user ID');
    }

    const limit = parseInt(req.query.limit as string) || 50;

    const hashtags = await postsService.getUserHashtags(userId, limit);

    res.status(200).json({
      success: true,
      data: hashtags
    });
  } catch (error) {
    next(error);
  }
};
