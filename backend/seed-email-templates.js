/**
 * Seed script to import all hardcoded email templates into the database
 * Run with: node seed-email-templates.js
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Email templates with their HTML and text content
const emailTemplates = [
  {
    template_key: 'email_verification',
    template_name: 'Email Verification',
    subject: 'Verify your ChessFam account',
    category: 'Authentication',
    variables: ['userName', 'verificationLink'],
    html_content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; background-color: #1a1a2e; color: #ffffff; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #252540; border-radius: 16px; padding: 32px;">
    <div style="text-align: center; margin-bottom: 24px;">
      <h1 style="color: #8b5cf6; margin: 0;">ChessFam</h1>
    </div>
    <h2 style="color: #ffffff; margin: 0 0 16px 0;">Welcome to ChessFam, {{userName}}!</h2>
    <p style="color: #cccccc; line-height: 1.6;">Thanks for signing up. Please verify your email address to get started.</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="{{verificationLink}}" style="display: inline-block; padding: 12px 32px; background: linear-gradient(135deg, #8b5cf6, #6366f1); color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">Verify Email Address</a>
    </div>
    <p style="color: #888888; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
    <p style="color: #8b5cf6; word-break: break-all; font-size: 12px;">{{verificationLink}}</p>
    <p style="color: #888888; font-size: 14px;">This link expires in 24 hours.</p>
    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #3a3a5c; text-align: center; color: #888;">
      <p style="margin: 0; font-size: 12px;">This email was sent by ChessFam. If you didn't request this email, you can safely ignore it.</p>
    </div>
  </div>
</body>
</html>`,
    text_content: `Welcome to ChessFam, {{userName}}!

Thanks for signing up. Please verify your email by visiting:
{{verificationLink}}

This link expires in 24 hours.`,
    is_active: true,
  },
  {
    template_key: 'password_reset',
    template_name: 'Password Reset',
    subject: 'Reset your ChessFam password',
    category: 'Authentication',
    variables: ['userName', 'resetLink'],
    html_content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; background-color: #1a1a2e; color: #ffffff; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #252540; border-radius: 16px; padding: 32px;">
    <div style="text-align: center; margin-bottom: 24px;">
      <h1 style="color: #8b5cf6; margin: 0;">ChessFam</h1>
    </div>
    <h2 style="color: #ffffff; margin: 0 0 16px 0;">Password Reset Request</h2>
    <p style="color: #cccccc; line-height: 1.6;">Hi {{userName}}, we received a request to reset your password.</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="{{resetLink}}" style="display: inline-block; padding: 12px 32px; background: linear-gradient(135deg, #8b5cf6, #6366f1); color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">Reset Password</a>
    </div>
    <p style="color: #888888; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
    <p style="color: #8b5cf6; word-break: break-all; font-size: 12px;">{{resetLink}}</p>
    <p style="color: #888888; font-size: 14px;">This link expires in 1 hour. If you didn't request this reset, you can safely ignore this email.</p>
    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #3a3a5c; text-align: center; color: #888;">
      <p style="margin: 0; font-size: 12px;">This email was sent by ChessFam. If you didn't request this email, you can safely ignore it.</p>
    </div>
  </div>
</body>
</html>`,
    text_content: `Hi {{userName}},

We received a request to reset your password. Visit this link to reset it:
{{resetLink}}

This link expires in 1 hour. If you didn't request this, ignore this email.`,
    is_active: true,
  },
  {
    template_key: 'booking_confirmation',
    template_name: 'Booking Confirmation',
    subject: 'Booking Confirmed with {{masterName}}',
    category: 'Bookings',
    variables: ['userName', 'masterName', 'date', 'time', 'duration', 'amount', 'bookingId'],
    html_content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; background-color: #1a1a2e; color: #ffffff; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #252540; border-radius: 16px; padding: 32px;">
    <div style="text-align: center; margin-bottom: 24px;">
      <h1 style="color: #8b5cf6; margin: 0;">ChessFam</h1>
    </div>
    <h2 style="color: #ffffff; margin: 0 0 16px 0;">Booking Confirmed!</h2>
    <p style="color: #cccccc; line-height: 1.6;">Hi {{userName}}, your session has been booked.</p>
    <div style="background: #1a1a2e; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="color: #888; margin: 8px 0;">Master: <span style="color: #ccc;">{{masterName}}</span></p>
      <p style="color: #888; margin: 8px 0;">Date: <span style="color: #ccc;">{{date}}</span></p>
      <p style="color: #888; margin: 8px 0;">Time: <span style="color: #ccc;">{{time}}</span></p>
      <p style="color: #888; margin: 8px 0;">Duration: <span style="color: #ccc;">{{duration}} minutes</span></p>
      <p style="color: #888; margin: 8px 0;">Amount: <span style="color: #22c55e;">${{amount}}</span></p>
    </div>
    <p style="color: #888888; font-size: 14px;">Booking ID: #{{bookingId}}</p>
    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #3a3a5c; text-align: center; color: #888;">
      <p style="margin: 0; font-size: 12px;">This email was sent by ChessFam. If you didn't request this email, you can safely ignore it.</p>
    </div>
  </div>
</body>
</html>`,
    text_content: `Booking Confirmed!

Hi {{userName}}, your session has been booked.

Master: {{masterName}}
Date: {{date}}
Time: {{time}}
Duration: {{duration}} minutes
Amount: ${{amount}}

Booking ID: #{{bookingId}}`,
    is_active: true,
  },
  {
    template_key: 'tournament_registration',
    template_name: 'Tournament Registration Confirmation',
    subject: 'Tournament Registration Confirmed: {{tournamentName}}',
    category: 'Tournaments',
    variables: ['userName', 'tournamentName', 'date', 'time', 'venue', 'entryFee', 'registrationId'],
    html_content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; background-color: #1a1a2e; color: #ffffff; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #252540; border-radius: 16px; padding: 32px;">
    <div style="text-align: center; margin-bottom: 24px;">
      <h1 style="color: #8b5cf6; margin: 0;">ChessFam</h1>
    </div>
    <h2 style="color: #ffffff; margin: 0 0 16px 0;">Tournament Registration Confirmed!</h2>
    <p style="color: #cccccc; line-height: 1.6;">Hi {{userName}}, you're registered for {{tournamentName}}!</p>
    <div style="background: #1a1a2e; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="color: #888; margin: 8px 0;">Tournament: <span style="color: #ccc;">{{tournamentName}}</span></p>
      <p style="color: #888; margin: 8px 0;">Date: <span style="color: #ccc;">{{date}}</span></p>
      <p style="color: #888; margin: 8px 0;">Time: <span style="color: #ccc;">{{time}}</span></p>
      <p style="color: #888; margin: 8px 0;">Venue: <span style="color: #ccc;">{{venue}}</span></p>
      <p style="color: #888; margin: 8px 0;">Entry Fee: <span style="color: #22c55e;">${{entryFee}}</span></p>
    </div>
    <p style="color: #888888; font-size: 14px;">Registration ID: #{{registrationId}}</p>
    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #3a3a5c; text-align: center; color: #888;">
      <p style="margin: 0; font-size: 12px;">This email was sent by ChessFam. If you didn't request this email, you can safely ignore it.</p>
    </div>
  </div>
</body>
</html>`,
    text_content: `Tournament Registration Confirmed!

Hi {{userName}}, you're registered for {{tournamentName}}!

Tournament: {{tournamentName}}
Date: {{date}}
Time: {{time}}
Venue: {{venue}}
Entry Fee: ${{entryFee}}

Registration ID: #{{registrationId}}`,
    is_active: true,
  },
  {
    template_key: 'challenge_notification',
    template_name: 'Challenge Notification',
    subject: '{{challengerName}} has challenged you to a game!',
    category: 'Challenges',
    variables: ['challengedName', 'challengerName', 'challengerRating', 'venue', 'message', 'challengeId'],
    html_content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; background-color: #1a1a2e; color: #ffffff; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #252540; border-radius: 16px; padding: 32px;">
    <div style="text-align: center; margin-bottom: 24px;">
      <h1 style="color: #8b5cf6; margin: 0;">ChessFam</h1>
    </div>
    <h2 style="color: #ffffff; margin: 0 0 16px 0;">You've been challenged!</h2>
    <p style="color: #cccccc; line-height: 1.6;">Hi {{challengedName}}, {{challengerName}} ({{challengerRating}}) has challenged you to a game!</p>
    <div style="background: #1a1a2e; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="color: #888; margin: 8px 0;">Challenger: <span style="color: #ccc;">{{challengerName}}</span></p>
      <p style="color: #888; margin: 8px 0;">Rating: <span style="color: #ccc;">{{challengerRating}}</span></p>
      <p style="color: #888; margin: 8px 0;">Venue: <span style="color: #ccc;">{{venue}}</span></p>
      <p style="color: #888; margin: 8px 0;">Message: <span style="color: #ccc;">{{message}}</span></p>
    </div>
    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #3a3a5c; text-align: center; color: #888;">
      <p style="margin: 0; font-size: 12px;">This email was sent by ChessFam. If you didn't request this email, you can safely ignore it.</p>
    </div>
  </div>
</body>
</html>`,
    text_content: `You've been challenged!

Hi {{challengedName}}, {{challengerName}} ({{challengerRating}}) has challenged you to a game!

Challenger: {{challengerName}}
Rating: {{challengerRating}}
Venue: {{venue}}
Message: {{message}}`,
    is_active: true,
  },
  {
    template_key: 'welcome_email',
    template_name: 'Welcome Email',
    subject: 'Welcome to ChessFam!',
    category: 'Authentication',
    variables: ['userName'],
    html_content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; background-color: #1a1a2e; color: #ffffff; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #252540; border-radius: 16px; padding: 32px;">
    <div style="text-align: center; margin-bottom: 24px;">
      <h1 style="color: #8b5cf6; margin: 0;">ChessFam</h1>
    </div>
    <h2 style="color: #ffffff; margin: 0 0 16px 0;">Welcome to ChessFam, {{userName}}!</h2>
    <p style="color: #cccccc; line-height: 1.6;">Your email is verified. You're all set to start connecting with chess players near you!</p>
    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #3a3a5c; text-align: center; color: #888;">
      <p style="margin: 0; font-size: 12px;">This email was sent by ChessFam. If you didn't request this email, you can safely ignore it.</p>
    </div>
  </div>
</body>
</html>`,
    text_content: `Welcome to ChessFam, {{userName}}!

Your email is verified. You're all set to start connecting with chess players near you!`,
    is_active: true,
  },
  {
    template_key: 'tournament_reminder',
    template_name: 'Tournament Reminder',
    subject: 'Reminder: {{tournamentName}} starts soon!',
    category: 'Tournaments',
    variables: ['userName', 'tournamentName', 'tournamentId', 'startDate', 'venue', 'address'],
    html_content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; background-color: #1a1a2e; color: #ffffff; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #252540; border-radius: 16px; padding: 32px;">
    <div style="text-align: center; margin-bottom: 24px;">
      <h1 style="color: #8b5cf6; margin: 0;">ChessFam</h1>
    </div>
    <h2 style="color: #ffffff; margin: 0 0 16px 0;">Tournament Starting Soon!</h2>
    <p style="color: #cccccc; line-height: 1.6;">Hi {{userName}}, don't forget about {{tournamentName}} coming up!</p>
    <div style="background: #1a1a2e; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="color: #888; margin: 8px 0;">Tournament: <span style="color: #ccc;">{{tournamentName}}</span></p>
      <p style="color: #888; margin: 8px 0;">Date: <span style="color: #ccc;">{{startDate}}</span></p>
      <p style="color: #888; margin: 8px 0;">Venue: <span style="color: #ccc;">{{venue}}</span></p>
      <p style="color: #888; margin: 8px 0;">Address: <span style="color: #ccc;">{{address}}</span></p>
    </div>
    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #3a3a5c; text-align: center; color: #888;">
      <p style="margin: 0; font-size: 12px;">This email was sent by ChessFam. If you didn't request this email, you can safely ignore it.</p>
    </div>
  </div>
</body>
</html>`,
    text_content: `Tournament Starting Soon!

Hi {{userName}}, don't forget about {{tournamentName}} coming up!

Tournament: {{tournamentName}}
Date: {{startDate}}
Venue: {{venue}}
Address: {{address}}`,
    is_active: true,
  },
  {
    template_key: 'tournament_cancellation',
    template_name: 'Tournament Cancellation',
    subject: 'Tournament Cancelled: {{tournamentName}}',
    category: 'Tournaments',
    variables: ['userName', 'tournamentName', 'cancellationReason'],
    html_content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; background-color: #1a1a2e; color: #ffffff; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #252540; border-radius: 16px; padding: 32px;">
    <div style="text-align: center; margin-bottom: 24px;">
      <h1 style="color: #8b5cf6; margin: 0;">ChessFam</h1>
    </div>
    <h2 style="color: #ffffff; margin: 0 0 16px 0;">Tournament Cancelled</h2>
    <p style="color: #cccccc; line-height: 1.6;">Hi {{userName}}, unfortunately {{tournamentName}} has been cancelled.</p>
    <p style="color: #cccccc; line-height: 1.6;">Reason: {{cancellationReason}}</p>
    <p style="color: #cccccc; line-height: 1.6;">We apologize for any inconvenience.</p>
    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #3a3a5c; text-align: center; color: #888;">
      <p style="margin: 0; font-size: 12px;">This email was sent by ChessFam. If you didn't request this email, you can safely ignore it.</p>
    </div>
  </div>
</body>
</html>`,
    text_content: `Tournament Cancelled

Hi {{userName}}, unfortunately {{tournamentName}} has been cancelled.

Reason: {{cancellationReason}}

We apologize for any inconvenience.`,
    is_active: true,
  },
  {
    template_key: 'tournament_update',
    template_name: 'Tournament Update',
    subject: 'Update: {{tournamentName}}',
    category: 'Tournaments',
    variables: ['userName', 'tournamentName', 'tournamentId', 'updateMessage'],
    html_content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; background-color: #1a1a2e; color: #ffffff; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #252540; border-radius: 16px; padding: 32px;">
    <div style="text-align: center; margin-bottom: 24px;">
      <h1 style="color: #8b5cf6; margin: 0;">ChessFam</h1>
    </div>
    <h2 style="color: #ffffff; margin: 0 0 16px 0;">Tournament Update</h2>
    <p style="color: #cccccc; line-height: 1.6;">Hi {{userName}}, there's an update for {{tournamentName}}:</p>
    <div style="background: #1a1a2e; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="color: #ccc;">{{updateMessage}}</p>
    </div>
    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #3a3a5c; text-align: center; color: #888;">
      <p style="margin: 0; font-size: 12px;">This email was sent by ChessFam. If you didn't request this email, you can safely ignore it.</p>
    </div>
  </div>
</body>
</html>`,
    text_content: `Tournament Update

Hi {{userName}}, there's an update for {{tournamentName}}:

{{updateMessage}}`,
    is_active: true,
  },
  {
    template_key: 'club_membership_confirmation',
    template_name: 'Club Membership Confirmation',
    subject: 'Welcome to {{clubName}}!',
    category: 'Clubs',
    variables: ['userName', 'clubName', 'clubId', 'clubDescription'],
    html_content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; background-color: #1a1a2e; color: #ffffff; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #252540; border-radius: 16px; padding: 32px;">
    <div style="text-align: center; margin-bottom: 24px;">
      <h1 style="color: #8b5cf6; margin: 0;">ChessFam</h1>
    </div>
    <h2 style="color: #ffffff; margin: 0 0 16px 0;">Welcome to {{clubName}}!</h2>
    <p style="color: #cccccc; line-height: 1.6;">Hi {{userName}}, you're now a member of {{clubName}}!</p>
    <p style="color: #cccccc; line-height: 1.6;">{{clubDescription}}</p>
    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #3a3a5c; text-align: center; color: #888;">
      <p style="margin: 0; font-size: 12px;">This email was sent by ChessFam. If you didn't request this email, you can safely ignore it.</p>
    </div>
  </div>
</body>
</html>`,
    text_content: `Welcome to {{clubName}}!

Hi {{userName}}, you're now a member of {{clubName}}!

{{clubDescription}}`,
    is_active: true,
  },
  {
    template_key: 'new_club_notification',
    template_name: 'New Club Notification',
    subject: 'New chess club in {{city}}: {{clubName}}',
    category: 'Clubs',
    variables: ['userName', 'clubName', 'clubId', 'clubDescription', 'city'],
    html_content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; background-color: #1a1a2e; color: #ffffff; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #252540; border-radius: 16px; padding: 32px;">
    <div style="text-align: center; margin-bottom: 24px;">
      <h1 style="color: #8b5cf6; margin: 0;">ChessFam</h1>
    </div>
    <h2 style="color: #ffffff; margin: 0 0 16px 0;">New Club Near You!</h2>
    <p style="color: #cccccc; line-height: 1.6;">Hi {{userName}}, a new chess club has opened in {{city}}!</p>
    <div style="background: #1a1a2e; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <h3 style="color: #8b5cf6; margin: 0 0 12px 0;">{{clubName}}</h3>
      <p style="color: #ccc;">{{clubDescription}}</p>
    </div>
    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #3a3a5c; text-align: center; color: #888;">
      <p style="margin: 0; font-size: 12px;">This email was sent by ChessFam. If you didn't request this email, you can safely ignore it.</p>
    </div>
  </div>
</body>
</html>`,
    text_content: `New Club Near You!

Hi {{userName}}, a new chess club has opened in {{city}}!

{{clubName}}

{{clubDescription}}`,
    is_active: true,
  },
  {
    template_key: 'verification_approved',
    template_name: 'Identity Verification Approved',
    subject: 'Your identity verification was approved!',
    category: 'Verification',
    variables: ['userName'],
    html_content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; background-color: #1a1a2e; color: #ffffff; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #252540; border-radius: 16px; padding: 32px;">
    <div style="text-align: center; margin-bottom: 24px;">
      <h1 style="color: #8b5cf6; margin: 0;">ChessFam</h1>
    </div>
    <h2 style="color: #ffffff; margin: 0 0 16px 0;">Verification Approved!</h2>
    <p style="color: #cccccc; line-height: 1.6;">Hi {{userName}}, your identity verification has been approved! You now have a verified badge.</p>
    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #3a3a5c; text-align: center; color: #888;">
      <p style="margin: 0; font-size: 12px;">This email was sent by ChessFam. If you didn't request this email, you can safely ignore it.</p>
    </div>
  </div>
</body>
</html>`,
    text_content: `Verification Approved!

Hi {{userName}}, your identity verification has been approved! You now have a verified badge.`,
    is_active: true,
  },
  {
    template_key: 'verification_rejected',
    template_name: 'Identity Verification Rejected',
    subject: 'Your identity verification was not approved',
    category: 'Verification',
    variables: ['userName', 'reason'],
    html_content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; background-color: #1a1a2e; color: #ffffff; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #252540; border-radius: 16px; padding: 32px;">
    <div style="text-align: center; margin-bottom: 24px;">
      <h1 style="color: #8b5cf6; margin: 0;">ChessFam</h1>
    </div>
    <h2 style="color: #ffffff; margin: 0 0 16px 0;">Verification Not Approved</h2>
    <p style="color: #cccccc; line-height: 1.6;">Hi {{userName}}, unfortunately your identity verification was not approved.</p>
    <p style="color: #cccccc; line-height: 1.6;">Reason: {{reason}}</p>
    <p style="color: #cccccc; line-height: 1.6;">You can submit a new verification request if needed.</p>
    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #3a3a5c; text-align: center; color: #888;">
      <p style="margin: 0; font-size: 12px;">This email was sent by ChessFam. If you didn't request this email, you can safely ignore it.</p>
    </div>
  </div>
</body>
</html>`,
    text_content: `Verification Not Approved

Hi {{userName}}, unfortunately your identity verification was not approved.

Reason: {{reason}}

You can submit a new verification request if needed.`,
    is_active: true,
  },
];

async function seedEmailTemplates() {
  let client;
  try {
    client = await pool.connect();
    console.log('Connected to database');

    let inserted = 0;
    let skipped = 0;

    for (const template of emailTemplates) {
      // Check if template already exists
      const existingTemplate = await client.query(
        'SELECT id FROM email_templates WHERE template_key = $1',
        [template.template_key]
      );

      if (existingTemplate.rows.length > 0) {
        console.log(`⏭️  Skipping (exists): ${template.template_name}`);
        skipped++;
        continue;
      }

      // Insert template
      await client.query(
        `INSERT INTO email_templates
          (template_key, template_name, subject, html_content, text_content, variables, category, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          template.template_key,
          template.template_name,
          template.subject,
          template.html_content,
          template.text_content,
          JSON.stringify(template.variables),
          template.category,
          template.is_active,
        ]
      );

      console.log(`✅ Inserted: ${template.template_name}`);
      inserted++;
    }

    console.log('\n===== Email Template Seeding Complete =====');
    console.log(`✅ Inserted: ${inserted}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`📧 Total templates: ${emailTemplates.length}`);

    client.release();
    await pool.end();
  } catch (error) {
    console.error('Error seeding email templates:', error);
    if (client) {
      client.release();
    }
    await pool.end();
    process.exit(1);
  }
}

seedEmailTemplates();
