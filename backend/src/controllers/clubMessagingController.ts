import { Request, Response, NextFunction } from 'express';
import * as messagingService from '../services/clubMessagingService';
import { ValidationError } from '../utils/errors';
import { sendSuccess } from '../utils/response';

export const sendMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ValidationError('User not authenticated');

    const { id: clubId } = req.params;
    const { messageText, messageType } = req.body;

    const message = await messagingService.sendMessage(
      parseInt(clubId),
      req.user.userId,
      messageText,
      messageType || 'general'
    );

    sendSuccess(res, message, 'Message sent successfully');
  } catch (error) {
    next(error);
  }
};

export const getMessages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ValidationError('User not authenticated');

    const { id: clubId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const result = await messagingService.getMessages(
      parseInt(clubId),
      req.user.userId,
      page,
      limit
    );

    res.json({
      success: true,
      data: result.messages,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ValidationError('User not authenticated');

    const { messageId } = req.params;

    await messagingService.markAsRead(parseInt(messageId), req.user.userId);

    sendSuccess(res, null, 'Message marked as read');
  } catch (error) {
    next(error);
  }
};

export const pinMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ValidationError('User not authenticated');

    const { messageId } = req.params;
    const { pinned } = req.body;

    await messagingService.pinMessage(parseInt(messageId), req.user.userId, pinned);

    sendSuccess(res, null, `Message ${pinned ? 'pinned' : 'unpinned'} successfully`);
  } catch (error) {
    next(error);
  }
};

export const deleteMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ValidationError('User not authenticated');

    const { messageId } = req.params;

    await messagingService.deleteMessage(parseInt(messageId), req.user.userId);

    sendSuccess(res, null, 'Message deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const getUnreadCount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ValidationError('User not authenticated');

    const { id: clubId } = req.params;

    const count = await messagingService.getUnreadCount(parseInt(clubId), req.user.userId);

    res.json({ success: true, data: { unreadCount: count } });
  } catch (error) {
    next(error);
  }
};
