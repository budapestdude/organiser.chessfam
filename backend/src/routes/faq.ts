import express from 'express';
import {
  getAllFAQs,
  getPublishedFAQs,
  getFAQCategories,
  getFAQById,
  createFAQ,
  updateFAQ,
  deleteFAQ,
  reorderFAQs,
} from '../controllers/faqController';
import { authenticateToken } from '../middleware/auth';
import { requireAdmin } from '../middleware/adminAuth';

const router = express.Router();

// Public routes
router.get('/published', getPublishedFAQs);
router.get('/categories', getFAQCategories);

// Admin routes
router.get('/', authenticateToken, requireAdmin, getAllFAQs);
router.get('/:id', authenticateToken, requireAdmin, getFAQById);
router.post('/', authenticateToken, requireAdmin, createFAQ);
router.put('/:id', authenticateToken, requireAdmin, updateFAQ);
router.delete('/:id', authenticateToken, requireAdmin, deleteFAQ);
router.post('/reorder', authenticateToken, requireAdmin, reorderFAQs);

export default router;
