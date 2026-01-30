-- Migration 062: Fix notification preferences columns
-- Ensures all required columns exist and recreates the send_notification function

-- Add missing columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notification_preferences' AND column_name = 'tournament_join_enabled'
  ) THEN
    ALTER TABLE notification_preferences ADD COLUMN tournament_join_enabled BOOLEAN DEFAULT TRUE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notification_preferences' AND column_name = 'club_join_enabled'
  ) THEN
    ALTER TABLE notification_preferences ADD COLUMN club_join_enabled BOOLEAN DEFAULT TRUE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notification_preferences' AND column_name = 'game_invite_enabled'
  ) THEN
    ALTER TABLE notification_preferences ADD COLUMN game_invite_enabled BOOLEAN DEFAULT TRUE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notification_preferences' AND column_name = 'system_messages_enabled'
  ) THEN
    ALTER TABLE notification_preferences ADD COLUMN system_messages_enabled BOOLEAN DEFAULT TRUE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notification_preferences' AND column_name = 'email_notifications_enabled'
  ) THEN
    ALTER TABLE notification_preferences ADD COLUMN email_notifications_enabled BOOLEAN DEFAULT TRUE;
  END IF;
END $$;

-- Recreate the send_notification function to ensure it's correct
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
