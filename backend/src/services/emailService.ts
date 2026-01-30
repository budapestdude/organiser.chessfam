import { resend, emailConfig } from '../config/email';
import {
  emailVerificationTemplate,
  passwordResetTemplate,
  bookingConfirmationTemplate,
  tournamentRegistrationTemplate,
  challengeNotificationTemplate,
  welcomeEmailTemplate,
  tournamentReminderTemplate,
  tournamentCancellationTemplate,
  tournamentUpdateTemplate,
  clubMembershipConfirmationTemplate,
  newClubNotificationTemplate,
  verificationApprovedTemplate,
  verificationRejectedTemplate,
  chessTitleVerificationApprovedTemplate,
  chessTitleVerificationRejectedTemplate,
  tournamentNewRegistrationOrganizerTemplate,
  tournamentWithdrawalOrganizerTemplate,
} from './emailTemplates';
import * as emailTemplatesService from './emailTemplatesService';

interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Fetch template from database or fall back to hardcoded template
 */
const getTemplate = async (
  templateKey: string,
  variables: Record<string, any>,
  fallbackTemplate: { subject: string; html: string; text: string }
): Promise<{ subject: string; html: string; text: string }> => {
  try {
    // Try to get template from database
    const dbTemplate = await emailTemplatesService.getEmailTemplateByKey(templateKey);

    if (dbTemplate) {
      // Render database template with variables
      const subject = emailTemplatesService.renderTemplate(dbTemplate.subject, variables);
      const html = emailTemplatesService.renderTemplate(dbTemplate.html_content, variables);
      const text = emailTemplatesService.renderTemplate(dbTemplate.text_content, variables);

      return { subject, html, text };
    }
  } catch (error) {
    console.warn(`[Email] Failed to fetch template ${templateKey} from database, using fallback:`, error);
  }

  // Fall back to hardcoded template
  return fallbackTemplate;
}

export const sendEmail = async (
  to: string,
  subject: string,
  html: string,
  text: string
): Promise<SendEmailResult> => {
  if (!resend) {
    console.log(`[Email] Resend not configured. Would send to ${to}: ${subject}`);
    return { success: true, messageId: 'mock-id' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: `${emailConfig.fromName} <${emailConfig.fromEmail}>`,
      to: [to],
      subject,
      html,
      text,
    });

    if (error) {
      console.error('[Email] Send error:', error);
      return { success: false, error: error.message };
    }

    console.log(`[Email] Sent to ${to}: ${subject}`);
    return { success: true, messageId: data?.id };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Email] Exception:', errorMessage);
    return { success: false, error: errorMessage };
  }
};

export const sendVerificationEmail = async (
  email: string,
  name: string,
  token: string
): Promise<SendEmailResult> => {
  const verificationLink = `${emailConfig.frontendUrl}/verify-email?token=${token}`;
  const variables = { userName: name, verificationLink };
  const fallback = emailVerificationTemplate(name, verificationLink);
  const template = await getTemplate('email_verification', variables, fallback);
  return sendEmail(email, template.subject, template.html, template.text);
};

export const sendPasswordResetEmail = async (
  email: string,
  name: string,
  token: string
): Promise<SendEmailResult> => {
  const resetLink = `${emailConfig.frontendUrl}/reset-password?token=${token}`;
  const variables = { userName: name, resetLink };
  const fallback = passwordResetTemplate(name, resetLink);
  const template = await getTemplate('password_reset', variables, fallback);
  return sendEmail(email, template.subject, template.html, template.text);
};

export const sendBookingConfirmation = async (
  email: string,
  params: {
    userName: string;
    masterName: string;
    date: string;
    time: string;
    duration: number;
    amount: number;
    bookingId: number;
  }
): Promise<SendEmailResult> => {
  const fallback = bookingConfirmationTemplate(params);
  const template = await getTemplate('booking_confirmation', params, fallback);
  return sendEmail(email, template.subject, template.html, template.text);
};

export const sendTournamentRegistration = async (
  email: string,
  params: {
    userName: string;
    tournamentName: string;
    date: string;
    time: string;
    venue: string;
    entryFee: number;
    registrationId: number;
  }
): Promise<SendEmailResult> => {
  const fallback = tournamentRegistrationTemplate(params);
  const template = await getTemplate('tournament_registration', params, fallback);
  return sendEmail(email, template.subject, template.html, template.text);
};

export const sendChallengeNotification = async (
  email: string,
  params: {
    challengedName: string;
    challengerName: string;
    challengerRating: number;
    venue: string;
    message?: string;
    challengeId: number;
  }
): Promise<SendEmailResult> => {
  const fallback = challengeNotificationTemplate(params);
  const template = await getTemplate('challenge_notification', params, fallback);
  return sendEmail(email, template.subject, template.html, template.text);
};

// Generic email sender for custom emails (used by subscription system)
export const sendCustomEmail = async (params: {
  to: string;
  subject: string;
  html: string;
}): Promise<SendEmailResult> => {
  // Generate plain text from HTML (basic)
  const text = params.html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  return sendEmail(params.to, params.subject, params.html, text);
};

// ============================================================================
// WELCOME & ONBOARDING
// ============================================================================

export const sendWelcomeEmail = async (
  email: string,
  userName: string
): Promise<SendEmailResult> => {
  const variables = { userName };
  const fallback = welcomeEmailTemplate(userName);
  const template = await getTemplate('welcome_email', variables, fallback);
  return sendEmail(email, template.subject, template.html, template.text);
};

// ============================================================================
// TOURNAMENT NOTIFICATIONS
// ============================================================================

export const sendTournamentReminder = async (
  email: string,
  params: {
    userName: string;
    tournamentName: string;
    tournamentId: number;
    startDate: string;
    venue: string;
    address?: string;
  }
): Promise<SendEmailResult> => {
  const fallback = tournamentReminderTemplate(params);
  const template = await getTemplate('tournament_reminder', params, fallback);
  return sendEmail(email, template.subject, template.html, template.text);
};

export const sendTournamentCancellation = async (
  email: string,
  params: {
    userName: string;
    tournamentName: string;
    cancellationReason?: string;
  }
): Promise<SendEmailResult> => {
  const fallback = tournamentCancellationTemplate(params);
  const template = await getTemplate('tournament_cancellation', params, fallback);
  return sendEmail(email, template.subject, template.html, template.text);
};

export const sendTournamentUpdate = async (
  email: string,
  params: {
    userName: string;
    tournamentName: string;
    tournamentId: number;
    updateMessage: string;
  }
): Promise<SendEmailResult> => {
  const fallback = tournamentUpdateTemplate(params);
  const template = await getTemplate('tournament_update', params, fallback);
  return sendEmail(email, template.subject, template.html, template.text);
};

// ============================================================================
// CLUB NOTIFICATIONS
// ============================================================================

export const sendClubMembershipConfirmation = async (
  email: string,
  params: {
    userName: string;
    clubName: string;
    clubId: number;
    clubDescription?: string;
  }
): Promise<SendEmailResult> => {
  const fallback = clubMembershipConfirmationTemplate(params);
  const template = await getTemplate('club_membership_confirmation', params, fallback);
  return sendEmail(email, template.subject, template.html, template.text);
};

export const sendNewClubNotification = async (
  email: string,
  params: {
    userName: string;
    clubName: string;
    clubId: number;
    clubDescription?: string;
    city?: string;
  }
): Promise<SendEmailResult> => {
  const fallback = newClubNotificationTemplate(params);
  const template = await getTemplate('new_club_notification', params, fallback);
  return sendEmail(email, template.subject, template.html, template.text);
};

// ============================================================================
// VERIFICATION
// ============================================================================

export const sendVerificationApproved = async (
  email: string,
  userName: string
): Promise<SendEmailResult> => {
  const variables = { userName };
  const fallback = verificationApprovedTemplate(userName);
  const template = await getTemplate('verification_approved', variables, fallback);
  return sendEmail(email, template.subject, template.html, template.text);
};

export const sendVerificationRejected = async (
  email: string,
  userName: string,
  reason?: string
): Promise<SendEmailResult> => {
  const variables = { userName, reason: reason || '' };
  const fallback = verificationRejectedTemplate(userName, reason);
  const template = await getTemplate('verification_rejected', variables, fallback);
  return sendEmail(email, template.subject, template.html, template.text);
};

// Chess Title Verification Emails
export const sendChessTitleVerificationApproved = async (
  email: string,
  userName: string,
  title: string
): Promise<SendEmailResult> => {
  const variables = { userName, title };
  const fallback = chessTitleVerificationApprovedTemplate(userName, title);
  const template = await getTemplate('chess_title_verification_approved', variables, fallback);
  return sendEmail(email, template.subject, template.html, template.text);
};

export const sendChessTitleVerificationRejected = async (
  email: string,
  userName: string,
  reason: string
): Promise<SendEmailResult> => {
  const variables = { userName, reason };
  const fallback = chessTitleVerificationRejectedTemplate(userName, reason);
  const template = await getTemplate('chess_title_verification_rejected', variables, fallback);
  return sendEmail(email, template.subject, template.html, template.text);
};

// ============================================================================
// ORGANIZER NOTIFICATIONS
// ============================================================================

export const sendTournamentNewRegistrationToOrganizer = async (
  email: string,
  params: {
    organizerName: string;
    tournamentName: string;
    tournamentId: number;
    playerName: string;
    playerEmail: string;
    playerRating?: number;
    totalParticipants: number;
    maxParticipants: number;
    entryFee: number;
  }
): Promise<SendEmailResult> => {
  const fallback = tournamentNewRegistrationOrganizerTemplate(params);
  const template = await getTemplate('tournament_new_registration_organizer', params, fallback);
  return sendEmail(email, template.subject, template.html, template.text);
};

export const sendTournamentWithdrawalToOrganizer = async (
  email: string,
  params: {
    organizerName: string;
    tournamentName: string;
    tournamentId: number;
    playerName: string;
    playerEmail: string;
    totalParticipants: number;
    maxParticipants: number;
    refundProcessed?: boolean;
    refundAmount?: number;
  }
): Promise<SendEmailResult> => {
  const fallback = tournamentWithdrawalOrganizerTemplate(params);
  const template = await getTemplate('tournament_withdrawal_organizer', params, fallback);
  return sendEmail(email, template.subject, template.html, template.text);
};
