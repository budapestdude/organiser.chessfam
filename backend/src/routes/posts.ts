import express from 'express';
import * as postsController from '../controllers/postsController';
import { authenticateToken, optionalAuth } from '../middleware/auth';

const router = express.Router();

// Public routes (optional auth for like status)
router.get('/', optionalAuth, postsController.getPosts);
router.get('/user/:userId', optionalAuth, postsController.getPostsByUserId);

// Hashtag routes (must come before /:id to avoid conflicts)
router.get('/hashtags/trending', postsController.getTrendingHashtags);
router.get('/hashtags/search', postsController.searchHashtags);
router.get('/hashtags/user/:userId', postsController.getUserHashtags);
router.get('/hashtag/:hashtag', optionalAuth, postsController.getPostsByHashtag);

router.get('/:id', optionalAuth, postsController.getPostById);
router.get('/:id/comments', postsController.getPostComments);

// Protected routes (require authentication)
router.post('/', authenticateToken, postsController.createPost);
router.put('/:id', authenticateToken, postsController.updatePost);
router.delete('/:id', authenticateToken, postsController.deletePost);
router.post('/:id/like', authenticateToken, postsController.likePost);
router.delete('/:id/like', authenticateToken, postsController.unlikePost);
router.post('/:id/comments', authenticateToken, postsController.addComment);
router.delete('/:id/comments/:commentId', authenticateToken, postsController.deleteComment);

export default router;
