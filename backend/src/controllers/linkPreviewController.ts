import { Request, Response, NextFunction } from 'express';
import * as linkPreviewService from '../services/linkPreviewService';
import { sendSuccess } from '../utils/response';
import { ValidationError } from '../utils/errors';

/**
 * Fetch link preview metadata for a URL
 */
export const getLinkPreview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { url } = req.query;

    if (!url || typeof url !== 'string') {
      throw new ValidationError('URL parameter is required');
    }

    const preview = await linkPreviewService.fetchLinkPreview(url);
    sendSuccess(res, preview, 'Link preview fetched successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Extract YouTube ID from URL
 */
export const getYouTubeId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { url } = req.query;

    if (!url || typeof url !== 'string') {
      throw new ValidationError('URL parameter is required');
    }

    const videoId = linkPreviewService.extractYouTubeId(url);

    if (!videoId) {
      throw new ValidationError('Invalid YouTube URL');
    }

    sendSuccess(res, { videoId, url }, 'YouTube ID extracted successfully');
  } catch (error) {
    next(error);
  }
};
