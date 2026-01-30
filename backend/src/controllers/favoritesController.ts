import { Request, Response, NextFunction } from 'express';
import * as favoritesService from '../services/favoritesService';
import { sendSuccess, sendCreated } from '../utils/response';
import { ValidationError } from '../utils/errors';

export const getFavorites = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { type, detailed } = req.query;

    let favorites;
    if (detailed === 'true') {
      favorites = await favoritesService.getFavoritesWithDetails(
        req.user.userId,
        type as favoritesService.ItemType
      );
    } else {
      favorites = await favoritesService.getFavorites(
        req.user.userId,
        type as favoritesService.ItemType
      );
    }

    sendSuccess(res, favorites);
  } catch (error) {
    next(error);
  }
};

export const addFavorite = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { itemType, itemId } = req.body;

    if (!itemType || !itemId) {
      throw new ValidationError('Item type and item ID are required');
    }

    const favorite = await favoritesService.addFavorite(
      req.user.userId,
      itemType,
      parseInt(itemId)
    );

    sendCreated(res, favorite, 'Added to favorites');
  } catch (error) {
    next(error);
  }
};

export const removeFavorite = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { itemType, itemId } = req.params;

    await favoritesService.removeFavorite(
      req.user.userId,
      itemType as favoritesService.ItemType,
      parseInt(itemId)
    );

    sendSuccess(res, null, 'Removed from favorites');
  } catch (error) {
    next(error);
  }
};

export const toggleFavorite = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { itemType, itemId } = req.body;

    if (!itemType || !itemId) {
      throw new ValidationError('Item type and item ID are required');
    }

    const result = await favoritesService.toggleFavorite(
      req.user.userId,
      itemType,
      parseInt(itemId)
    );

    const message = result.isFavorite ? 'Added to favorites' : 'Removed from favorites';
    sendSuccess(res, result, message);
  } catch (error) {
    next(error);
  }
};

export const checkFavorite = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { itemType, itemId } = req.params;

    const isFavorite = await favoritesService.isFavorite(
      req.user.userId,
      itemType as favoritesService.ItemType,
      parseInt(itemId)
    );

    sendSuccess(res, { isFavorite });
  } catch (error) {
    next(error);
  }
};
