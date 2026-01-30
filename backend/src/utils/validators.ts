import { ValidationError } from './errors';

export const validateEmail = (email: string): void => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format');
  }
};

export const validatePassword = (password: string): void => {
  if (password.length < 8) {
    throw new ValidationError('Password must be at least 8 characters long');
  }
  if (!/[A-Z]/.test(password)) {
    throw new ValidationError('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    throw new ValidationError('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    throw new ValidationError('Password must contain at least one number');
  }
};

export const validateName = (name: string): void => {
  if (!name || name.trim().length < 2) {
    throw new ValidationError('Name must be at least 2 characters long');
  }
  if (name.length > 255) {
    throw new ValidationError('Name must not exceed 255 characters');
  }
};

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};
