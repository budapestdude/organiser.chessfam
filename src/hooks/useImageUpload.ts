// Image upload hook for avatars and media
import { useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface ImageUploadOptions {
  bucket: string;
  folder?: string;
  maxSizeMB?: number;
  allowedTypes?: string[];
  generateThumbnail?: boolean;
  thumbnailSize?: number;
}

export interface UploadResult {
  url: string;
  path: string;
  thumbnailUrl?: string;
  thumbnailPath?: string;
}

export interface UseImageUploadReturn {
  upload: (file: File) => Promise<UploadResult | null>;
  uploadMultiple: (files: File[]) => Promise<UploadResult[]>;
  deleteImage: (path: string) => Promise<boolean>;
  isUploading: boolean;
  progress: number;
  error: string | null;
}

const DEFAULT_OPTIONS: ImageUploadOptions = {
  bucket: 'avatars',
  maxSizeMB: 5,
  allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  generateThumbnail: false,
  thumbnailSize: 150,
};

/**
 * Generate a unique filename for uploads
 */
function generateFilename(file: File, folder?: string): string {
  const ext = file.name.split('.').pop() || 'jpg';
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const filename = `${timestamp}-${random}.${ext}`;
  return folder ? `${folder}/${filename}` : filename;
}

/**
 * Compress and resize image on client side
 */
async function compressImage(
  file: File,
  maxWidth: number = 1200,
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      let { width, height } = img;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          'image/jpeg',
          quality
        );
      } else {
        reject(new Error('Canvas context not available'));
      }
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Create a thumbnail from an image
 */
async function createThumbnail(file: File, size: number = 150): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Create square thumbnail from center
      const minDim = Math.min(img.width, img.height);
      const sx = (img.width - minDim) / 2;
      const sy = (img.height - minDim) / 2;

      canvas.width = size;
      canvas.height = size;

      if (ctx) {
        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create thumbnail'));
            }
          },
          'image/jpeg',
          0.7
        );
      } else {
        reject(new Error('Canvas context not available'));
      }
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Hook for handling image uploads
 */
export function useImageUpload(options: Partial<ImageUploadOptions> = {}): UseImageUploadReturn {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  /**
   * Upload a single image
   */
  const upload = useCallback(async (file: File): Promise<UploadResult | null> => {
    setError(null);
    setProgress(0);

    // Validate file type
    if (!mergedOptions.allowedTypes?.includes(file.type)) {
      setError(`File type ${file.type} is not allowed`);
      return null;
    }

    // Validate file size
    const maxBytes = (mergedOptions.maxSizeMB || 5) * 1024 * 1024;
    if (file.size > maxBytes) {
      setError(`File size exceeds ${mergedOptions.maxSizeMB}MB limit`);
      return null;
    }

    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      // Return mock result for development
      const mockUrl = URL.createObjectURL(file);
      return {
        url: mockUrl,
        path: generateFilename(file, mergedOptions.folder),
        thumbnailUrl: mockUrl,
        thumbnailPath: `thumbnails/${generateFilename(file, mergedOptions.folder)}`,
      };
    }

    setIsUploading(true);

    try {
      // Compress image
      setProgress(10);
      const compressedBlob = await compressImage(file);
      setProgress(30);

      // Generate filename
      const path = generateFilename(file, mergedOptions.folder);

      // Upload main image
      const { error: uploadError } = await supabase.rpc('upload_file', {
        bucket: mergedOptions.bucket,
        path,
        file: compressedBlob,
      });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      setProgress(70);

      // Get public URL - In real implementation, use supabase.storage.from().getPublicUrl()
      const url = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${mergedOptions.bucket}/${path}`;

      let thumbnailUrl: string | undefined;
      let thumbnailPath: string | undefined;

      // Generate thumbnail if requested
      if (mergedOptions.generateThumbnail) {
        const thumbnailBlob = await createThumbnail(file, mergedOptions.thumbnailSize);
        thumbnailPath = `thumbnails/${path}`;

        const { error: thumbError } = await supabase.rpc('upload_file', {
          bucket: mergedOptions.bucket,
          path: thumbnailPath,
          file: thumbnailBlob,
        });

        if (!thumbError) {
          thumbnailUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${mergedOptions.bucket}/${thumbnailPath}`;
        }
      }

      setProgress(100);

      return {
        url,
        path,
        thumbnailUrl,
        thumbnailPath,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [mergedOptions]);

  /**
   * Upload multiple images
   */
  const uploadMultiple = useCallback(async (files: File[]): Promise<UploadResult[]> => {
    const results: UploadResult[] = [];

    for (let i = 0; i < files.length; i++) {
      const result = await upload(files[i]);
      if (result) {
        results.push(result);
      }
      setProgress(((i + 1) / files.length) * 100);
    }

    return results;
  }, [upload]);

  /**
   * Delete an image
   */
  const deleteImage = useCallback(async (path: string): Promise<boolean> => {
    if (!isSupabaseConfigured()) {
      return true; // Mock success for development
    }

    try {
      const { error: deleteError } = await supabase.rpc('delete_file', {
        bucket: mergedOptions.bucket,
        path,
      });

      if (deleteError) {
        throw deleteError;
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Delete failed';
      setError(errorMessage);
      return false;
    }
  }, [mergedOptions.bucket]);

  return {
    upload,
    uploadMultiple,
    deleteImage,
    isUploading,
    progress,
    error,
  };
}

/**
 * Get avatar URL with fallback
 */
export function getAvatarUrl(
  avatarUrl: string | null | undefined,
  displayName?: string,
  size: number = 40
): string {
  if (avatarUrl) {
    return avatarUrl;
  }

  // Generate initials-based avatar using DiceBear
  const initials = displayName
    ? displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : '??';

  // Use DiceBear API for consistent avatars
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(initials)}&size=${size}&backgroundColor=c084fc,818cf8,22d3ee,2dd4bf,4ade80,fbbf24&backgroundType=gradientLinear`;
}

/**
 * Validate image file
 */
export function validateImageFile(
  file: File,
  options: { maxSizeMB?: number; allowedTypes?: string[] } = {}
): { valid: boolean; error?: string } {
  const { maxSizeMB = 5, allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] } = options;

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: `File type ${file.type} is not allowed` };
  }

  const maxBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    return { valid: false, error: `File size exceeds ${maxSizeMB}MB limit` };
  }

  return { valid: true };
}
