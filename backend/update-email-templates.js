/**
 * Update email templates in database with actual HTML/text content
 * This reads from the hardcoded templates and updates the database
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Base styles and wrapper (copied from emailTemplates.ts)
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

const wrapperHtml = (content) => `
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

// Define all templates with actual content
const templates = [
  {
    template_key: 'email_verification',
    subject: 'Verify your ChessFam account',
    html_content: wrapperHtml(`
    <h2 style="color: #ffffff; margin: 0 0 16px 0;">Welcome to ChessFam, {{userName}}!</h2>
    <p style="color: #cccccc; line-height: 1.6;">Thanks for signing up. Please verify your email address to get started.</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="{{verificationLink}}" style="${buttonStyles}">Verify Email Address</a>
    </div>
    <p style="color: #888888; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
    <p style="color: #8b5cf6; word-break: break-all; font-size: 12px;">{{verificationLink}}</p>
    <p style="color: #888888; font-size: 14px;">This link expires in 24 hours.</p>
  `),
    text_content: `Welcome to ChessFam, {{userName}}!

Thanks for signing up. Please verify your email by visiting:
{{verificationLink}}

This link expires in 24 hours.`,
  },
  {
    template_key: 'password_reset',
    subject: 'Reset your ChessFam password',
    html_content: wrapperHtml(`
    <h2 style="color: #ffffff; margin: 0 0 16px 0;">Password Reset Request</h2>
    <p style="color: #cccccc; line-height: 1.6;">Hi {{userName}}, we received a request to reset your password.</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="{{resetLink}}" style="${buttonStyles}">Reset Password</a>
    </div>
    <p style="color: #888888; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
    <p style="color: #8b5cf6; word-break: break-all; font-size: 12px;">{{resetLink}}</p>
    <p style="color: #888888; font-size: 14px;">This link expires in 1 hour. If you didn't request this reset, you can safely ignore this email.</p>
  `),
    text_content: `Hi {{userName}},

We received a request to reset your password. Visit this link to reset it:
{{resetLink}}

This link expires in 1 hour. If you didn't request this, ignore this email.`,
  },
  {
    template_key: 'booking_confirmation',
    subject: 'Booking Confirmed with {{masterName}}',
    html_content: wrapperHtml(`
    <h2 style="color: #ffffff; margin: 0 0 16px 0;">Booking Confirmed!</h2>
    <p style="color: #cccccc; line-height: 1.6;">Hi {{userName}}, your session has been booked.</p>
    <div style="background: #1a1a2e; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <table style="width: 100%; color: #cccccc;">
        <tr><td style="padding: 8px 0; color: #888;">Master:</td><td style="padding: 8px 0;">{{masterName}}</td></tr>
        <tr><td style="padding: 8px 0; color: #888;">Date:</td><td style="padding: 8px 0;">{{date}}</td></tr>
        <tr><td style="padding: 8px 0; color: #888;">Time:</td><td style="padding: 8px 0;">{{time}}</td></tr>
        <tr><td style="padding: 8px 0; color: #888;">Duration:</td><td style="padding: 8px 0;">{{duration}} minutes</td></tr>
        <tr><td style="padding: 8px 0; color: #888;">Amount:</td><td style="padding: 8px 0; color: #22c55e;">$` + '{{amount}}' + `</td></tr>
      </table>
    </div>
    <p style="color: #888888; font-size: 14px;">Booking ID: #{{bookingId}}</p>
  `),
    text_content: `Booking Confirmed!

Hi {{userName}}, your session has been booked.

Master: {{masterName}}
Date: {{date}}
Time: {{time}}
Duration: {{duration}} minutes
Amount: ` + '${{amount}}' + `

Booking ID: #{{bookingId}}`,
  },
  {
    template_key: 'tournament_registration',
    subject: 'Tournament Registration Confirmed: {{tournamentName}}',
    html_content: wrapperHtml(`
    <h2 style="color: #ffffff; margin: 0 0 16px 0;">Tournament Registration Confirmed!</h2>
    <p style="color: #cccccc; line-height: 1.6;">Hi {{userName}}, you're registered for {{tournamentName}}!</p>
    <div style="background: #1a1a2e; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <table style="width: 100%; color: #cccccc;">
        <tr><td style="padding: 8px 0; color: #888;">Tournament:</td><td style="padding: 8px 0;">{{tournamentName}}</td></tr>
        <tr><td style="padding: 8px 0; color: #888;">Date:</td><td style="padding: 8px 0;">{{date}}</td></tr>
        <tr><td style="padding: 8px 0; color: #888;">Time:</td><td style="padding: 8px 0;">{{time}}</td></tr>
        <tr><td style="padding: 8px 0; color: #888;">Venue:</td><td style="padding: 8px 0;">{{venue}}</td></tr>
        <tr><td style="padding: 8px 0; color: #888;">Entry Fee:</td><td style="padding: 8px 0; color: #22c55e;">$` + '{{entryFee}}' + `</td></tr>
      </table>
    </div>
    <p style="color: #888888; font-size: 14px;">Registration ID: #{{registrationId}}</p>
  `),
    text_content: `Tournament Registration Confirmed!

Hi {{userName}}, you're registered for {{tournamentName}}!

Tournament: {{tournamentName}}
Date: {{date}}
Time: {{time}}
Venue: {{venue}}
Entry Fee: ` + '${{entryFee}}' + `

Registration ID: #{{registrationId}}`,
  },
  {
    template_key: 'challenge_notification',
    subject: '{{challengerName}} has challenged you to a game!',
    html_content: wrapperHtml(`
    <h2 style="color: #ffffff; margin: 0 0 16px 0;">You've been challenged!</h2>
    <p style="color: #cccccc; line-height: 1.6;">Hi {{challengedName}}, {{challengerName}} ({{challengerRating}}) has challenged you to a game!</p>
    <div style="background: #1a1a2e; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <table style="width: 100%; color: #cccccc;">
        <tr><td style="padding: 8px 0; color: #888;">Challenger:</td><td style="padding: 8px 0;">{{challengerName}}</td></tr>
        <tr><td style="padding: 8px 0; color: #888;">Rating:</td><td style="padding: 8px 0;">{{challengerRating}}</td></tr>
        <tr><td style="padding: 8px 0; color: #888;">Venue:</td><td style="padding: 8px 0;">{{venue}}</td></tr>
        <tr><td style="padding: 8px 0; color: #888;">Message:</td><td style="padding: 8px 0;">{{message}}</td></tr>
      </table>
    </div>
  `),
    text_content: `You've been challenged!

Hi {{challengedName}}, {{challengerName}} ({{challengerRating}}) has challenged you to a game!

Challenger: {{challengerName}}
Rating: {{challengerRating}}
Venue: {{venue}}
Message: {{message}}`,
  },
  {
    template_key: 'welcome_email',
    subject: 'Welcome to ChessFam!',
    html_content: wrapperHtml(`
    <h2 style="color: #ffffff; margin: 0 0 16px 0;">Welcome to ChessFam, {{userName}}!</h2>
    <p style="color: #cccccc; line-height: 1.6;">Your email is verified. You're all set to start connecting with chess players near you!</p>
    <p style="color: #cccccc; line-height: 1.6;">Here's what you can do on ChessFam:</p>
    <ul style="color: #cccccc; line-height: 1.8;">
      <li>Play chess with grandmasters and titled players</li>
      <li>Join tournaments and compete for prizes</li>
      <li>Find local chess clubs and communities</li>
      <li>Challenge players near you</li>
      <li>Track your progress and achievements</li>
    </ul>
    <div style="text-align: center; margin: 32px 0;">
      <a href="https://chessfam.com" style="${buttonStyles}">Start Playing</a>
    </div>
  `),
    text_content: `Welcome to ChessFam, {{userName}}!

Your email is verified. You're all set to start connecting with chess players near you!

Here's what you can do on ChessFam:
- Play chess with grandmasters and titled players
- Join tournaments and compete for prizes
- Find local chess clubs and communities
- Challenge players near you
- Track your progress and achievements

Visit https://chessfam.com to get started!`,
  },
  {
    template_key: 'tournament_reminder',
    subject: 'Reminder: {{tournamentName}} starts soon!',
    html_content: wrapperHtml(`
    <h2 style="color: #ffffff; margin: 0 0 16px 0;">Tournament Starting Soon!</h2>
    <p style="color: #cccccc; line-height: 1.6;">Hi {{userName}}, don't forget about {{tournamentName}} coming up!</p>
    <div style="background: #1a1a2e; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <table style="width: 100%; color: #cccccc;">
        <tr><td style="padding: 8px 0; color: #888;">Tournament:</td><td style="padding: 8px 0;">{{tournamentName}}</td></tr>
        <tr><td style="padding: 8px 0; color: #888;">Date:</td><td style="padding: 8px 0;">{{startDate}}</td></tr>
        <tr><td style="padding: 8px 0; color: #888;">Venue:</td><td style="padding: 8px 0;">{{venue}}</td></tr>
        <tr><td style="padding: 8px 0; color: #888;">Address:</td><td style="padding: 8px 0;">{{address}}</td></tr>
      </table>
    </div>
    <p style="color: #cccccc; line-height: 1.6;">Good luck! We'll see you there.</p>
  `),
    text_content: `Tournament Starting Soon!

Hi {{userName}}, don't forget about {{tournamentName}} coming up!

Tournament: {{tournamentName}}
Date: {{startDate}}
Venue: {{venue}}
Address: {{address}}

Good luck! We'll see you there.`,
  },
  {
    template_key: 'tournament_cancellation',
    subject: 'Tournament Cancelled: {{tournamentName}}',
    html_content: wrapperHtml(`
    <h2 style="color: #ffffff; margin: 0 0 16px 0;">Tournament Cancelled</h2>
    <p style="color: #cccccc; line-height: 1.6;">Hi {{userName}}, unfortunately {{tournamentName}} has been cancelled.</p>
    <div style="background: #1a1a2e; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="color: #888; margin: 0;">Reason:</p>
      <p style="color: #cccccc; margin: 8px 0 0 0;">{{cancellationReason}}</p>
    </div>
    <p style="color: #cccccc; line-height: 1.6;">We apologize for any inconvenience. If you paid an entry fee, you will receive a full refund within 5-7 business days.</p>
  `),
    text_content: `Tournament Cancelled

Hi {{userName}}, unfortunately {{tournamentName}} has been cancelled.

Reason: {{cancellationReason}}

We apologize for any inconvenience. If you paid an entry fee, you will receive a full refund within 5-7 business days.`,
  },
  {
    template_key: 'tournament_update',
    subject: 'Update: {{tournamentName}}',
    html_content: wrapperHtml(`
    <h2 style="color: #ffffff; margin: 0 0 16px 0;">Tournament Update</h2>
    <p style="color: #cccccc; line-height: 1.6;">Hi {{userName}}, there's an update for {{tournamentName}}:</p>
    <div style="background: #1a1a2e; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="color: #cccccc; margin: 0;">{{updateMessage}}</p>
    </div>
    <p style="color: #888888; font-size: 14px;">Please check the tournament page for more details.</p>
  `),
    text_content: `Tournament Update

Hi {{userName}}, there's an update for {{tournamentName}}:

{{updateMessage}}

Please check the tournament page for more details.`,
  },
  {
    template_key: 'club_membership_confirmation',
    subject: 'Welcome to {{clubName}}!',
    html_content: wrapperHtml(`
    <h2 style="color: #ffffff; margin: 0 0 16px 0;">Welcome to {{clubName}}!</h2>
    <p style="color: #cccccc; line-height: 1.6;">Hi {{userName}}, you're now a member of {{clubName}}!</p>
    <div style="background: #1a1a2e; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="color: #cccccc; margin: 0;">{{clubDescription}}</p>
    </div>
    <p style="color: #cccccc; line-height: 1.6;">Check your club dashboard for upcoming events, announcements, and to connect with other members.</p>
  `),
    text_content: `Welcome to {{clubName}}!

Hi {{userName}}, you're now a member of {{clubName}}!

{{clubDescription}}

Check your club dashboard for upcoming events, announcements, and to connect with other members.`,
  },
  {
    template_key: 'new_club_notification',
    subject: 'New chess club in {{city}}: {{clubName}}',
    html_content: wrapperHtml(`
    <h2 style="color: #ffffff; margin: 0 0 16px 0;">New Club Near You!</h2>
    <p style="color: #cccccc; line-height: 1.6;">Hi {{userName}}, a new chess club has opened in {{city}}!</p>
    <div style="background: #1a1a2e; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <h3 style="color: #8b5cf6; margin: 0 0 12px 0;">{{clubName}}</h3>
      <p style="color: #cccccc; margin: 0;">{{clubDescription}}</p>
    </div>
    <div style="text-align: center; margin: 32px 0;">
      <a href="https://chessfam.com/club/{{clubId}}" style="${buttonStyles}">View Club</a>
    </div>
  `),
    text_content: `New Club Near You!

Hi {{userName}}, a new chess club has opened in {{city}}!

{{clubName}}

{{clubDescription}}

Visit https://chessfam.com/club/{{clubId}} to learn more.`,
  },
  {
    template_key: 'verification_approved',
    subject: 'Your identity verification was approved!',
    html_content: wrapperHtml(`
    <h2 style="color: #ffffff; margin: 0 0 16px 0;">Verification Approved! ✓</h2>
    <p style="color: #cccccc; line-height: 1.6;">Hi {{userName}}, your identity verification has been approved!</p>
    <div style="background: #22c55e20; border: 1px solid #22c55e40; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="color: #22c55e; margin: 0; font-weight: 600;">✓ You now have a verified badge on your profile</p>
    </div>
    <p style="color: #cccccc; line-height: 1.6;">This helps other players know you're a trusted member of the ChessFam community.</p>
  `),
    text_content: `Verification Approved!

Hi {{userName}}, your identity verification has been approved! You now have a verified badge on your profile.

This helps other players know you're a trusted member of the ChessFam community.`,
  },
  {
    template_key: 'verification_rejected',
    subject: 'Your identity verification was not approved',
    html_content: wrapperHtml(`
    <h2 style="color: #ffffff; margin: 0 0 16px 0;">Verification Not Approved</h2>
    <p style="color: #cccccc; line-height: 1.6;">Hi {{userName}}, unfortunately your identity verification was not approved.</p>
    <div style="background: #1a1a2e; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="color: #888; margin: 0 0 8px 0;">Reason:</p>
      <p style="color: #cccccc; margin: 0;">{{reason}}</p>
    </div>
    <p style="color: #cccccc; line-height: 1.6;">You can submit a new verification request from your profile settings if you'd like to try again.</p>
  `),
    text_content: `Verification Not Approved

Hi {{userName}}, unfortunately your identity verification was not approved.

Reason: {{reason}}

You can submit a new verification request from your profile settings if you'd like to try again.`,
  },
];

async function updateEmailTemplates() {
  let client;
  try {
    client = await pool.connect();
    console.log('Connected to database');
    console.log('\n📧 Updating email templates with actual content...\n');

    let updated = 0;
    let notFound = 0;

    for (const template of templates) {
      const result = await client.query(
        `UPDATE email_templates
         SET html_content = $1,
             text_content = $2,
             subject = $3,
             updated_at = NOW()
         WHERE template_key = $4
         RETURNING id, template_name`,
        [template.html_content, template.text_content, template.subject, template.template_key]
      );

      if (result.rows.length > 0) {
        console.log(`✅ Updated: ${result.rows[0].template_name}`);
        updated++;
      } else {
        console.log(`⚠️  Not found: ${template.template_key}`);
        notFound++;
      }
    }

    console.log('\n===== Email Templates Update Complete =====');
    console.log(`✅ Updated: ${updated} templates`);
    console.log(`⚠️  Not found: ${notFound} templates`);
    console.log('\n💡 All templates now have proper HTML and text content!');
    console.log('   Go to /admin/email-templates to preview them.');

    client.release();
    await pool.end();
  } catch (error) {
    console.error('Error updating email templates:', error);
    if (client) {
      client.release();
    }
    await pool.end();
    process.exit(1);
  }
}

updateEmailTemplates();
