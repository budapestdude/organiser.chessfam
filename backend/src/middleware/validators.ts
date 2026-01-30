import { Request, Response, NextFunction } from 'express';

export const validateGame = (req: Request, res: Response, next: NextFunction) => {
  const { venue_name, game_date, game_time, max_players, duration_minutes } = req.body;

  // Required fields
  if (!venue_name || !game_date || !game_time) {
    return res.status(400).json({
      success: false,
      message: 'Venue name, game date, and game time are required'
    });
  }

  // Validate date format and range
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(game_date)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid date format. Use YYYY-MM-DD'
    });
  }

  const gameDate = new Date(game_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 30);

  if (gameDate < today) {
    return res.status(400).json({
      success: false,
      message: 'Game date cannot be in the past'
    });
  }

  if (gameDate > maxDate) {
    return res.status(400).json({
      success: false,
      message: 'Game date cannot be more than 30 days in the future'
    });
  }

  // Validate time format
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
  if (!timeRegex.test(game_time)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid time format. Use HH:MM or HH:MM:SS'
    });
  }

  // Validate max_players
  if (max_players !== undefined) {
    const maxPlayersNum = parseInt(max_players);
    if (isNaN(maxPlayersNum) || maxPlayersNum < 1 || maxPlayersNum > 100) {
      return res.status(400).json({
        success: false,
        message: 'Max players must be between 1 and 100'
      });
    }
  }

  // Validate duration_minutes
  if (duration_minutes !== undefined) {
    const durationNum = parseInt(duration_minutes);
    if (isNaN(durationNum) || durationNum < 1 || durationNum > 480) {
      return res.status(400).json({
        success: false,
        message: 'Duration must be between 1 and 480 minutes'
      });
    }
  }

  next();
};
