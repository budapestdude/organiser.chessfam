/**
 * Sitemap Generation Service
 *
 * Generates dynamic XML sitemaps for SEO.
 *
 * Routes:
 * - /sitemap.xml - Main sitemap index (links to all sub-sitemaps)
 * - /sitemap-static.xml - Static pages (homepage, tournaments list, etc.)
 * - /sitemap-tournaments.xml - Individual tournament pages
 * - /sitemap-clubs.xml - Individual club pages
 * - /sitemap-players.xml - Player profile pages
 * - /sitemap-masters.xml - Master profile pages
 * - /sitemap-venues.xml - Venue/location pages
 * - /sitemap-feed.xml - Recent feed posts
 *
 * Sitemaps are generated on-demand (no caching currently).
 * For high-traffic sites, consider implementing caching with TTL.
 */

import { query } from '../config/database';

interface SitemapUrl {
  loc: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}

const BASE_URL = process.env.FRONTEND_URL || 'https://chessfam.com';

/**
 * Generate sitemap index XML
 */
export const generateSitemapIndex = (): string => {
  const sitemaps = [
    { loc: `${BASE_URL}/sitemap-static.xml`, lastmod: new Date().toISOString().split('T')[0] },
    { loc: `${BASE_URL}/sitemap-tournaments.xml`, lastmod: new Date().toISOString().split('T')[0] },
    { loc: `${BASE_URL}/sitemap-clubs.xml`, lastmod: new Date().toISOString().split('T')[0] },
    { loc: `${BASE_URL}/sitemap-players.xml`, lastmod: new Date().toISOString().split('T')[0] },
    { loc: `${BASE_URL}/sitemap-masters.xml`, lastmod: new Date().toISOString().split('T')[0] },
    { loc: `${BASE_URL}/sitemap-venues.xml`, lastmod: new Date().toISOString().split('T')[0] },
    { loc: `${BASE_URL}/sitemap-feed.xml`, lastmod: new Date().toISOString().split('T')[0] },
  ];

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  sitemaps.forEach(sitemap => {
    xml += '  <sitemap>\n';
    xml += `    <loc>${sitemap.loc}</loc>\n`;
    xml += `    <lastmod>${sitemap.lastmod}</lastmod>\n`;
    xml += '  </sitemap>\n';
  });

  xml += '</sitemapindex>';
  return xml;
};

/**
 * Generate static pages sitemap
 */
export const generateStaticSitemap = (): string => {
  const staticPages: SitemapUrl[] = [
    { loc: `${BASE_URL}/`, lastmod: new Date().toISOString().split('T')[0], changefreq: 'daily', priority: 1.0 },
    { loc: `${BASE_URL}/search`, lastmod: new Date().toISOString().split('T')[0], changefreq: 'daily', priority: 0.9 },
    { loc: `${BASE_URL}/tournaments`, lastmod: new Date().toISOString().split('T')[0], changefreq: 'daily', priority: 0.9 },
    { loc: `${BASE_URL}/clubs`, lastmod: new Date().toISOString().split('T')[0], changefreq: 'daily', priority: 0.9 },
    { loc: `${BASE_URL}/masters`, lastmod: new Date().toISOString().split('T')[0], changefreq: 'weekly', priority: 0.8 },
    { loc: `${BASE_URL}/players`, lastmod: new Date().toISOString().split('T')[0], changefreq: 'daily', priority: 0.8 },
    { loc: `${BASE_URL}/locations`, lastmod: new Date().toISOString().split('T')[0], changefreq: 'weekly', priority: 0.8 },
    { loc: `${BASE_URL}/games`, lastmod: new Date().toISOString().split('T')[0], changefreq: 'daily', priority: 0.7 },
    { loc: `${BASE_URL}/feed`, lastmod: new Date().toISOString().split('T')[0], changefreq: 'hourly', priority: 0.8 },
    { loc: `${BASE_URL}/premium`, lastmod: new Date().toISOString().split('T')[0], changefreq: 'monthly', priority: 0.7 },
    { loc: `${BASE_URL}/challenges`, lastmod: new Date().toISOString().split('T')[0], changefreq: 'weekly', priority: 0.7 },
    { loc: `${BASE_URL}/register-venue`, lastmod: new Date().toISOString().split('T')[0], changefreq: 'monthly', priority: 0.5 },
    { loc: `${BASE_URL}/login`, lastmod: new Date().toISOString().split('T')[0], changefreq: 'monthly', priority: 0.4 },
    { loc: `${BASE_URL}/signup`, lastmod: new Date().toISOString().split('T')[0], changefreq: 'monthly', priority: 0.4 },
  ];

  return generateSitemapXml(staticPages);
};

/**
 * Generate tournaments sitemap
 */
export const generateTournamentsSitemap = async (): Promise<string> => {
  const result = await query(
    `SELECT id, updated_at, created_at
     FROM tournaments
     WHERE status IN ('upcoming', 'ongoing')
       AND (is_series_parent = false OR is_series_parent IS NULL)
     ORDER BY updated_at DESC`
  );

  const urls: SitemapUrl[] = result.rows.map(row => ({
    loc: `${BASE_URL}/tournament/${row.id}`,
    lastmod: (row.updated_at || row.created_at).toISOString().split('T')[0],
    changefreq: 'daily',
    priority: 0.8,
  }));

  return generateSitemapXml(urls);
};

/**
 * Generate clubs sitemap
 */
export const generateClubsSitemap = async (): Promise<string> => {
  const result = await query(
    `SELECT id, updated_at, created_at
     FROM clubs
     WHERE is_verified = true
     ORDER BY updated_at DESC`
  );

  const urls: SitemapUrl[] = result.rows.map(row => ({
    loc: `${BASE_URL}/club/${row.id}`,
    lastmod: (row.updated_at || row.created_at).toISOString().split('T')[0],
    changefreq: 'weekly',
    priority: 0.7,
  }));

  return generateSitemapXml(urls);
};

/**
 * Generate players sitemap
 */
export const generatePlayersSitemap = async (): Promise<string> => {
  const result = await query(
    `SELECT id, updated_at, created_at
     FROM users
     WHERE is_banned = false OR is_banned IS NULL
     ORDER BY updated_at DESC
     LIMIT 10000`
  );

  const urls: SitemapUrl[] = result.rows.map(row => ({
    loc: `${BASE_URL}/player/${row.id}`,
    lastmod: (row.updated_at || row.created_at).toISOString().split('T')[0],
    changefreq: 'weekly',
    priority: 0.6,
  }));

  return generateSitemapXml(urls);
};

/**
 * Generate masters sitemap
 */
export const generateMastersSitemap = async (): Promise<string> => {
  const result = await query(
    `SELECT id, updated_at, created_at
     FROM users
     WHERE role = 'master'
       AND (is_banned = false OR is_banned IS NULL)
     ORDER BY updated_at DESC`
  );

  const urls: SitemapUrl[] = result.rows.map(row => ({
    loc: `${BASE_URL}/master/${row.id}`,
    lastmod: (row.updated_at || row.created_at).toISOString().split('T')[0],
    changefreq: 'weekly',
    priority: 0.7,
  }));

  return generateSitemapXml(urls);
};

/**
 * Generate venues/locations sitemap
 */
export const generateVenuesSitemap = async (): Promise<string> => {
  const result = await query(
    `SELECT id, updated_at, created_at
     FROM venue_submissions
     WHERE status = 'approved'
     ORDER BY updated_at DESC`
  );

  const urls: SitemapUrl[] = result.rows.map(row => ({
    loc: `${BASE_URL}/location/${row.id}`,
    lastmod: (row.updated_at || row.created_at).toISOString().split('T')[0],
    changefreq: 'weekly',
    priority: 0.7,
  }));

  return generateSitemapXml(urls);
};

/**
 * Generate feed posts sitemap (recent public posts)
 */
export const generateFeedSitemap = async (): Promise<string> => {
  const result = await query(
    `SELECT id, updated_at, created_at
     FROM posts
     WHERE deleted_at IS NULL
       AND flagged = false
     ORDER BY created_at DESC
     LIMIT 1000`
  );

  const urls: SitemapUrl[] = result.rows.map(row => ({
    loc: `${BASE_URL}/feed?post=${row.id}`,
    lastmod: (row.updated_at || row.created_at).toISOString().split('T')[0],
    changefreq: 'daily',
    priority: 0.5,
  }));

  return generateSitemapXml(urls);
};

/**
 * Helper function to generate sitemap XML from URL array
 */
const generateSitemapXml = (urls: SitemapUrl[]): string => {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  urls.forEach(url => {
    xml += '  <url>\n';
    xml += `    <loc>${url.loc}</loc>\n`;
    xml += `    <lastmod>${url.lastmod}</lastmod>\n`;
    xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
    xml += `    <priority>${url.priority}</priority>\n`;
    xml += '  </url>\n';
  });

  xml += '</urlset>';
  return xml;
};
