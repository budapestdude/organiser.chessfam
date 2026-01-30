-- Migration 042: Notification System for Automated Messages
-- Adds system notifications for tournaments, clubs, and platform messages

-- ============================================
-- CREATE SYSTEM NOTIFICATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  related_entity_type VARCHAR(50),
  related_entity_id INTEGER,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications(read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_entity ON notifications(related_entity_type, related_entity_id);

COMMENT ON TABLE notifications IS 'System notifications for users (tournament joins, club joins, platform messages)';
COMMENT ON COLUMN notifications.type IS 'Type of notification: tournament_join, club_join, system_message, game_invite, etc.';
COMMENT ON COLUMN notifications.related_entity_type IS 'Type of related entity: tournament, club, game, etc.';
COMMENT ON COLUMN notifications.related_entity_id IS 'ID of the related entity';

-- ============================================
-- CREATE SYSTEM USER FOR AUTOMATED MESSAGES
-- ============================================
-- Create a special ChessFam system user for sending automated messages

DO $$
BEGIN
  -- Check if system user already exists
  IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'system@chessfam.com') THEN
    INSERT INTO users (
      name,
      email,
      password_hash,
      is_verified,
      created_at
    ) VALUES (
      'ChessFam',
      'system@chessfam.com',
      '$2a$10$SYSTEMUSER.NOLOGIN.HASH',  -- Invalid hash, can't login
      true,
      NOW()
    );
  END IF;
END $$;

COMMENT ON TABLE notifications IS 'System user for automated platform messages';

-- ============================================
-- CREATE NOTIFICATION PREFERENCES TABLE
-- ============================================
-- Allow users to control which notifications they receive

CREATE TABLE IF NOT EXISTS notification_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  tournament_join_enabled BOOLEAN DEFAULT TRUE,
  club_join_enabled BOOLEAN DEFAULT TRUE,
  game_invite_enabled BOOLEAN DEFAULT TRUE,
  system_messages_enabled BOOLEAN DEFAULT TRUE,
  email_notifications_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user ON notification_preferences(user_id);

COMMENT ON TABLE notification_preferences IS 'User preferences for notification types';

-- ============================================
-- FUNCTION TO SEND NOTIFICATION
-- ============================================

CREATE OR REPLACE FUNCTION send_notification(
  p_user_id INTEGER,
  p_type VARCHAR(50),
  p_title VARCHAR(255),
  p_message TEXT,
  p_related_entity_type VARCHAR(50) DEFAULT NULL,
  p_related_entity_id INTEGER DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  v_notification_id INTEGER;
  v_preferences RECORD;
BEGIN
  -- Get user preferences
  SELECT * INTO v_preferences
  FROM notification_preferences
  WHERE user_id = p_user_id;

  -- If no preferences exist, create default ones and send notification
  IF NOT FOUND THEN
    INSERT INTO notification_preferences (user_id)
    VALUES (p_user_id)
    RETURNING * INTO v_preferences;
  END IF;

  -- Check if this notification type is enabled
  IF (p_type = 'tournament_join' AND v_preferences.tournament_join_enabled) OR
     (p_type = 'club_join' AND v_preferences.club_join_enabled) OR
     (p_type = 'game_invite' AND v_preferences.game_invite_enabled) OR
     (p_type = 'system_message' AND v_preferences.system_messages_enabled) OR
     (p_type NOT IN ('tournament_join', 'club_join', 'game_invite', 'system_message')) THEN

    -- Insert notification
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      related_entity_type,
      related_entity_id
    ) VALUES (
      p_user_id,
      p_type,
      p_title,
      p_message,
      p_related_entity_type,
      p_related_entity_id
    ) RETURNING id INTO v_notification_id;

    RETURN v_notification_id;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION send_notification IS 'Send a notification to a user, respecting their preferences';

-- ============================================
-- CREATE AUTOMATED MESSAGE TRIGGERS
-- ============================================

-- Trigger for tournament registrations
CREATE OR REPLACE FUNCTION notify_tournament_registration()
RETURNS TRIGGER AS $$
DECLARE
  v_tournament_name VARCHAR(255);
  v_tournament_date DATE;
  v_organizer_name VARCHAR(255);
  v_system_user_id INTEGER;
BEGIN
  -- Get tournament details
  SELECT name, start_date INTO v_tournament_name, v_tournament_date
  FROM tournaments
  WHERE id = NEW.tournament_id;

  -- Get organizer name
  SELECT u.name INTO v_organizer_name
  FROM tournaments t
  JOIN users u ON t.organizer_id = u.id
  WHERE t.id = NEW.tournament_id;

  -- Get system user ID
  SELECT id INTO v_system_user_id FROM users WHERE email = 'system@chessfam.com';

  -- Send notification
  PERFORM send_notification(
    NEW.user_id,
    'tournament_join',
    'Welcome to ' || v_tournament_name || '!',
    'You have successfully registered for ' || v_tournament_name ||
    ' organized by ' || COALESCE(v_organizer_name, 'the organizer') ||
    '. The tournament starts on ' || TO_CHAR(v_tournament_date, 'Month DD, YYYY') ||
    '. Good luck and have fun!',
    'tournament',
    NEW.tournament_id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_tournament_registration_notification
AFTER INSERT ON tournament_registrations
FOR EACH ROW
EXECUTE FUNCTION notify_tournament_registration();

-- Trigger for club memberships
CREATE OR REPLACE FUNCTION notify_club_membership()
RETURNS TRIGGER AS $$
DECLARE
  v_club_name VARCHAR(255);
  v_club_description TEXT;
  v_system_user_id INTEGER;
BEGIN
  -- Get club details
  SELECT name, description INTO v_club_name, v_club_description
  FROM clubs
  WHERE id = NEW.club_id;

  -- Get system user ID
  SELECT id INTO v_system_user_id FROM users WHERE email = 'system@chessfam.com';

  -- Send notification
  PERFORM send_notification(
    NEW.user_id,
    'club_join',
    'Welcome to ' || v_club_name || '!',
    'You have successfully joined ' || v_club_name ||
    '. Connect with other members, participate in events, and enjoy the community!',
    'club',
    NEW.club_id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_club_membership_notification
AFTER INSERT ON club_memberships
FOR EACH ROW
WHEN (NEW.status = 'active')
EXECUTE FUNCTION notify_club_membership();

COMMENT ON TRIGGER trigger_tournament_registration_notification ON tournament_registrations
  IS 'Send welcome notification when user registers for tournament';
COMMENT ON TRIGGER trigger_club_membership_notification ON club_memberships
  IS 'Send welcome notification when user joins a club';

-- ============================================
-- SEND WELCOME MESSAGE TO ALL EXISTING USERS
-- ============================================

DO $$
DECLARE
  v_user RECORD;
  v_system_user_id INTEGER;
BEGIN
  -- Get system user ID
  SELECT id INTO v_system_user_id FROM users WHERE email = 'system@chessfam.com';

  -- Send welcome notification to all existing users
  FOR v_user IN SELECT id FROM users WHERE email != 'system@chessfam.com' LOOP
    PERFORM send_notification(
      v_user.id,
      'system_message',
      'Welcome to ChessFam!',
      'Welcome to ChessFam, the premier platform for chess players to connect, compete, and grow! ' ||
      'Join tournaments, find games, connect with other players, and track your progress. ' ||
      'We''re excited to have you as part of our community!',
      NULL,
      NULL
    );
  END LOOP;
END $$;
