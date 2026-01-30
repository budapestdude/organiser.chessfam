-- Update email templates with actual HTML/text from emailTemplates.ts

-- Email Verification
UPDATE email_templates SET
  html_content = '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, Oxygen, Ubuntu, sans-serif; background-color: #1a1a2e; color: #ffffff; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #252540; border-radius: 16px; padding: 32px;">
    <div style="text-align: center; margin-bottom: 24px;">
      <h1 style="color: #8b5cf6; margin: 0;">ChessFam</h1>
    </div>
    <h2 style="color: #ffffff; margin: 0 0 16px 0;">Welcome to ChessFam, {{userName}}!</h2>
    <p style="color: #cccccc; line-height: 1.6;">Thanks for signing up. Please verify your email address to get started.</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="{{verificationLink}}" style="display: inline-block; padding: 12px 32px; background: linear-gradient(135deg, #8b5cf6, #6366f1); color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">Verify Email Address</a>
    </div>
    <p style="color: #888888; font-size: 14px;">If the button doesn''t work, copy and paste this link into your browser:</p>
    <p style="color: #8b5cf6; word-break: break-all; font-size: 12px;">{{verificationLink}}</p>
    <p style="color: #888888; font-size: 14px;">This link expires in 24 hours.</p>
    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #3a3a5c; text-align: center; color: #888;">
      <p style="margin: 0; font-size: 12px;">This email was sent by ChessFam. If you didn''t request this email, you can safely ignore it.</p>
    </div>
  </div>
</body>
</html>',
  text_content = 'Welcome to ChessFam, {{userName}}!

Thanks for signing up. Please verify your email by visiting:
{{verificationLink}}

This link expires in 24 hours.'
WHERE template_key = 'email_verification';

-- Add more UPDATE statements for other templates as needed...
