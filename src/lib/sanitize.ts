// Input sanitization and XSS protection utilities

/**
 * HTML entities to escape
 */
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

/**
 * Escape HTML special characters to prevent XSS attacks
 */
export function escapeHtml(str: string): string {
  if (typeof str !== 'string') return '';
  return str.replace(/[&<>"'`=/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Strip all HTML tags from a string
 */
export function stripHtml(str: string): string {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '');
}

/**
 * Sanitize a string for safe display (escape HTML and trim)
 */
export function sanitizeText(str: string): string {
  if (typeof str !== 'string') return '';
  return escapeHtml(str.trim());
}

/**
 * Sanitize HTML allowing only safe tags
 */
export function sanitizeHtml(html: string, allowedTags: string[] = []): string {
  if (typeof html !== 'string') return '';

  // If no allowed tags, strip all HTML
  if (allowedTags.length === 0) {
    return stripHtml(html);
  }

  // Create a regex pattern for allowed tags
  const tagPattern = allowedTags.join('|');
  const regex = new RegExp(`<(?!\/?(?:${tagPattern})(?:\\s|>))[^>]*>`, 'gi');

  return html.replace(regex, '');
}

/**
 * Allowed HTML tags for chat messages
 */
export const SAFE_MESSAGE_TAGS = ['b', 'i', 'u', 'code', 'pre', 'br'];

/**
 * Sanitize a chat message
 */
export function sanitizeMessage(message: string): string {
  if (typeof message !== 'string') return '';

  // First escape HTML
  let sanitized = escapeHtml(message.trim());

  // Convert markdown-like syntax to safe HTML
  // Bold: **text** or __text__
  sanitized = sanitized.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
  sanitized = sanitized.replace(/__([^_]+)__/g, '<b>$1</b>');

  // Italic: *text* or _text_
  sanitized = sanitized.replace(/\*([^*]+)\*/g, '<i>$1</i>');
  sanitized = sanitized.replace(/_([^_]+)_/g, '<i>$1</i>');

  // Code: `text`
  sanitized = sanitized.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Convert newlines to <br>
  sanitized = sanitized.replace(/\n/g, '<br>');

  return sanitized;
}

/**
 * Validate and sanitize a URL
 */
export function sanitizeUrl(url: string): string | null {
  if (typeof url !== 'string') return null;

  try {
    const parsed = new URL(url.trim());

    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }

    // Block javascript: URLs (double check after protocol validation)
    if (url.toLowerCase().includes('javascript:')) {
      return null;
    }

    // Block data: URLs
    if (url.toLowerCase().includes('data:')) {
      return null;
    }

    return parsed.href;
  } catch {
    return null;
  }
}

/**
 * Validate and sanitize an email address
 */
export function sanitizeEmail(email: string): string | null {
  if (typeof email !== 'string') return null;

  const trimmed = email.trim().toLowerCase();

  // Basic email validation regex
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (!emailRegex.test(trimmed)) {
    return null;
  }

  // Additional security: limit length
  if (trimmed.length > 254) {
    return null;
  }

  return trimmed;
}

/**
 * Sanitize user-provided display name
 */
export function sanitizeDisplayName(name: string): string {
  if (typeof name !== 'string') return '';

  return name
    .trim()
    // Remove any HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove any control characters
    .replace(/[\x00-\x1F\x7F]/g, '')
    // Limit length
    .slice(0, 50);
}

/**
 * Sanitize a slug (URL-safe identifier)
 */
export function sanitizeSlug(slug: string): string {
  if (typeof slug !== 'string') return '';

  return slug
    .toLowerCase()
    .trim()
    // Replace spaces with hyphens
    .replace(/\s+/g, '-')
    // Remove any character that isn't alphanumeric or hyphen
    .replace(/[^a-z0-9-]/g, '')
    // Remove consecutive hyphens
    .replace(/-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-|-$/g, '')
    // Limit length
    .slice(0, 100);
}

/**
 * Validate and sanitize a username
 */
export function sanitizeUsername(username: string): string | null {
  if (typeof username !== 'string') return null;

  const sanitized = username
    .trim()
    .toLowerCase()
    // Only allow alphanumeric, underscore, and hyphen
    .replace(/[^a-z0-9_-]/g, '')
    .slice(0, 30);

  // Minimum length check
  if (sanitized.length < 3) {
    return null;
  }

  // Don't allow usernames that start with numbers
  if (/^[0-9]/.test(sanitized)) {
    return null;
  }

  return sanitized;
}

/**
 * Check if a string contains potential XSS patterns
 */
export function containsXssPatterns(str: string): boolean {
  if (typeof str !== 'string') return false;

  const xssPatterns = [
    /<script\b[^>]*>/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /data:/i,
    /vbscript:/i,
    /expression\s*\(/i,
    /<iframe\b/i,
    /<object\b/i,
    /<embed\b/i,
    /<form\b/i,
    /<input\b/i,
    /<button\b/i,
    /<textarea\b/i,
    /<select\b/i,
    /<style\b/i,
    /<link\b/i,
    /<meta\b/i,
    /&#x?[0-9a-f]+;/i,
  ];

  return xssPatterns.some((pattern) => pattern.test(str));
}

/**
 * Validate content length
 */
export function validateLength(
  str: string,
  options: { min?: number; max?: number } = {}
): { valid: boolean; error?: string } {
  const { min = 0, max = Infinity } = options;

  if (typeof str !== 'string') {
    return { valid: false, error: 'Invalid input type' };
  }

  if (str.length < min) {
    return { valid: false, error: `Must be at least ${min} characters` };
  }

  if (str.length > max) {
    return { valid: false, error: `Must be no more than ${max} characters` };
  }

  return { valid: true };
}

/**
 * Sanitize object values recursively
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  options: {
    escapeHtml?: boolean;
    stripHtml?: boolean;
    maxStringLength?: number;
  } = {}
): T {
  const { escapeHtml: shouldEscape = true, stripHtml: shouldStrip = false, maxStringLength = 10000 } = options;

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      let sanitizedValue = value;

      if (shouldStrip) {
        sanitizedValue = stripHtml(sanitizedValue);
      } else if (shouldEscape) {
        sanitizedValue = escapeHtml(sanitizedValue);
      }

      // Limit string length
      if (sanitizedValue.length > maxStringLength) {
        sanitizedValue = sanitizedValue.slice(0, maxStringLength);
      }

      sanitized[key] = sanitizedValue;
    } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>, options);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) => {
        if (typeof item === 'string') {
          let sanitizedItem = item;
          if (shouldStrip) {
            sanitizedItem = stripHtml(sanitizedItem);
          } else if (shouldEscape) {
            sanitizedItem = escapeHtml(sanitizedItem);
          }
          return sanitizedItem.slice(0, maxStringLength);
        } else if (item !== null && typeof item === 'object') {
          return sanitizeObject(item as Record<string, unknown>, options);
        }
        return item;
      });
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}

/**
 * Create a Content Security Policy header value
 */
export function createCspHeader(options: {
  reportUri?: string;
  nonce?: string;
} = {}): string {
  const directives: string[] = [
    "default-src 'self'",
    `script-src 'self'${options.nonce ? ` 'nonce-${options.nonce}'` : ''} 'unsafe-inline'`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.dicebear.com https://ipapi.co",
    "frame-src 'self' https://player.twitch.tv https://www.youtube.com https://lichess.org https://www.chess.com",
    "media-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
  ];

  if (options.reportUri) {
    directives.push(`report-uri ${options.reportUri}`);
  }

  return directives.join('; ');
}

/**
 * Rate limiting helper (client-side)
 */
export class RateLimiter {
  private timestamps: Map<string, number[]> = new Map();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    const timestamps = this.timestamps.get(key) || [];

    // Remove timestamps outside the window
    const validTimestamps = timestamps.filter((t) => now - t < this.windowMs);

    if (validTimestamps.length >= this.maxRequests) {
      this.timestamps.set(key, validTimestamps);
      return false;
    }

    validTimestamps.push(now);
    this.timestamps.set(key, validTimestamps);
    return true;
  }

  reset(key: string): void {
    this.timestamps.delete(key);
  }

  clear(): void {
    this.timestamps.clear();
  }
}

// Pre-configured rate limiters
export const messageLimiter = new RateLimiter(10, 10000); // 10 messages per 10 seconds
export const searchLimiter = new RateLimiter(5, 5000); // 5 searches per 5 seconds
export const uploadLimiter = new RateLimiter(3, 60000); // 3 uploads per minute
