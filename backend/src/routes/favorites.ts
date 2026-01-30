import { Router } from 'express';
import * as favoritesController from '../controllers/favoritesController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All favorite routes require authentication
router.use(authenticateToken);

router.get('/', favoritesController.getFavorites);
router.post('/', favoritesController.addFavorite);
router.post('/toggle', favoritesController.toggleFavorite);
router.get('/:itemType/:itemId', favoritesController.checkFavorite);
router.delete('/:itemType/:itemId', favoritesController.removeFavorite);

export default router;
