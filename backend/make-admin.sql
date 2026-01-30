-- Make a user an admin by email
-- Replace 'your-email@example.com' with your actual email

UPDATE users
SET is_admin = true
WHERE email = 'your-email@example.com';

-- Verify the change
SELECT id, email, name, is_admin
FROM users
WHERE email = 'your-email@example.com';
