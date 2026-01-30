// Uploads API - Uses Express backend
import apiClient from './client';

export interface UploadedFile {
  url: string;
  filename: string;
  originalName: string;
  size: number;
  mimetype: string;
}

export interface UploadResponse {
  url: string;
  filename: string;
  originalName?: string;
  size?: number;
  mimetype?: string;
}

export interface MultiUploadResponse {
  files: UploadedFile[];
  count: number;
}

export const uploadsApi = {
  // Upload a single image
  uploadImage: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await apiClient.post('/uploads/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  // Upload multiple images (up to 5)
  uploadImages: async (files: File[]): Promise<MultiUploadResponse> => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file);
    });

    const response = await apiClient.post('/uploads/images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  // Upload avatar image
  uploadAvatar: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await apiClient.post('/uploads/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },
};

export default uploadsApi;
