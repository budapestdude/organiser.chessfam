import { Resend } from 'resend';

// Initialize Resend client
const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey && process.env.NODE_ENV === 'production') {
  console.warn('Warning: RESEND_API_KEY not set. Email functionality will be disabled.');
}

export const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Email configuration
export const emailConfig = {
  fromEmail: process.env.EMAIL_FROM || 'noreply@chessfam.com',
  fromName: process.env.EMAIL_FROM_NAME || 'ChessFam',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

  // Token expiration times
  verificationTokenExpiry: 24 * 60 * 60 * 1000, // 24 hours
  passwordResetTokenExpiry: 60 * 60 * 1000, // 1 hour
};

// Generate a secure random token
export const generateToken = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 64; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
};
