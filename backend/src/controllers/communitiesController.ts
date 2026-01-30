import { Request, Response, NextFunction } from 'express';
import * as communitiesService from '../services/communitiesService';
import { successResponse } from '../utils/response';

// ============ COMMUNITIES ============

export const getCommunities = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { city, country, type, tags, is_active, search, page, limit } = req.query;
    const userId = (req as any).user?.id;

    const result = await communitiesService.getCommunities({
      city: city as string,
      country: country as string,
      type: type as string,
      tags: tags ? (tags as string).split(',') : undefined,
      is_active: is_active === 'false' ? false : true,
      search: search as string,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
      userId
    });

    res.json(successResponse(result));
  } catch (error) {
    next(error);
  }
};

export const getCommunityById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    const community = await communitiesService.getCommunityById(parseInt(id), userId);
    res.json(successResponse(community));
  } catch (error) {
    next(error);
  }
};

export const getCommunityBySlug = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;
    const userId = (req as any).user?.id;

    const community = await communitiesService.getCommunityBySlug(slug, userId);
    res.json(successResponse(community));
  } catch (error) {
    next(error);
  }
};

export const getCommunitiesByCity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { city } = req.params;

    const communities = await communitiesService.getCommunitiesByCity(city);
    res.json(successResponse(communities));
  } catch (error) {
    next(error);
  }
};

export const createCommunity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const community = await communitiesService.createCommunity(userId, req.body);
    res.status(201).json(successResponse(community));
  } catch (error) {
    next(error);
  }
};

export const updateCommunity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    const community = await communitiesService.updateCommunity(parseInt(id), userId, req.body);
    res.json(successResponse(community));
  } catch (error) {
    next(error);
  }
};

// ============ MEMBERS ============

export const joinCommunity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    await communitiesService.joinCommunity(parseInt(id), userId);
    res.json(successResponse({ message: 'Successfully joined community' }));
  } catch (error) {
    next(error);
  }
};

export const leaveCommunity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    await communitiesService.leaveCommunity(parseInt(id), userId);
    res.json(successResponse({ message: 'Successfully left community' }));
  } catch (error) {
    next(error);
  }
};

export const getCommunityMembers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { page, limit } = req.query;

    const result = await communitiesService.getCommunityMembers(
      parseInt(id),
      page ? parseInt(page as string) : 1,
      limit ? parseInt(limit as string) : 50
    );
    res.json(successResponse(result));
  } catch (error) {
    next(error);
  }
};

export const getUserCommunities = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const communities = await communitiesService.getUserCommunities(userId);
    res.json(successResponse(communities));
  } catch (error) {
    next(error);
  }
};

export const getUserOwnedCommunities = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const communities = await communitiesService.getUserOwnedCommunities(userId);
    res.json(successResponse(communities));
  } catch (error) {
    next(error);
  }
};

// ============ MESSAGES ============

export const getCommunityMessages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { limit, before, after } = req.query;

    const messages = await communitiesService.getCommunityMessages(parseInt(id), {
      limit: limit ? parseInt(limit as string) : 50,
      before: before ? parseInt(before as string) : undefined,
      after: after ? parseInt(after as string) : undefined
    });
    res.json(successResponse(messages));
  } catch (error) {
    next(error);
  }
};

export const createMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const { content, message_type, reply_to_id } = req.body;

    const message = await communitiesService.createMessage(
      parseInt(id),
      userId,
      content,
      message_type,
      reply_to_id
    );
    res.status(201).json(successResponse(message));
  } catch (error) {
    next(error);
  }
};

export const deleteMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { messageId } = req.params;
    const userId = (req as any).user.id;

    await communitiesService.deleteMessage(parseInt(messageId), userId);
    res.json(successResponse({ message: 'Message deleted' }));
  } catch (error) {
    next(error);
  }
};

// ============ PRESENCE ============

export const updatePresence = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const { community_id, status } = req.body;

    await communitiesService.updatePresence(userId, community_id, status);
    res.json(successResponse({ message: 'Presence updated' }));
  } catch (error) {
    next(error);
  }
};

export const checkIn = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    await communitiesService.checkIn(userId, parseInt(id));
    res.json(successResponse({ message: 'Checked in successfully' }));
  } catch (error) {
    next(error);
  }
};

export const checkOut = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    await communitiesService.checkOut(userId, parseInt(id));
    res.json(successResponse({ message: 'Checked out successfully' }));
  } catch (error) {
    next(error);
  }
};

export const getOnlineUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const users = await communitiesService.getOnlineUsers(parseInt(id));
    res.json(successResponse(users));
  } catch (error) {
    next(error);
  }
};

export const getCityStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await communitiesService.getCityStats();
    res.json(successResponse(stats));
  } catch (error) {
    next(error);
  }
};

// ============ THEATER CONTENT ============

export const getTheaterContent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const content = await communitiesService.getTheaterContent(parseInt(id));
    res.json(successResponse(content));
  } catch (error) {
    next(error);
  }
};

export const getAllTheaterContent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const content = await communitiesService.getAllTheaterContent(parseInt(id));
    res.json(successResponse(content));
  } catch (error) {
    next(error);
  }
};

export const upsertTheaterContent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const content = await communitiesService.upsertTheaterContent(parseInt(id), userId, req.body);
    res.json(successResponse(content));
  } catch (error) {
    next(error);
  }
};

export const deleteTheaterContent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, contentId } = req.params;
    const userId = (req as any).user.id;
    await communitiesService.deleteTheaterContent(parseInt(id), parseInt(contentId), userId);
    res.json(successResponse({ message: 'Theater content deleted' }));
  } catch (error) {
    next(error);
  }
};
