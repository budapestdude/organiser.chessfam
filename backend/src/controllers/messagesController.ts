import { Request, Response, NextFunction } from 'express';
import * as messagesService from '../services/messagesService';
import { sendSuccess, sendCreated, sendPaginatedSuccess } from '../utils/response';
import { ValidationError } from '../utils/errors';

export const getConversations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const conversations = await messagesService.getConversations(req.user.userId);
    sendSuccess(res, conversations);
  } catch (error) {
    next(error);
  }
};

export const getMessages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { conversationId } = req.params;
    const { page = '1', limit = '50' } = req.query;

    const { messages, total } = await messagesService.getMessages(
      parseInt(conversationId),
      req.user.userId,
      parseInt(page as string),
      parseInt(limit as string)
    );

    sendPaginatedSuccess(res, messages, {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total,
    });
  } catch (error) {
    next(error);
  }
};

export const sendMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { recipientId, content } = req.body;

    if (!recipientId) {
      throw new ValidationError('Recipient ID is required');
    }

    const message = await messagesService.sendMessage(
      req.user.userId,
      parseInt(recipientId),
      content
    );

    sendCreated(res, message, 'Message sent');
  } catch (error) {
    next(error);
  }
};

export const markConversationRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { conversationId } = req.params;

    await messagesService.markConversationRead(
      parseInt(conversationId),
      req.user.userId
    );

    sendSuccess(res, null, 'Conversation marked as read');
  } catch (error) {
    next(error);
  }
};

export const getUnreadCount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const count = await messagesService.getUnreadCount(req.user.userId);
    sendSuccess(res, { unreadCount: count });
  } catch (error) {
    next(error);
  }
};

export const startConversation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { recipientId, message } = req.body;

    if (!recipientId) {
      throw new ValidationError('Recipient ID is required');
    }

    const result = await messagesService.startConversation(
      req.user.userId,
      parseInt(recipientId),
      message
    );

    sendCreated(res, result, 'Conversation started');
  } catch (error) {
    next(error);
  }
};
