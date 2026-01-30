-- Create FAQ table for managing frequently asked questions
CREATE TABLE IF NOT EXISTS faqs (
  id SERIAL PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category VARCHAR(100) DEFAULT 'General',
  display_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for ordering
CREATE INDEX IF NOT EXISTS idx_faqs_display_order ON faqs(display_order);
CREATE INDEX IF NOT EXISTS idx_faqs_category ON faqs(category);
CREATE INDEX IF NOT EXISTS idx_faqs_published ON faqs(is_published);

-- Insert some default FAQs (only if table is empty)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM faqs LIMIT 1) THEN
    INSERT INTO faqs (question, answer, category, display_order) VALUES
    ('What is ChessFam?', 'ChessFam is the premier platform for premium chess experiences. We connect chess players with masters for private games, help you find tournaments, clubs, and other players in your area.', 'General', 1),
    ('How do I book a game with a master?', 'Browse our Masters section, select a master you''d like to play against, choose a time slot that works for you, and complete the booking. You''ll receive a confirmation with details about your upcoming game.', 'Games', 2),
    ('How do I register for a tournament?', 'Visit the Tournaments page, find a tournament you''re interested in, and click the Register button. You''ll be guided through the registration and payment process.', 'Tournaments', 3),
    ('What payment methods do you accept?', 'We accept all major credit cards and debit cards through our secure payment processor.', 'Payments', 4),
    ('Can I get a refund if I need to cancel?', 'Refund policies vary depending on the type of booking. Tournament registrations typically follow the organizer''s refund policy. Master game bookings may be refunded if cancelled at least 24 hours in advance. Please see our full refund policy for details.', 'Payments', 5),
    ('How do I become a verified master?', 'Click "Apply to be a Master" in the Masters section. You''ll need to provide proof of your chess rating and credentials. Our team will review your application and contact you within 3-5 business days.', 'Masters', 6),
    ('Can I organize my own tournament?', 'Yes! Click "Create Tournament" in the Tournaments section. You can set up all the details, manage registrations, and collect payments through our platform.', 'Tournaments', 7),
    ('How do I create or claim a club?', 'If your club isn''t listed, you can create it from the Clubs page. If it already exists, you can claim ownership by providing verification that you represent the club.', 'Clubs', 8),
    ('Is ChessFam Premium worth it?', 'ChessFam Premium gives you unlimited access to all features, priority booking with masters, exclusive tournaments, and ad-free browsing. It''s perfect for serious chess players who want the full experience.', 'Premium', 9),
    ('How do I contact support?', 'You can reach our support team through the Help Center or by emailing support@chessfam.com. We typically respond within 24 hours.', 'General', 10);
  END IF;
END $$;

COMMENT ON TABLE faqs IS 'Frequently asked questions for the help center and FAQ page';
