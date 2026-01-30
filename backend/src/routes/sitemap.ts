import express from 'express';
import * as sitemapController from '../controllers/sitemapController';

const router = express.Router();

// Main sitemap index
router.get('/sitemap.xml', sitemapController.getSitemapIndex);

// Individual sitemaps
router.get('/sitemap-static.xml', sitemapController.getStaticSitemap);
router.get('/sitemap-tournaments.xml', sitemapController.getTournamentsSitemap);
router.get('/sitemap-clubs.xml', sitemapController.getClubsSitemap);
router.get('/sitemap-players.xml', sitemapController.getPlayersSitemap);
router.get('/sitemap-masters.xml', sitemapController.getMastersSitemap);
router.get('/sitemap-venues.xml', sitemapController.getVenuesSitemap);
router.get('/sitemap-feed.xml', sitemapController.getFeedSitemap);

export default router;
