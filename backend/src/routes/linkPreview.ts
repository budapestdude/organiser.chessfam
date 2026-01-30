import express from 'express';
import * as linkPreviewController from '../controllers/linkPreviewController';

const router = express.Router();

// Public routes - no authentication required
router.get('/preview', linkPreviewController.getLinkPreview);
router.get('/youtube', linkPreviewController.getYouTubeId);

export default router;
