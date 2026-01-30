import apiClient from './client';

export interface LinkPreviewData {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  type?: string;
}

export const linkPreviewApi = {
  // Fetch link preview metadata
  getPreview: async (url: string): Promise<LinkPreviewData> => {
    const response = await apiClient.get(`/link-preview/preview`, {
      params: { url }
    });
    return response.data.data;
  },

  // Extract YouTube video ID
  getYouTubeId: async (url: string): Promise<{ videoId: string; url: string }> => {
    const response = await apiClient.get(`/link-preview/youtube`, {
      params: { url }
    });
    return response.data.data;
  },
};

/**
 * Extract URLs from text (client-side)
 */
export const extractUrls = (text: string): string[] => {
  const urlPattern = /https?:\/\/[^\s]+/g;
  return text.match(urlPattern) || [];
};

/**
 * Check if URL is a YouTube URL (client-side)
 */
export const isYouTubeUrl = (url: string): boolean => {
  return /(?:youtube\.com|youtu\.be)/i.test(url);
};

/**
 * Extract YouTube video ID from URL (client-side)
 */
export const extractYouTubeId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
};
