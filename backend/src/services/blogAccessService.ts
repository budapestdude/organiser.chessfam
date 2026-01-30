import pool from '../config/database';
import { checkAuthorSubscriptionAccess } from './authorSubscriptionService';

export type AccessLevel = 'free' | 'author' | 'subscribed' | 'preview';

export interface BlogAccessResult {
  hasAccess: boolean;
  accessLevel: AccessLevel;
  previewPercent: number;
  requiresSubscription: boolean;
}

export interface BlogWithAccess {
  blog: any;
  accessResult: BlogAccessResult;
  content: string; // Full or preview content based on access
}

/**
 * Check user's access level to a blog
 */
export const checkBlogAccess = async (
  blogId: number,
  userId: number | null
): Promise<BlogAccessResult> => {
  // Get blog details
  const blogResult = await pool.query(
    `SELECT id, author_id, is_paid, preview_percent, content
     FROM blogs
     WHERE id = $1`,
    [blogId]
  );

  if (blogResult.rows.length === 0) {
    throw new Error('Blog not found');
  }

  const blog = blogResult.rows[0];

  // If blog is not paid, grant full access
  if (!blog.is_paid) {
    return {
      hasAccess: true,
      accessLevel: 'free',
      previewPercent: 100,
      requiresSubscription: false,
    };
  }

  // If user is not logged in, return preview access
  if (!userId) {
    return {
      hasAccess: false,
      accessLevel: 'preview',
      previewPercent: blog.preview_percent || 30,
      requiresSubscription: true,
    };
  }

  // If user is the author, grant full access
  if (userId === blog.author_id) {
    return {
      hasAccess: true,
      accessLevel: 'author',
      previewPercent: 100,
      requiresSubscription: false,
    };
  }

  // Check if user has active subscription to author
  const hasSubscription = await checkAuthorSubscriptionAccess(blog.author_id, userId);

  if (hasSubscription) {
    return {
      hasAccess: true,
      accessLevel: 'subscribed',
      previewPercent: 100,
      requiresSubscription: false,
    };
  }

  // User doesn't have access - return preview
  return {
    hasAccess: false,
    accessLevel: 'preview',
    previewPercent: blog.preview_percent || 30,
    requiresSubscription: true,
  };
};

/**
 * Generate preview content based on preview percentage
 * Uses paragraph-based truncation for better UX
 */
export const generatePreviewContent = (
  content: string,
  previewPercent: number
): string => {
  if (previewPercent >= 100) {
    return content;
  }

  if (previewPercent <= 0) {
    return '';
  }

  // Split by paragraphs (double newlines or <p> tags for HTML)
  const paragraphs = content.split(/\n\n+|<\/p>\s*<p>/i);

  // Calculate how many paragraphs to show
  const paraCount = Math.max(1, Math.ceil(paragraphs.length * (previewPercent / 100)));

  // Take the first N paragraphs
  const previewParagraphs = paragraphs.slice(0, paraCount);

  // Rejoin paragraphs
  let preview = previewParagraphs.join('\n\n');

  // Add paywall message
  preview += '\n\n---\n\n**[Subscribe to continue reading...]**';

  return preview;
};

/**
 * Get blog with access control applied
 * Returns blog with full or preview content based on user's access
 */
export const getBlogWithAccess = async (
  blogId: number,
  userId: number | null
): Promise<BlogWithAccess> => {
  // Get blog details
  const blogResult = await pool.query(
    `SELECT
      b.*,
      u.username as author_name,
      u.email as author_email,
      COUNT(DISTINCT blv.id) as views_count,
      COUNT(DISTINCT br.id) as likes_count
    FROM blogs b
    JOIN users u ON u.id = b.author_id
    LEFT JOIN blog_linked_views blv ON blv.blog_id = b.id
    LEFT JOIN blog_reactions br ON br.blog_id = b.id AND br.reaction_type = 'like'
    WHERE b.id = $1
    GROUP BY b.id, u.username, u.email`,
    [blogId]
  );

  if (blogResult.rows.length === 0) {
    throw new Error('Blog not found');
  }

  const blog = blogResult.rows[0];

  // Check access
  const accessResult = await checkBlogAccess(blogId, userId);

  // Determine content to return
  let content: string;

  if (accessResult.hasAccess) {
    // User has full access
    content = blog.content;
  } else {
    // User only has preview access
    content = generatePreviewContent(blog.content, accessResult.previewPercent);
  }

  return {
    blog: {
      ...blog,
      // Remove full content from blog object for security
      content: undefined,
    },
    accessResult,
    content,
  };
};

/**
 * Check if user can access a specific blog (simple boolean)
 */
export const canAccessBlog = async (
  blogId: number,
  userId: number | null
): Promise<boolean> => {
  const accessResult = await checkBlogAccess(blogId, userId);
  return accessResult.hasAccess;
};

/**
 * Get preview content for a blog (for SEO and social sharing)
 */
export const getBlogPreview = async (blogId: number): Promise<string> => {
  const blogResult = await pool.query(
    'SELECT content, preview_percent FROM blogs WHERE id = $1',
    [blogId]
  );

  if (blogResult.rows.length === 0) {
    throw new Error('Blog not found');
  }

  const { content, preview_percent } = blogResult.rows[0];

  return generatePreviewContent(content, preview_percent || 30);
};
