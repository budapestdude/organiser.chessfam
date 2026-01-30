import { Request, Response, NextFunction } from 'express';
import { sendValidationError } from '../utils/response';

type ValidationRule = {
  field: string;
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'email' | 'date' | 'array' | 'object';
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  enum?: any[];
  custom?: (value: any) => string | null;
};

type ValidationSchema = ValidationRule[];

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const validateField = (value: any, rule: ValidationRule): string | null => {
  const { field, required, type, min, max, minLength, maxLength, pattern, enum: enumValues, custom } = rule;

  // Check required
  if (required && (value === undefined || value === null || value === '')) {
    return `${field} is required`;
  }

  // Skip further validation if value is not provided and not required
  if (value === undefined || value === null || value === '') {
    return null;
  }

  // Type validation
  if (type) {
    switch (type) {
      case 'string':
        if (typeof value !== 'string') {
          return `${field} must be a string`;
        }
        break;
      case 'number':
        const num = Number(value);
        if (isNaN(num)) {
          return `${field} must be a number`;
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
          return `${field} must be a boolean`;
        }
        break;
      case 'email':
        if (!emailRegex.test(value)) {
          return `${field} must be a valid email address`;
        }
        break;
      case 'date':
        if (!dateRegex.test(value) && isNaN(Date.parse(value))) {
          return `${field} must be a valid date`;
        }
        break;
      case 'array':
        if (!Array.isArray(value)) {
          return `${field} must be an array`;
        }
        break;
      case 'object':
        if (typeof value !== 'object' || Array.isArray(value)) {
          return `${field} must be an object`;
        }
        break;
    }
  }

  // Numeric range validation
  if (min !== undefined) {
    const numValue = Number(value);
    if (!isNaN(numValue) && numValue < min) {
      return `${field} must be at least ${min}`;
    }
  }

  if (max !== undefined) {
    const numValue = Number(value);
    if (!isNaN(numValue) && numValue > max) {
      return `${field} must be at most ${max}`;
    }
  }

  // String length validation
  if (minLength !== undefined && typeof value === 'string' && value.length < minLength) {
    return `${field} must be at least ${minLength} characters`;
  }

  if (maxLength !== undefined && typeof value === 'string' && value.length > maxLength) {
    return `${field} must be at most ${maxLength} characters`;
  }

  // Pattern validation
  if (pattern && typeof value === 'string' && !pattern.test(value)) {
    return `${field} has an invalid format`;
  }

  // Enum validation
  if (enumValues && !enumValues.includes(value)) {
    return `${field} must be one of: ${enumValues.join(', ')}`;
  }

  // Custom validation
  if (custom) {
    const customError = custom(value);
    if (customError) {
      return customError;
    }
  }

  return null;
};

/**
 * Creates a validation middleware for request body
 */
export const validateBody = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: Record<string, string> = {};

    for (const rule of schema) {
      const value = req.body[rule.field];
      const error = validateField(value, rule);
      if (error) {
        errors[rule.field] = error;
      }
    }

    if (Object.keys(errors).length > 0) {
      return sendValidationError(res, errors);
    }

    next();
  };
};

/**
 * Creates a validation middleware for query parameters
 */
export const validateQuery = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: Record<string, string> = {};

    for (const rule of schema) {
      const value = req.query[rule.field];
      const error = validateField(value, rule);
      if (error) {
        errors[rule.field] = error;
      }
    }

    if (Object.keys(errors).length > 0) {
      return sendValidationError(res, errors);
    }

    next();
  };
};

/**
 * Creates a validation middleware for URL parameters
 */
export const validateParams = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: Record<string, string> = {};

    for (const rule of schema) {
      const value = req.params[rule.field];
      const error = validateField(value, rule);
      if (error) {
        errors[rule.field] = error;
      }
    }

    if (Object.keys(errors).length > 0) {
      return sendValidationError(res, errors);
    }

    next();
  };
};

// Common validation schemas
export const schemas = {
  signup: [
    { field: 'name', required: true, type: 'string' as const, minLength: 2, maxLength: 100 },
    { field: 'email', required: true, type: 'email' as const },
    { field: 'password', required: true, type: 'string' as const, minLength: 8, maxLength: 100 },
  ],
  login: [
    { field: 'email', required: true, type: 'email' as const },
    { field: 'password', required: true, type: 'string' as const },
  ],
  createGame: [
    { field: 'title', required: true, type: 'string' as const, minLength: 3, maxLength: 200 },
    { field: 'game_type', type: 'string' as const, enum: ['casual', 'rated', 'tournament'] },
    { field: 'max_players', type: 'number' as const, min: 2, max: 100 },
  ],
  createBooking: [
    { field: 'booking_type', required: true, type: 'string' as const, enum: ['master', 'tournament', 'club', 'game', 'venue'] },
    { field: 'item_id', required: true, type: 'number' as const },
    { field: 'item_name', required: true, type: 'string' as const },
    { field: 'scheduled_date', required: true, type: 'date' as const },
    { field: 'scheduled_time', required: true, type: 'string' as const },
  ],
  createVenue: [
    { field: 'name', required: true, type: 'string' as const, minLength: 2, maxLength: 200 },
    { field: 'address', required: true, type: 'string' as const, minLength: 5 },
  ],
  createReview: [
    { field: 'rating', required: true, type: 'number' as const, min: 1, max: 5 },
  ],
  sendMessage: [
    { field: 'recipientId', required: true, type: 'number' as const },
    { field: 'content', required: true, type: 'string' as const, minLength: 1, maxLength: 5000 },
  ],
  addFavorite: [
    { field: 'itemType', required: true, type: 'string' as const, enum: ['master', 'venue', 'club', 'tournament', 'player'] },
    { field: 'itemId', required: true, type: 'number' as const },
  ],
  pagination: [
    { field: 'page', type: 'number' as const, min: 1 },
    { field: 'limit', type: 'number' as const, min: 1, max: 100 },
  ],
};
