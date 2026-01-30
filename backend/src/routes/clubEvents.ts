import express from 'express';
import * as eventsController from '../controllers/clubEventsController';
import { authenticateToken, optionalAuth } from '../middleware/auth';

const router = express.Router();

// Club events routes
router.post('/clubs/:id/events', authenticateToken, eventsController.createEvent);
router.get('/clubs/:id/events', optionalAuth, eventsController.getClubEvents);

// Individual event routes
router.get('/events/:eventId', optionalAuth, eventsController.getEvent);
router.put('/events/:eventId', authenticateToken, eventsController.updateEvent);
router.delete('/events/:eventId', authenticateToken, eventsController.deleteEvent);
router.post('/events/:eventId/rsvp', authenticateToken, eventsController.rsvpToEvent);
router.get('/events/:eventId/attendees', eventsController.getEventAttendees);

export default router;
