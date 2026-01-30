import { Request, Response, NextFunction } from 'express';
import * as eventsService from '../services/clubEventsService';
import { ValidationError } from '../utils/errors';
import { sendSuccess } from '../utils/response';

export const createEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ValidationError('User not authenticated');
    const { id: clubId } = req.params;
    const event = await eventsService.createEvent(parseInt(clubId), req.user.userId, req.body);
    sendSuccess(res, event, 'Event created successfully');
  } catch (error) {
    next(error);
  }
};

export const getClubEvents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: clubId } = req.params;
    const userId = req.user?.userId;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const events = await eventsService.getClubEvents(parseInt(clubId), userId, startDate, endDate);
    res.json({ success: true, data: events });
  } catch (error) {
    next(error);
  }
};

export const getEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { eventId } = req.params;
    const userId = req.user?.userId;
    const event = await eventsService.getEventById(parseInt(eventId), userId);
    res.json({ success: true, data: event });
  } catch (error) {
    next(error);
  }
};

export const rsvpToEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ValidationError('User not authenticated');
    const { eventId } = req.params;
    const { status, notes } = req.body;

    await eventsService.rsvpToEvent(parseInt(eventId), req.user.userId, status, notes);
    sendSuccess(res, null, 'RSVP updated successfully');
  } catch (error) {
    next(error);
  }
};

export const updateEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ValidationError('User not authenticated');
    const { eventId } = req.params;
    const event = await eventsService.updateEvent(parseInt(eventId), req.user.userId, req.body);
    sendSuccess(res, event, 'Event updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ValidationError('User not authenticated');
    const { eventId } = req.params;
    await eventsService.deleteEvent(parseInt(eventId), req.user.userId);
    sendSuccess(res, null, 'Event deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const getEventAttendees = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { eventId } = req.params;
    const attendees = await eventsService.getEventAttendees(parseInt(eventId));
    res.json({ success: true, data: attendees });
  } catch (error) {
    next(error);
  }
};
