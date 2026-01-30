import { Request, Response, NextFunction } from 'express';
import * as sitemapService from '../services/sitemapService';

export const getSitemapIndex = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const xml = sitemapService.generateSitemapIndex();
    res.set('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    next(error);
  }
};

export const getStaticSitemap = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const xml = sitemapService.generateStaticSitemap();
    res.set('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    next(error);
  }
};

export const getTournamentsSitemap = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const xml = await sitemapService.generateTournamentsSitemap();
    res.set('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    next(error);
  }
};

export const getClubsSitemap = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const xml = await sitemapService.generateClubsSitemap();
    res.set('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    next(error);
  }
};

export const getPlayersSitemap = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const xml = await sitemapService.generatePlayersSitemap();
    res.set('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    next(error);
  }
};

export const getMastersSitemap = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const xml = await sitemapService.generateMastersSitemap();
    res.set('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    next(error);
  }
};

export const getVenuesSitemap = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const xml = await sitemapService.generateVenuesSitemap();
    res.set('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    next(error);
  }
};

export const getFeedSitemap = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const xml = await sitemapService.generateFeedSitemap();
    res.set('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    next(error);
  }
};
