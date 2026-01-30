import axios from 'axios';
import * as cheerio from 'cheerio';
import { ValidationError } from '../utils/errors';

export interface LinkPreview {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  type?: string;
}

/**
 * Extract YouTube video ID from URL
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

/**
 * Check if URL is a YouTube URL
 */
export const isYouTubeUrl = (url: string): boolean => {
  return /(?:youtube\.com|youtu\.be)/i.test(url);
};

/**
 * Fetch OpenGraph metadata from a URL
 */
export const fetchLinkPreview = async (url: string): Promise<LinkPreview> => {
  try {
    // Validate URL
    const urlObj = new URL(url);
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      throw new ValidationError('Invalid URL protocol');
    }

    // Fetch the page
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ChessFamBot/1.0; +https://chessfam.com)',
      },
      timeout: 10000, // 10 second timeout
      maxRedirects: 5,
    });

    const html = response.data;
    const $ = cheerio.load(html);

    // Extract OpenGraph metadata
    const preview: LinkPreview = {
      url,
      title: $('meta[property="og:title"]').attr('content') || $('title').text() || undefined,
      description: $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || undefined,
      image: $('meta[property="og:image"]').attr('content') || undefined,
      siteName: $('meta[property="og:site_name"]').attr('content') || undefined,
      type: $('meta[property="og:type"]').attr('content') || undefined,
    };

    // Make image URLs absolute
    if (preview.image && !preview.image.startsWith('http')) {
      preview.image = new URL(preview.image, url).toString();
    }

    return preview;
  } catch (error: any) {
    console.error('Error fetching link preview:', error.message);

    // Return basic preview with just the URL
    return {
      url,
      title: url,
    };
  }
};

/**
 * Extract all URLs from text
 */
export const extractUrls = (text: string): string[] => {
  const urlPattern = /https?:\/\/[^\s]+/g;
  return text.match(urlPattern) || [];
};
