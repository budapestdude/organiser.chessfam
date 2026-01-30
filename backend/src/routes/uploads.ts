import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateToken } from '../middleware/auth';
import { successResponse } from '../utils/response';
import { AppError } from '../utils/errors';
import { query } from '../config/database';
import { r2Storage } from '../services/r2Storage';

const router = express.Router();

// Ensure uploads directory exists (for local fallback)
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Use memory storage when R2 is configured, disk storage otherwise
const storage = r2Storage.isEnabled()
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (_req, _file, cb) => {
        cb(null, uploadsDir);
      },
      filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
      }
    });

// File filter to only allow images
const fileFilter = (_req: express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed'));
  }
};

// Configure multer with size limits
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  }
});

// Upload single image
router.post('/image', authenticateToken, upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError('No image file provided', 400);
    }

    let imageUrl: string;
    let filename: string;

    // Use R2 if configured, otherwise use local storage
    if (r2Storage.isEnabled()) {
      const result = await r2Storage.uploadFile(req.file, 'images');
      imageUrl = result.url;
      filename = result.key;
    } else {
      const baseUrl = process.env.API_URL || `http://localhost:${process.env.PORT || 3000}`;
      imageUrl = `${baseUrl}/uploads/${req.file.filename}`;
      filename = req.file.filename;
    }

    res.status(201).json(successResponse({
      url: imageUrl,
      filename: filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    }));
  } catch (error) {
    next(error);
  }
});

// Upload multiple images (up to 5)
router.post('/images', authenticateToken, upload.array('images', 5), async (req, res, next) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      throw new AppError('No image files provided', 400);
    }

    const uploadedFiles = [];

    // Use R2 if configured, otherwise use local storage
    if (r2Storage.isEnabled()) {
      for (const file of files) {
        const result = await r2Storage.uploadFile(file, 'images');
        uploadedFiles.push({
          url: result.url,
          filename: result.key,
          originalName: file.originalname,
          size: file.size,
          mimetype: file.mimetype
        });
      }
    } else {
      const baseUrl = process.env.API_URL || `http://localhost:${process.env.PORT || 3000}`;
      for (const file of files) {
        uploadedFiles.push({
          url: `${baseUrl}/uploads/${file.filename}`,
          filename: file.filename,
          originalName: file.originalname,
          size: file.size,
          mimetype: file.mimetype
        });
      }
    }

    res.status(201).json(successResponse({
      files: uploadedFiles,
      count: uploadedFiles.length
    }));
  } catch (error) {
    next(error);
  }
});

// Upload profile avatar
router.post('/avatar', authenticateToken, upload.single('avatar'), async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError('No avatar file provided', 400);
    }

    let avatarUrl: string;
    let filename: string;

    // Use R2 if configured, otherwise use local storage
    if (r2Storage.isEnabled()) {
      const result = await r2Storage.uploadFile(req.file, 'avatars');
      avatarUrl = result.url;
      filename = result.key;
    } else {
      const baseUrl = process.env.API_URL || `http://localhost:${process.env.PORT || 3000}`;
      avatarUrl = `${baseUrl}/uploads/${req.file.filename}`;
      filename = req.file.filename;
    }

    // Update user profile with new avatar URL in database
    if (req.user?.userId) {
      try {
        await query(
          'UPDATE users SET avatar = $1, updated_at = NOW() WHERE id = $2',
          [avatarUrl, req.user.userId]
        );
      } catch (dbError) {
        console.error('Failed to update avatar in database:', dbError);
        // Continue anyway - the URL is still valid
      }
    }

    res.status(201).json(successResponse({
      url: avatarUrl,
      filename: filename
    }));
  } catch (error) {
    next(error);
  }
});

export default router;
