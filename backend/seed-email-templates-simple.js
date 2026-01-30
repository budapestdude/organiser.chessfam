/**
 * Simplified seed script to import email templates into the database
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const fs = require('fs');
const path = require('path');

async function seedEmailTemplates() {
  let client;
  try {
    client = await pool.connect();
    console.log('Connected to database');

    // Check if templates already exist
    const existingCount = await client.query('SELECT COUNT(*) FROM email_templates');
    const count = parseInt(existingCount.rows[0].count);

    if (count > 0) {
      console.log(`\n⚠️  Found ${count} existing email templates in database.`);
      console.log('To reseed, first delete existing templates:');
      console.log('  DELETE FROM email_templates;');
      client.release();
      await pool.end();
      return;
    }

    // Read the emailTemplates.ts file and extract template info
    const templatesPath = path.join(__dirname, 'src/services/emailTemplates.ts');
    
    // Define templates with metadata (we'll use the hardcoded templates as defaults)
    const templates = [
      {
        template_key: 'email_verification',
        template_name: 'Email Verification',
        subject: 'Verify your ChessFam account',
        category: 'Authentication',
        variables: ['userName', 'verificationLink'],
      },
      {
        template_key: 'password_reset',
        template_name: 'Password Reset',
        subject: 'Reset your ChessFam password',
        category: 'Authentication',
        variables: ['userName', 'resetLink'],
      },
      {
        template_key: 'booking_confirmation',
        template_name: 'Booking Confirmation',
        subject: 'Booking Confirmed with {{masterName}}',
        category: 'Bookings',
        variables: ['userName', 'masterName', 'date', 'time', 'duration', 'amount', 'bookingId'],
      },
      {
        template_key: 'tournament_registration',
        template_name: 'Tournament Registration Confirmation',
        subject: 'Tournament Registration Confirmed: {{tournamentName}}',
        category: 'Tournaments',
        variables: ['userName', 'tournamentName', 'date', 'time', 'venue', 'entryFee', 'registrationId'],
      },
      {
        template_key: 'challenge_notification',
        template_name: 'Challenge Notification',
        subject: '{{challengerName}} has challenged you to a game!',
        category: 'Challenges',
        variables: ['challengedName', 'challengerName', 'challengerRating', 'venue', 'message', 'challengeId'],
      },
      {
        template_key: 'welcome_email',
        template_name: 'Welcome Email',
        subject: 'Welcome to ChessFam!',
        category: 'Authentication',
        variables: ['userName'],
      },
      {
        template_key: 'tournament_reminder',
        template_name: 'Tournament Reminder',
        subject: 'Reminder: {{tournamentName}} starts soon!',
        category: 'Tournaments',
        variables: ['userName', 'tournamentName', 'tournamentId', 'startDate', 'venue', 'address'],
      },
      {
        template_key: 'tournament_cancellation',
        template_name: 'Tournament Cancellation',
        subject: 'Tournament Cancelled: {{tournamentName}}',
        category: 'Tournaments',
        variables: ['userName', 'tournamentName', 'cancellationReason'],
      },
      {
        template_key: 'tournament_update',
        template_name: 'Tournament Update',
        subject: 'Update: {{tournamentName}}',
        category: 'Tournaments',
        variables: ['userName', 'tournamentName', 'tournamentId', 'updateMessage'],
      },
      {
        template_key: 'club_membership_confirmation',
        template_name: 'Club Membership Confirmation',
        subject: 'Welcome to {{clubName}}!',
        category: 'Clubs',
        variables: ['userName', 'clubName', 'clubId', 'clubDescription'],
      },
      {
        template_key: 'new_club_notification',
        template_name: 'New Club Notification',
        subject: 'New chess club in {{city}}: {{clubName}}',
        category: 'Clubs',
        variables: ['userName', 'clubName', 'clubId', 'clubDescription', 'city'],
      },
      {
        template_key: 'verification_approved',
        template_name: 'Identity Verification Approved',
        subject: 'Your identity verification was approved!',
        category: 'Verification',
        variables: ['userName'],
      },
      {
        template_key: 'verification_rejected',
        template_name: 'Identity Verification Rejected',
        subject: 'Your identity verification was not approved',
        category: 'Verification',
        variables: ['userName', 'reason'],
      },
    ];

    console.log('\n📧 Seeding email templates...\n');
    
    let inserted = 0;
    for (const template of templates) {
      // Simple HTML and text content - will be customized later via admin panel
      const html_content = `<p>Hi {{userName}},</p><p>This is the ${template.template_name} email template.</p><p>Edit this template in the admin panel at /admin/email-templates</p>`;
      const text_content = `Hi {{userName}}, This is the ${template.template_name} email template. Edit this template in the admin panel.`;

      await client.query(
        `INSERT INTO email_templates
          (template_key, template_name, subject, html_content, text_content, variables, category, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          template.template_key,
          template.template_name,
          template.subject,
          html_content,
          text_content,
          JSON.stringify(template.variables),
          template.category,
          true,
        ]
      );

      console.log(`✅ Inserted: ${template.template_name}`);
      inserted++;
    }

    console.log('\n===== Email Template Seeding Complete =====');
    console.log(`✅ Inserted: ${inserted} templates`);
    console.log('\n💡 Next steps:');
    console.log('1. Go to /admin/email-templates');
    console.log('2. Edit each template with proper HTML and styling');
    console.log('3. Templates will be used automatically by the email service');

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
