import cron from 'node-cron';
import pool from '../config/database';
import { resend, emailConfig } from '../config/email';
import { syncSubscriptionFromStripe } from './subscriptionService';
import { sendCustomEmail } from './emailService';

/**
 * Initialize all cron jobs for game scheduling
 */
export const initScheduler = () => {
  console.log('[Scheduler] Initializing cron jobs...');

  // Process scheduled notifications every hour
  cron.schedule('0 * * * *', async () => {
    console.log('[Scheduler] Running: Process scheduled notifications');
    await processScheduledNotifications();
  });

  // Create recurring games daily at 1 AM
  cron.schedule('0 1 * * *', async () => {
    console.log('[Scheduler] Running: Create recurring games');
    await createRecurringGames();
  });

  // Schedule reminders for upcoming games every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    console.log('[Scheduler] Running: Schedule game reminders');
    await scheduleGameReminders();
  });

  // Expire old waitlist entries daily at 2 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('[Scheduler] Running: Expire old waitlist entries');
    await expireOldWaitlistEntries();
  });

  // Reset monthly game quotas on the 1st of each month at 00:00
  cron.schedule('0 0 1 * *', async () => {
    console.log('[Scheduler] Running: Reset monthly quotas');
    await resetMonthlyQuotas();
  });

  // Check for trial expirations daily at 3 AM
  cron.schedule('0 3 * * *', async () => {
    console.log('[Scheduler] Running: Expire trials');
    await expireTrials();
  });

  // Sync subscriptions from Stripe every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    console.log('[Scheduler] Running: Sync subscriptions');
    await syncSubscriptions();
  });

  // Auto-checkout all users from venues at midnight every day
  cron.schedule('0 0 * * *', async () => {
    console.log('[Scheduler] Running: Auto-checkout all venue checkins');
    await autoCheckoutAllVenues();
  });

  console.log('[Scheduler] Cron jobs initialized successfully');
};

/**
 * Process scheduled notifications that are due
 */
async function processScheduledNotifications() {
  try {
    const result = await pool.query(
      `SELECT sn.*, u.email, u.name, g.venue_name, g.game_date, g.game_time
       FROM scheduled_notifications sn
       JOIN users u ON sn.user_id = u.id
       JOIN games g ON sn.game_id = g.id
       WHERE sn.sent = FALSE
         AND sn.scheduled_for <= NOW()
         AND g.status NOT IN ('cancelled', 'completed')
       LIMIT 100`
    );

    console.log(`[Scheduler] Processing ${result.rows.length} scheduled notifications`);

    for (const notification of result.rows) {
      const { id, user_id, game_id, notification_type, email, name, venue_name, game_date, game_time } = notification;

      // Get user preferences
      const prefsResult = await pool.query(
        'SELECT * FROM notification_preferences WHERE user_id = $1',
        [user_id]
      );
      const prefs = prefsResult.rows[0] || { email_game_reminders: true };

      let emailSent = false;

      // Send email based on type and preferences
      if (notification_type === 'reminder' && prefs.email_game_reminders) {
        const emailResult = await sendGameReminderEmail(email, name, venue_name, game_date, game_time, game_id);
        emailSent = emailResult.success;
      } else if (notification_type === 'game_update' && prefs.email_game_updates) {
        const emailResult = await sendGameUpdateEmail(email, name, game_id);
        emailSent = emailResult.success;
      } else if (notification_type === 'waitlist_spot') {
        const emailResult = await sendSpotAvailableEmail(email, name, game_id);
        emailSent = emailResult.success;
      }

      // Mark as sent
      await pool.query(
        `UPDATE scheduled_notifications
         SET sent = TRUE, sent_at = NOW(), email_sent = $1
         WHERE id = $2`,
        [emailSent, id]
      );
    }

    console.log(`[Scheduler] Processed ${result.rows.length} notifications`);
  } catch (error) {
    console.error('[Scheduler] Error processing notifications:', error);
  }
}

/**
 * Schedule reminders for upcoming games
 */
async function scheduleGameReminders() {
  try {
    // Find games in next 48 hours that don't have reminders scheduled
    const result = await pool.query(
      `SELECT DISTINCT g.id, g.game_date, g.game_time, g.creator_id
       FROM games g
       WHERE g.status IN ('open', 'full')
         AND g.game_date >= CURRENT_DATE
         AND g.game_date <= CURRENT_DATE + INTERVAL '48 hours'
         AND g.reminder_sent = FALSE`
    );

    console.log(`[Scheduler] Scheduling reminders for ${result.rows.length} games`);

    for (const game of result.rows) {
      // Get all participants (creator + joined users)
      const participantsResult = await pool.query(
        `SELECT user_id FROM game_participants WHERE game_id = $1 AND status = 'confirmed'
         UNION
         SELECT creator_id FROM games WHERE id = $1`,
        [game.id]
      );

      for (const participant of participantsResult.rows) {
        const userId = participant.user_id || participant.creator_id;

        // Get user preferences for reminder timing
        const prefsResult = await pool.query(
          'SELECT reminder_hours_before FROM notification_preferences WHERE user_id = $1',
          [userId]
        );
        const hoursBefore = prefsResult.rows[0]?.reminder_hours_before || 24;

        const gameDateTime = new Date(`${game.game_date}T${game.game_time}`);
        const reminderTime = new Date(gameDateTime.getTime() - hoursBefore * 60 * 60 * 1000);

        // Only schedule if reminder time is in the future
        if (reminderTime > new Date()) {
          await pool.query(
            `INSERT INTO scheduled_notifications (user_id, game_id, notification_type, scheduled_for)
             VALUES ($1, $2, 'reminder', $3)
             ON CONFLICT DO NOTHING`,
            [userId, game.id, reminderTime]
          );
        }
      }

      // Mark game as having reminders scheduled
      await pool.query(
        'UPDATE games SET reminder_sent = TRUE WHERE id = $1',
        [game.id]
      );
    }

    console.log(`[Scheduler] Scheduled reminders for ${result.rows.length} games`);
  } catch (error) {
    console.error('[Scheduler] Error scheduling reminders:', error);
  }
}

/**
 * Create instances of recurring games
 */
async function createRecurringGames() {
  try {
    const result = await pool.query(
      `SELECT * FROM games
       WHERE is_recurring = TRUE
         AND status IN ('open', 'full', 'completed')
         AND (recurrence_end_date IS NULL OR recurrence_end_date >= CURRENT_DATE)
       ORDER BY id`
    );

    console.log(`[Scheduler] Found ${result.rows.length} recurring games to process`);

    for (const parentGame of result.rows) {
      const { id, recurrence_pattern, recurrence_day, game_date, game_time, recurrence_end_date } = parentGame;

      // Calculate next occurrence
      let nextDate = new Date(game_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Find the next occurrence after today
      while (nextDate <= today) {
        switch (recurrence_pattern) {
          case 'weekly':
            nextDate.setDate(nextDate.getDate() + 7);
            break;
          case 'biweekly':
            nextDate.setDate(nextDate.getDate() + 14);
            break;
          case 'monthly':
            nextDate.setMonth(nextDate.getMonth() + 1);
            break;
          default:
            console.warn(`[Scheduler] Unknown recurrence pattern: ${recurrence_pattern}`);
            continue;
        }
      }

      // Check if we're past the end date
      if (recurrence_end_date) {
        const endDate = new Date(recurrence_end_date);
        if (nextDate > endDate) {
          console.log(`[Scheduler] Game ${id} past recurrence end date, skipping`);
          continue;
        }
      }

      const nextDateStr = nextDate.toISOString().split('T')[0];

      // Check if this occurrence already exists
      const existingResult = await pool.query(
        `SELECT id FROM games
         WHERE parent_game_id = $1 AND game_date = $2`,
        [id, nextDateStr]
      );

      if (existingResult.rows.length === 0) {
        // Create new game instance
        await pool.query(
          `INSERT INTO games (
            creator_id, venue_name, venue_address, venue_lat, venue_lng,
            game_date, game_time, duration_minutes, time_control, player_level,
            max_players, description, is_recurring, recurrence_pattern,
            recurrence_day, recurrence_end_date, parent_game_id, min_rating, max_rating
          ) SELECT
            creator_id, venue_name, venue_address, venue_lat, venue_lng,
            $1, game_time, duration_minutes, time_control, player_level,
            max_players, description, TRUE, recurrence_pattern,
            recurrence_day, recurrence_end_date, $2, min_rating, max_rating
          FROM games WHERE id = $2`,
          [nextDateStr, id]
        );

        console.log(`[Scheduler] Created recurring game instance for parent ${id} on ${nextDateStr}`);
      }
    }

    console.log(`[Scheduler] Recurring games processing complete`);
  } catch (error) {
    console.error('[Scheduler] Error creating recurring games:', error);
  }
}

/**
 * Expire old waitlist entries for games that have started or been cancelled
 */
async function expireOldWaitlistEntries() {
  try {
    const result = await pool.query(
      `UPDATE game_waitlist
       SET status = 'expired'
       WHERE status = 'waiting'
         AND game_id IN (
           SELECT id FROM games
           WHERE status IN ('cancelled', 'completed')
              OR (game_date < CURRENT_DATE)
              OR (game_date = CURRENT_DATE AND game_time < CURRENT_TIME)
         )
       RETURNING *`
    );

    console.log(`[Scheduler] Expired ${result.rows.length} old waitlist entries`);
  } catch (error) {
    console.error('[Scheduler] Error expiring waitlist entries:', error);
  }
}

// ============================================
// EMAIL HELPER FUNCTIONS
// ============================================

async function sendGameReminderEmail(email: string, name: string, venueName: string, gameDate: string, gameTime: string, gameId: number) {
  const subject = `Reminder: Your chess game is tomorrow!`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Game Reminder</h2>
      <p>Hi ${name},</p>
      <p>This is a reminder that you have a chess game scheduled:</p>
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Venue:</strong> ${venueName}</p>
        <p><strong>Date:</strong> ${new Date(gameDate).toLocaleDateString()}</p>
        <p><strong>Time:</strong> ${gameTime}</p>
      </div>
      <p>
        <a href="${emailConfig.frontendUrl}/games/${gameId}"
           style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          View Game Details
        </a>
      </p>
      <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
        Good luck and have fun!<br>
        ChessFam Team
      </p>
    </div>
  `;
  const text = `Hi ${name}, this is a reminder that you have a chess game at ${venueName} on ${gameDate} at ${gameTime}. View details: ${emailConfig.frontendUrl}/games/${gameId}`;

  if (!resend) {
    console.log(`[Email] Would send game reminder to ${email}`);
    return { success: true };
  }

  try {
    await resend.emails.send({
      from: `${emailConfig.fromName} <${emailConfig.fromEmail}>`,
      to: [email],
      subject,
      html,
      text,
    });
    return { success: true };
  } catch (error) {
    console.error('[Email] Failed to send game reminder:', error);
    return { success: false };
  }
}

async function sendGameUpdateEmail(email: string, name: string, gameId: number) {
  const subject = `Game Updated - Check the Details`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Game Details Changed</h2>
      <p>Hi ${name},</p>
      <p>A game you're participating in has been updated. Please check the new details:</p>
      <p>
        <a href="${emailConfig.frontendUrl}/games/${gameId}"
           style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          View Updated Game
        </a>
      </p>
    </div>
  `;
  const text = `Hi ${name}, a game you're participating in has been updated. View details: ${emailConfig.frontendUrl}/games/${gameId}`;

  if (!resend) {
    console.log(`[Email] Would send game update to ${email}`);
    return { success: true };
  }

  try {
    await resend.emails.send({
      from: `${emailConfig.fromName} <${emailConfig.fromEmail}>`,
      to: [email],
      subject,
      html,
      text,
    });
    return { success: true };
  } catch (error) {
    console.error('[Email] Failed to send game update:', error);
    return { success: false };
  }
}

async function sendSpotAvailableEmail(email: string, name: string, gameId: number) {
  const subject = `A Spot is Available in Your Waitlisted Game!`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #10b981;">Spot Available!</h2>
      <p>Hi ${name},</p>
      <p>Great news! A spot has opened up in a game you're waitlisted for.</p>
      <p>Join quickly before it fills up again:</p>
      <p>
        <a href="${emailConfig.frontendUrl}/games/${gameId}"
           style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Join Game Now
        </a>
      </p>
    </div>
  `;
  const text = `Hi ${name}, a spot is available in a game you're waitlisted for! Join now: ${emailConfig.frontendUrl}/games/${gameId}`;

  if (!resend) {
    console.log(`[Email] Would send spot available notification to ${email}`);
    return { success: true };
  }

  try {
    await resend.emails.send({
      from: `${emailConfig.fromName} <${emailConfig.fromEmail}>`,
      to: [email],
      subject,
      html,
      text,
    });
    return { success: true };
  } catch (error) {
    console.error('[Email] Failed to send spot available email:', error);
    return { success: false };
  }
}

/**
 * Reset monthly game creation quotas for all users
 */
async function resetMonthlyQuotas() {
  try {
    const result = await pool.query(
      `UPDATE users
       SET games_created_this_month = 0,
           quota_reset_date = DATE_TRUNC('month', NOW()) + INTERVAL '1 month'
       WHERE quota_reset_date <= NOW()
       RETURNING id`
    );

    console.log(`[Scheduler] Reset quotas for ${result.rows.length} users`);
  } catch (error) {
    console.error('[Scheduler] Error resetting quotas:', error);
  }
}

/**
 * Expire trials and downgrade users to free tier
 */
async function expireTrials() {
  try {
    const result = await pool.query(
      `UPDATE users
       SET subscription_tier = 'free'
       WHERE trial_ends_at <= NOW()
         AND subscription_tier = 'free'
         AND trial_ends_at IS NOT NULL
       RETURNING id, email, name`
    );

    console.log(`[Scheduler] Expired ${result.rows.length} trials`);

    // Send email notifications
    for (const user of result.rows) {
      await sendTrialExpiredEmail(user.email, user.name).catch((err) =>
        console.error('Failed to send trial expired email:', err)
      );
    }
  } catch (error) {
    console.error('[Scheduler] Error expiring trials:', error);
  }
}

/**
 * Sync active subscriptions from Stripe
 */
async function syncSubscriptions() {
  try {
    const result = await pool.query(
      `SELECT stripe_subscription_id
       FROM subscriptions
       WHERE status IN ('active', 'trialing')
         AND stripe_subscription_id IS NOT NULL`
    );

    console.log(`[Scheduler] Syncing ${result.rows.length} active subscriptions`);

    for (const sub of result.rows) {
      try {
        await syncSubscriptionFromStripe(sub.stripe_subscription_id);
      } catch (error) {
        console.error(`[Scheduler] Failed to sync subscription ${sub.stripe_subscription_id}:`, error);
      }
    }

    console.log(`[Scheduler] Subscription sync complete`);
  } catch (error) {
    console.error('[Scheduler] Error syncing subscriptions:', error);
  }
}

/**
 * Send trial expired email notification
 */
async function sendTrialExpiredEmail(email: string, name: string) {
  await sendCustomEmail({
    to: email,
    subject: 'Your ChessFam Premium trial has ended',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Trial Period Ended</h2>
        <p>Hi ${name},</p>
        <p>Your 14-day free trial of ChessFam Premium has ended. You're now on our Free plan with the following limits:</p>
        <ul>
          <li>Create up to 10 games per month</li>
          <li>Join unlimited games</li>
          <li>Access to community features</li>
        </ul>
        <p>Upgrade to Premium to unlock unlimited game creation and more benefits:</p>
        <p>
          <a href="${process.env.FRONTEND_URL}/premium"
             style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Upgrade to Premium
          </a>
        </p>
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          Thank you for trying ChessFam Premium!<br>
          ChessFam Team
        </p>
      </div>
    `,
  });
}

/**
 * Automatically checkout all users from all venues
 * Runs at midnight every day
 */
async function autoCheckoutAllVenues() {
  try {
    const result = await pool.query(
      `DELETE FROM venue_checkins
       WHERE checked_out_at IS NULL
       RETURNING id, user_id, venue_id`
    );

    console.log(`[Scheduler] Auto-checked out ${result.rows.length} users from venues`);
  } catch (error) {
    console.error('[Scheduler] Error auto-checking out users:', error);
  }
}

// Export email functions for use in other controllers
export { sendGameReminderEmail, sendGameUpdateEmail, sendSpotAvailableEmail };
