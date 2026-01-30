import express from 'express';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import * as blogsController from '../controllers/blogsController';

const router = express.Router();

// Public routes
router.get('/', blogsController.getBlogs);
router.get('/slug/:slug', optionalAuth, blogsController.getBlogBySlug);
router.get('/:id', optionalAuth, blogsController.getBlogById);
router.get('/:id/access', optionalAuth, blogsController.checkBlogAccess);
router.get('/:id/comments', blogsController.getBlogComments);

// Protected routes
router.post('/', authenticateToken, blogsController.createBlog);
router.put('/:id', authenticateToken, blogsController.updateBlog);
router.delete('/:id', authenticateToken, blogsController.deleteBlog);
router.get('/user/my-blogs', authenticateToken, blogsController.getUserBlogs);

// Engagement routes
router.post('/:id/like', authenticateToken, blogsController.likeBlog);
router.delete('/:id/like', authenticateToken, blogsController.unlikeBlog);
router.post('/:id/comments', authenticateToken, blogsController.addBlogComment);
router.delete('/:id/comments/:commentId', authenticateToken, blogsController.deleteBlogComment);

export default router;
