import { emailConfig } from '../config/email';

const baseStyles = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
  background-color: #1a1a2e;
  color: #ffffff;
`;

const buttonStyles = `
  display: inline-block;
  padding: 12px 32px;
  background: linear-gradient(135deg, #8b5cf6, #6366f1);
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
`;

const wrapperHtml = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="${baseStyles}; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #252540; border-radius: 16px; padding: 32px;">
    <div style="text-align: center; margin-bottom: 24px;">
      <h1 style="color: #8b5cf6; margin: 0;">ChessFam</h1>
    </div>
    ${content}
    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #3a3a5c; text-align: center; color: #888;">
      <p style="margin: 0; font-size: 12px;">This email was sent by ChessFam. If you didn't request this email, you can safely ignore it.</p>
    </div>
  </div>
</body>
</html>
`;

export const emailVerificationTemplate = (name: string, verificationLink: string) => ({
  subject: 'Verify your ChessFam account',
  html: wrapperHtml(`
    <h2 style="color: #ffffff; margin: 0 0 16px 0;">Welcome to ChessFam, ${name}!</h2>
    <p style="color: #cccccc; line-height: 1.6;">Thanks for signing up. Please verify your email address to get started.</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${verificationLink}" style="${buttonStyles}">Verify Email Address</a>
    </div>
    <p style="color: #888888; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
    <p style="color: #8b5cf6; word-break: break-all; font-size: 12px;">${verificationLink}</p>
    <p style="color: #888888; font-size: 14px;">This link expires in 24 hours.</p>
  `),
  text: `Welcome to ChessFam, ${name}!\n\nThanks for signing up. Please verify your email by visiting:\n${verificationLink}\n\nThis link expires in 24 hours.`,
});

export const passwordResetTemplate = (name: string, resetLink: string) => ({
  subject: 'Reset your ChessFam password',
  html: wrapperHtml(`
    <h2 style="color: #ffffff; margin: 0 0 16px 0;">Password Reset Request</h2>
    <p style="color: #cccccc; line-height: 1.6;">Hi ${name}, we received a request to reset your password.</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${resetLink}" style="${buttonStyles}">Reset Password</a>
    </div>
    <p style="color: #888888; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
    <p style="color: #8b5cf6; word-break: break-all; font-size: 12px;">${resetLink}</p>
    <p style="color: #888888; font-size: 14px;">This link expires in 1 hour. If you didn't request this reset, you can safely ignore this email.</p>
  `),
  text: `Hi ${name},\n\nWe received a request to reset your password. Visit this link to reset it:\n${resetLink}\n\nThis link expires in 1 hour. If you didn't request this, ignore this email.`,
});

export const bookingConfirmationTemplate = (params: {
  userName: string;
  masterName: string;
  date: string;
  time: string;
  duration: number;
  amount: number;
  bookingId: number;
}) => ({
  subject: `Booking Confirmed with ${params.masterName}`,
  html: wrapperHtml(`
    <h2 style="color: #ffffff; margin: 0 0 16px 0;">Booking Confirmed!</h2>
    <p style="color: #cccccc; line-height: 1.6;">Hi ${params.userName}, your session has been booked.</p>
    <div style="background: #1a1a2e; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <table style="width: 100%; color: #cccccc;">
        <tr><td style="padding: 8px 0; color: #888;">Master:</td><td style="padding: 8px 0;">${params.masterName}</td></tr>
        <tr><td style="padding: 8px 0; color: #888;">Date:</td><td style="padding: 8px 0;">${params.date}</td></tr>
        <tr><td style="padding: 8px 0; color: #888;">Time:</td><td style="padding: 8px 0;">${params.time}</td></tr>
        <tr><td style="padding: 8px 0; color: #888;">Duration:</td><td style="padding: 8px 0;">${params.duration} minutes</td></tr>
        <tr><td style="padding: 8px 0; color: #888;">Amount:</td><td style="padding: 8px 0; color: #22c55e;">$${(params.amount / 100).toFixed(2)}</td></tr>
      </table>
    </div>
    <p style="color: #888888; font-size: 14px;">Booking ID: #${params.bookingId}</p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${emailConfig.frontendUrl}/bookings/${params.bookingId}" style="${buttonStyles}">View Booking</a>
    </div>
  `),
  text: `Booking Confirmed!\n\nHi ${params.userName}, your session has been booked.\n\nMaster: ${params.masterName}\nDate: ${params.date}\nTime: ${params.time}\nDuration: ${params.duration} minutes\nAmount: $${(params.amount / 100).toFixed(2)}\n\nBooking ID: #${params.bookingId}`,
});

export const tournamentRegistrationTemplate = (params: {
  userName: string;
  tournamentName: string;
  date: string;
  time: string;
  venue: string;
  entryFee: number;
  registrationId: number;
}) => ({
  subject: `Registered for ${params.tournamentName}`,
  html: wrapperHtml(`
    <h2 style="color: #ffffff; margin: 0 0 16px 0;">Tournament Registration Confirmed!</h2>
    <p style="color: #cccccc; line-height: 1.6;">Hi ${params.userName}, you're registered for the tournament.</p>
    <div style="background: #1a1a2e; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <table style="width: 100%; color: #cccccc;">
        <tr><td style="padding: 8px 0; color: #888;">Tournament:</td><td style="padding: 8px 0;">${params.tournamentName}</td></tr>
        <tr><td style="padding: 8px 0; color: #888;">Date:</td><td style="padding: 8px 0;">${params.date}</td></tr>
        <tr><td style="padding: 8px 0; color: #888;">Time:</td><td style="padding: 8px 0;">${params.time}</td></tr>
        <tr><td style="padding: 8px 0; color: #888;">Venue:</td><td style="padding: 8px 0;">${params.venue}</td></tr>
        ${params.entryFee > 0 ? `<tr><td style="padding: 8px 0; color: #888;">Entry Fee:</td><td style="padding: 8px 0; color: #22c55e;">$${(params.entryFee / 100).toFixed(2)}</td></tr>` : ''}
      </table>
    </div>
    <p style="color: #888888; font-size: 14px;">Registration ID: #${params.registrationId}</p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${emailConfig.frontendUrl}/tournaments/${params.registrationId}" style="${buttonStyles}">View Tournament</a>
    </div>
  `),
  text: `Tournament Registration Confirmed!\n\nHi ${params.userName}, you're registered.\n\nTournament: ${params.tournamentName}\nDate: ${params.date}\nTime: ${params.time}\nVenue: ${params.venue}\n${params.entryFee > 0 ? `Entry Fee: $${(params.entryFee / 100).toFixed(2)}` : ''}\n\nRegistration ID: #${params.registrationId}`,
});

export const challengeNotificationTemplate = (params: {
  challengedName: string;
  challengerName: string;
  challengerRating: number;
  venue: string;
  message?: string;
  challengeId: number;
}) => ({
  subject: `Chess Challenge from ${params.challengerName}!`,
  html: wrapperHtml(`
    <h2 style="color: #ffffff; margin: 0 0 16px 0;">You've Been Challenged!</h2>
    <p style="color: #cccccc; line-height: 1.6;">Hi ${params.challengedName}, ${params.challengerName} wants to play chess with you!</p>
    <div style="background: #1a1a2e; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <table style="width: 100%; color: #cccccc;">
        <tr><td style="padding: 8px 0; color: #888;">Challenger:</td><td style="padding: 8px 0;">${params.challengerName}</td></tr>
        <tr><td style="padding: 8px 0; color: #888;">Rating:</td><td style="padding: 8px 0;">${params.challengerRating}</td></tr>
        <tr><td style="padding: 8px 0; color: #888;">Venue:</td><td style="padding: 8px 0;">${params.venue}</td></tr>
        ${params.message ? `<tr><td style="padding: 8px 0; color: #888;">Message:</td><td style="padding: 8px 0;">"${params.message}"</td></tr>` : ''}
      </table>
    </div>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${emailConfig.frontendUrl}/challenges/${params.challengeId}" style="${buttonStyles}">Respond to Challenge</a>
    </div>
  `),
  text: `You've Been Challenged!\n\nHi ${params.challengedName}, ${params.challengerName} (Rating: ${params.challengerRating}) wants to play chess with you at ${params.venue}!\n\n${params.message ? `Message: "${params.message}"` : ''}\n\nRespond at: ${emailConfig.frontendUrl}/challenges/${params.challengeId}`,
});

// ============================================================================
// WELCOME & ONBOARDING
// ============================================================================

export const welcomeEmailTemplate = (userName: string) => ({
  subject: 'Welcome to ChessFam! ♟️',
  html: wrapperHtml(`
    <h2 style="color: #ffffff; margin: 0 0 16px 0;">Welcome to ChessFam, ${userName}! ♟️</h2>
    <p style="color: #cccccc; line-height: 1.6;">Thank you for joining ChessFam, the ultimate platform for chess enthusiasts to connect, compete, and grow!</p>
    <div style="background: #1a1a2e; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <h3 style="color: #8b5cf6; margin: 0 0 12px 0;">Get Started:</h3>
      <ul style="color: #cccccc; margin: 0; padding-left: 20px; line-height: 1.8;">
        <li>Find local tournaments and chess clubs</li>
        <li>Connect with players in your area</li>
        <li>Track your games and improvement</li>
        <li>Join or create chess communities</li>
      </ul>
    </div>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${emailConfig.frontendUrl}/tournaments" style="${buttonStyles}">Explore Tournaments</a>
    </div>
    <p style="color: #888888; font-size: 14px;">If you have any questions, feel free to reach out to our support team.</p>
  `),
  text: `Welcome to ChessFam, ${userName}!\n\nThank you for joining ChessFam, the ultimate platform for chess enthusiasts.\n\nGet Started:\n- Find local tournaments and chess clubs\n- Connect with players in your area\n- Track your games and improvement\n- Join or create chess communities\n\nExplore tournaments at: ${emailConfig.frontendUrl}/tournaments`,
});

// ============================================================================
// TOURNAMENT NOTIFICATIONS
// ============================================================================

export const tournamentReminderTemplate = (params: {
  userName: string;
  tournamentName: string;
  tournamentId: number;
  startDate: string;
  venue: string;
  address?: string;
}) => ({
  subject: `Reminder: ${params.tournamentName} Tomorrow!`,
  html: wrapperHtml(`
    <h2 style="color: #ffffff; margin: 0 0 16px 0;">Tournament Reminder ⏰</h2>
    <p style="color: #cccccc; line-height: 1.6;">Hi ${params.userName}, this is a reminder that <strong>${params.tournamentName}</strong> is coming up soon!</p>
    <div style="background: #1a1a2e; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <table style="width: 100%; color: #cccccc;">
        <tr><td style="padding: 8px 0; color: #888;">Date:</td><td style="padding: 8px 0;">${params.startDate}</td></tr>
        <tr><td style="padding: 8px 0; color: #888;">Location:</td><td style="padding: 8px 0;">${params.venue}</td></tr>
        ${params.address ? `<tr><td style="padding: 8px 0; color: #888;">Address:</td><td style="padding: 8px 0;">${params.address}</td></tr>` : ''}
      </table>
    </div>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${emailConfig.frontendUrl}/tournament/${params.tournamentId}" style="${buttonStyles}">View Tournament Details</a>
    </div>
    <p style="color: #888888; font-size: 14px;">Make sure to arrive early and bring your game face. Good luck!</p>
  `),
  text: `Tournament Reminder\n\nHi ${params.userName}, ${params.tournamentName} is coming up soon!\n\nDate: ${params.startDate}\nLocation: ${params.venue}\n${params.address ? `Address: ${params.address}\n` : ''}\nView details: ${emailConfig.frontendUrl}/tournament/${params.tournamentId}`,
});

export const tournamentCancellationTemplate = (params: {
  userName: string;
  tournamentName: string;
  cancellationReason?: string;
}) => ({
  subject: `Tournament Cancelled: ${params.tournamentName}`,
  html: wrapperHtml(`
    <h2 style="color: #ffffff; margin: 0 0 16px 0;">Tournament Cancelled</h2>
    <p style="color: #cccccc; line-height: 1.6;">Hi ${params.userName}, we regret to inform you that <strong>${params.tournamentName}</strong> has been cancelled.</p>
    ${params.cancellationReason ? `
      <div style="background: #1a1a2e; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <strong style="color: #888;">Reason:</strong><br>
        <p style="color: #cccccc; margin: 10px 0 0 0;">${params.cancellationReason}</p>
      </div>
    ` : ''}
    <p style="color: #cccccc; line-height: 1.6;">If you paid an entry fee, a full refund will be processed within 5-7 business days.</p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${emailConfig.frontendUrl}/tournaments" style="${buttonStyles}">Browse Other Tournaments</a>
    </div>
    <p style="color: #888888; font-size: 14px;">We apologize for any inconvenience.</p>
  `),
  text: `Tournament Cancelled\n\nHi ${params.userName}, ${params.tournamentName} has been cancelled.\n\n${params.cancellationReason ? `Reason: ${params.cancellationReason}\n\n` : ''}If you paid an entry fee, a full refund will be processed within 5-7 business days.\n\nBrowse other tournaments: ${emailConfig.frontendUrl}/tournaments`,
});

export const tournamentUpdateTemplate = (params: {
  userName: string;
  tournamentName: string;
  tournamentId: number;
  updateMessage: string;
}) => ({
  subject: `Update: ${params.tournamentName}`,
  html: wrapperHtml(`
    <h2 style="color: #ffffff; margin: 0 0 16px 0;">Tournament Update 📢</h2>
    <p style="color: #cccccc; line-height: 1.6;">Hi ${params.userName}, there's an important update for <strong>${params.tournamentName}</strong>:</p>
    <div style="background: #1a1a2e; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="color: #cccccc; margin: 0; line-height: 1.6;">${params.updateMessage}</p>
    </div>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${emailConfig.frontendUrl}/tournament/${params.tournamentId}" style="${buttonStyles}">View Tournament Details</a>
    </div>
  `),
  text: `Tournament Update\n\nHi ${params.userName}, update for ${params.tournamentName}:\n\n${params.updateMessage}\n\nView details: ${emailConfig.frontendUrl}/tournament/${params.tournamentId}`,
});

// ============================================================================
// CLUB NOTIFICATIONS
// ============================================================================

export const clubMembershipConfirmationTemplate = (params: {
  userName: string;
  clubName: string;
  clubId: number;
  clubDescription?: string;
}) => ({
  subject: `Welcome to ${params.clubName}!`,
  html: wrapperHtml(`
    <h2 style="color: #ffffff; margin: 0 0 16px 0;">Welcome to ${params.clubName}! ♟️</h2>
    <p style="color: #cccccc; line-height: 1.6;">Hi ${params.userName}, you're now a member of <strong>${params.clubName}</strong>!</p>
    ${params.clubDescription ? `
      <div style="background: #1a1a2e; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <p style="color: #cccccc; margin: 0; line-height: 1.6;">${params.clubDescription}</p>
      </div>
    ` : ''}
    <div style="text-align: center; margin: 24px 0;">
      <a href="${emailConfig.frontendUrl}/club/${params.clubId}" style="${buttonStyles}">Visit Club Page</a>
    </div>
    <p style="color: #888888; font-size: 14px;">Connect with other members, join events, and enjoy the club benefits!</p>
  `),
  text: `Welcome to ${params.clubName}!\n\nHi ${params.userName}, you're now a member!\n\n${params.clubDescription || ''}\n\nVisit the club: ${emailConfig.frontendUrl}/club/${params.clubId}`,
});

export const newClubNotificationTemplate = (params: {
  userName: string;
  clubName: string;
  clubId: number;
  clubDescription?: string;
  city?: string;
}) => ({
  subject: `New Chess Club: ${params.clubName}`,
  html: wrapperHtml(`
    <h2 style="color: #ffffff; margin: 0 0 16px 0;">New Chess Club in Your Area! 🎉</h2>
    <p style="color: #cccccc; line-height: 1.6;">Hi ${params.userName}, a new chess club has been created${params.city ? ` in ${params.city}` : ''}: <strong>${params.clubName}</strong>!</p>
    ${params.clubDescription ? `
      <div style="background: #1a1a2e; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <p style="color: #cccccc; margin: 0; line-height: 1.6;">${params.clubDescription}</p>
      </div>
    ` : ''}
    <div style="text-align: center; margin: 24px 0;">
      <a href="${emailConfig.frontendUrl}/club/${params.clubId}" style="${buttonStyles}">Check It Out</a>
    </div>
    <p style="color: #888888; font-size: 14px;">Don't miss the opportunity to join and connect with local chess players!</p>
  `),
  text: `New Chess Club: ${params.clubName}\n\nHi ${params.userName}, a new chess club has been created${params.city ? ` in ${params.city}` : ''}!\n\n${params.clubDescription || ''}\n\nCheck it out: ${emailConfig.frontendUrl}/club/${params.clubId}`,
});

// ============================================================================
// VERIFICATION EMAILS
// ============================================================================

export const verificationApprovedTemplate = (userName: string) => ({
  subject: 'Identity Verification Approved! ✅',
  html: wrapperHtml(`
    <h2 style="color: #ffffff; margin: 0 0 16px 0;">Identity Verified! ✅</h2>
    <p style="color: #cccccc; line-height: 1.6;">Hi ${userName}, great news! Your identity verification has been approved.</p>
    <div style="background: #1a1a2e; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <h3 style="color: #8b5cf6; margin: 0 0 12px 0;">You can now:</h3>
      <ul style="color: #cccccc; margin: 0; padding-left: 20px; line-height: 1.8;">
        <li>Create and organize tournaments</li>
        <li>Start or manage chess clubs</li>
        <li>Access premium features</li>
        <li>Build trust with other players</li>
      </ul>
    </div>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${emailConfig.frontendUrl}/tournaments/create" style="${buttonStyles}">Create a Tournament</a>
    </div>
    <p style="color: #888888; font-size: 14px;">Thank you for being a verified member of our community!</p>
  `),
  text: `Identity Verified!\n\nHi ${userName}, your identity verification has been approved.\n\nYou can now:\n- Create and organize tournaments\n- Start or manage chess clubs\n- Access premium features\n- Build trust with other players\n\nCreate a tournament: ${emailConfig.frontendUrl}/tournaments/create`,
});

export const verificationRejectedTemplate = (userName: string, reason?: string) => ({
  subject: 'Identity Verification Update',
  html: wrapperHtml(`
    <h2 style="color: #ffffff; margin: 0 0 16px 0;">Identity Verification Update</h2>
    <p style="color: #cccccc; line-height: 1.6;">Hi ${userName}, unfortunately, we were unable to verify your identity at this time.</p>
    ${reason ? `
      <div style="background: #1a1a2e; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <strong style="color: #888;">Reason:</strong><br>
        <p style="color: #cccccc; margin: 10px 0 0 0;">${reason}</p>
      </div>
    ` : ''}
    <p style="color: #cccccc; line-height: 1.6;">You can resubmit your verification documents with the required corrections.</p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${emailConfig.frontendUrl}/verify-identity" style="${buttonStyles}">Resubmit Verification</a>
    </div>
    <p style="color: #888888; font-size: 14px;">If you have questions, please contact our support team.</p>
  `),
  text: `Identity Verification Update\n\nHi ${userName}, we were unable to verify your identity at this time.\n\n${reason ? `Reason: ${reason}\n\n` : ''}You can resubmit your verification documents.\n\nResubmit: ${emailConfig.frontendUrl}/verify-identity`,
});

// Chess Title Verification Templates
export const chessTitleVerificationApprovedTemplate = (userName: string, title: string) => ({
  subject: `✅ Chess Title Verified: ${title}`,
  html: wrapperHtml(`
    <h2 style="color: #ffffff; margin: 0 0 16px 0;">🎉 Chess Title Verified!</h2>
    <p style="color: #cccccc; line-height: 1.6;">Congratulations ${userName}!</p>
    <p style="color: #cccccc; line-height: 1.6;">Your <strong style="color: #fbbf24;">${title}</strong> title has been successfully verified.</p>
    <div style="background: linear-gradient(135deg, #fbbf24, #f59e0b); border-radius: 8px; padding: 24px; margin: 24px 0; text-align: center;">
      <div style="font-size: 48px; margin-bottom: 8px;">♔</div>
      <div style="font-size: 24px; font-weight: bold; color: #1a1a2e;">${title}</div>
      <div style="font-size: 14px; color: #1a1a2e; margin-top: 8px;">Verified Chess Title</div>
    </div>
    <p style="color: #cccccc; line-height: 1.6;">Your verified title badge is now displayed on your profile and throughout the ChessFam community!</p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${emailConfig.frontendUrl}/profile" style="${buttonStyles}">View Your Profile</a>
    </div>
    <p style="color: #888888; font-size: 14px;">Thank you for being a verified member of the ChessFam community.</p>
  `),
  text: `Chess Title Verified!\n\nCongratulations ${userName}!\n\nYour ${title} title has been successfully verified. Your verified title badge is now displayed on your profile and throughout the ChessFam community.\n\nView your profile: ${emailConfig.frontendUrl}/profile`,
});

export const chessTitleVerificationRejectedTemplate = (userName: string, reason: string) => ({
  subject: 'Chess Title Verification Update',
  html: wrapperHtml(`
    <h2 style="color: #ffffff; margin: 0 0 16px 0;">Chess Title Verification Update</h2>
    <p style="color: #cccccc; line-height: 1.6;">Hi ${userName},</p>
    <p style="color: #cccccc; line-height: 1.6;">We were unable to verify your chess title at this time.</p>
    ${reason ? `
      <div style="background: #1a1a2e; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <strong style="color: #888;">Reason:</strong><br>
        <p style="color: #cccccc; margin: 10px 0 0 0;">${reason}</p>
      </div>
    ` : ''}
    <p style="color: #cccccc; line-height: 1.6;">Common reasons for rejection:</p>
    <ul style="color: #cccccc; line-height: 1.8;">
      <li>Certificate image is unclear or unreadable</li>
      <li>FIDE ID does not match the submitted certificate</li>
      <li>Title shown on certificate does not match claimed title</li>
      <li>Certificate appears to be altered or fraudulent</li>
    </ul>
    <p style="color: #cccccc; line-height: 1.6;">You can resubmit your chess title verification with the correct documentation.</p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${emailConfig.frontendUrl}/verify-chess-title" style="${buttonStyles}">Resubmit Verification</a>
    </div>
    <p style="color: #888888; font-size: 14px;">If you have questions, please contact our support team.</p>
  `),
  text: `Chess Title Verification Update\n\nHi ${userName}, we were unable to verify your chess title at this time.\n\n${reason ? `Reason: ${reason}\n\n` : ''}Common reasons for rejection:\n- Certificate image is unclear or unreadable\n- FIDE ID does not match the submitted certificate\n- Title shown on certificate does not match claimed title\n- Certificate appears to be altered or fraudulent\n\nYou can resubmit your verification.\n\nResubmit: ${emailConfig.frontendUrl}/verify-chess-title`,
});

// ============================================================================
// ORGANIZER NOTIFICATIONS
// ============================================================================

export const tournamentNewRegistrationOrganizerTemplate = (params: {
  organizerName: string;
  tournamentName: string;
  tournamentId: number;
  playerName: string;
  playerEmail: string;
  playerRating?: number;
  totalParticipants: number;
  maxParticipants: number;
  entryFee: number;
}) => ({
  subject: `New registration: ${params.playerName} joined ${params.tournamentName}`,
  html: wrapperHtml(`
    <h2 style="color: #ffffff; margin: 0 0 16px 0;">✅ New Tournament Registration</h2>
    <p style="color: #cccccc; line-height: 1.6;">Hi ${params.organizerName}, great news! A new player has registered for your tournament.</p>
    <div style="background: #1a1a2e; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <table style="width: 100%; color: #cccccc;">
        <tr><td style="padding: 8px 0; color: #888;">Tournament:</td><td style="padding: 8px 0; font-weight: bold;">${params.tournamentName}</td></tr>
        <tr><td style="padding: 8px 0; color: #888;">Player:</td><td style="padding: 8px 0;">${params.playerName}</td></tr>
        ${params.playerRating ? `<tr><td style="padding: 8px 0; color: #888;">Rating:</td><td style="padding: 8px 0;">${params.playerRating}</td></tr>` : ''}
        <tr><td style="padding: 8px 0; color: #888;">Email:</td><td style="padding: 8px 0;">${params.playerEmail}</td></tr>
        ${params.entryFee > 0 ? `<tr><td style="padding: 8px 0; color: #888;">Entry Fee Paid:</td><td style="padding: 8px 0; color: #22c55e;">$${(params.entryFee / 100).toFixed(2)}</td></tr>` : ''}
        <tr><td style="padding: 8px 0; color: #888;">Participants:</td><td style="padding: 8px 0;"><strong>${params.totalParticipants}</strong> / ${params.maxParticipants}</td></tr>
      </table>
    </div>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${emailConfig.frontendUrl}/tournament/${params.tournamentId}" style="${buttonStyles}">View Tournament</a>
    </div>
    <p style="color: #888888; font-size: 14px;">Manage your tournament participants and settings in your tournament dashboard.</p>
  `),
  text: `New Tournament Registration\n\nHi ${params.organizerName}, a new player has registered for your tournament.\n\nTournament: ${params.tournamentName}\nPlayer: ${params.playerName}\n${params.playerRating ? `Rating: ${params.playerRating}\n` : ''}Email: ${params.playerEmail}\n${params.entryFee > 0 ? `Entry Fee Paid: $${(params.entryFee / 100).toFixed(2)}\n` : ''}Participants: ${params.totalParticipants} / ${params.maxParticipants}\n\nView tournament: ${emailConfig.frontendUrl}/tournament/${params.tournamentId}`,
});

export const tournamentWithdrawalOrganizerTemplate = (params: {
  organizerName: string;
  tournamentName: string;
  tournamentId: number;
  playerName: string;
  playerEmail: string;
  totalParticipants: number;
  maxParticipants: number;
  refundProcessed?: boolean;
  refundAmount?: number;
}) => ({
  subject: `Player withdrew: ${params.playerName} from ${params.tournamentName}`,
  html: wrapperHtml(`
    <h2 style="color: #ffffff; margin: 0 0 16px 0;">⚠️ Tournament Withdrawal</h2>
    <p style="color: #cccccc; line-height: 1.6;">Hi ${params.organizerName}, a player has withdrawn from your tournament.</p>
    <div style="background: #1a1a2e; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <table style="width: 100%; color: #cccccc;">
        <tr><td style="padding: 8px 0; color: #888;">Tournament:</td><td style="padding: 8px 0; font-weight: bold;">${params.tournamentName}</td></tr>
        <tr><td style="padding: 8px 0; color: #888;">Player:</td><td style="padding: 8px 0;">${params.playerName}</td></tr>
        <tr><td style="padding: 8px 0; color: #888;">Email:</td><td style="padding: 8px 0;">${params.playerEmail}</td></tr>
        ${params.refundProcessed ? `<tr><td style="padding: 8px 0; color: #888;">Refund:</td><td style="padding: 8px 0; color: #f59e0b;">$${((params.refundAmount || 0) / 100).toFixed(2)} processed</td></tr>` : ''}
        <tr><td style="padding: 8px 0; color: #888;">Participants:</td><td style="padding: 8px 0;"><strong>${params.totalParticipants}</strong> / ${params.maxParticipants}</td></tr>
      </table>
    </div>
    ${params.refundProcessed ? `<p style="color: #f59e0b; background: #fef3c7; padding: 12px; border-radius: 6px; font-size: 14px;">⚠️ An automatic refund was processed according to your refund policy.</p>` : ''}
    <div style="text-align: center; margin: 24px 0;">
      <a href="${emailConfig.frontendUrl}/tournament/${params.tournamentId}" style="${buttonStyles}">View Tournament</a>
    </div>
    <p style="color: #888888; font-size: 14px;">You now have an available spot for new registrations.</p>
  `),
  text: `Tournament Withdrawal\n\nHi ${params.organizerName}, a player has withdrawn from your tournament.\n\nTournament: ${params.tournamentName}\nPlayer: ${params.playerName}\nEmail: ${params.playerEmail}\n${params.refundProcessed ? `Refund: $${((params.refundAmount || 0) / 100).toFixed(2)} processed\n` : ''}Participants: ${params.totalParticipants} / ${params.maxParticipants}\n\n${params.refundProcessed ? 'An automatic refund was processed according to your refund policy.\n\n' : ''}View tournament: ${emailConfig.frontendUrl}/tournament/${params.tournamentId}`,
});
