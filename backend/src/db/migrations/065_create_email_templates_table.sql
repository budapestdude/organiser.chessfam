-- Create email templates table for admin management
CREATE TABLE IF NOT EXISTS email_templates (
  id SERIAL PRIMARY KEY,
  template_key VARCHAR(100) UNIQUE NOT NULL,
  template_name VARCHAR(255) NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb,
  category VARCHAR(50) DEFAULT 'General',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_email_templates_key ON email_templates(template_key);
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates(category);
CREATE INDEX IF NOT EXISTS idx_email_templates_active ON email_templates(is_active);

-- Comments
COMMENT ON TABLE email_templates IS 'Stores customizable email templates with variable substitution';
COMMENT ON COLUMN email_templates.template_key IS 'Unique identifier used in code (e.g., email_verification)';
COMMENT ON COLUMN email_templates.template_name IS 'Human-readable name shown in admin panel';
COMMENT ON COLUMN email_templates.subject IS 'Email subject line with variable placeholders like {{userName}}';
COMMENT ON COLUMN email_templates.html_content IS 'HTML email body with variable placeholders';
COMMENT ON COLUMN email_templates.text_content IS 'Plain text fallback with variable placeholders';
COMMENT ON COLUMN email_templates.variables IS 'JSON array of available variables for this template';
COMMENT ON COLUMN email_templates.category IS 'Template category: Authentication, Tournaments, Clubs, etc.';
