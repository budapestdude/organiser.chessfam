# Google OAuth Setup Guide

Google login is already implemented in the codebase. You just need to configure the credentials.

## Prerequisites
- Google Account
- Access to [Google Cloud Console](https://console.cloud.google.com/)

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a Project" dropdown at the top
3. Click "New Project"
4. Enter project name: `ChessFam` (or any name you prefer)
5. Click "Create"

## Step 2: Enable Google+ API

1. In your project, go to **APIs & Services** → **Library**
2. Search for "Google+ API"
3. Click on it and click "Enable"

## Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **External** user type
3. Click "Create"
4. Fill in the required fields:
   - **App name**: ChessFam
   - **User support email**: your email
   - **Developer contact email**: your email
5. Click "Save and Continue"
6. On "Scopes" page, click "Save and Continue"
7. On "Test users" page, add your email for testing
8. Click "Save and Continue"

## Step 4: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click "Create Credentials" → "OAuth client ID"
3. Select **Application type**: Web application
4. Enter **Name**: ChessFam Web Client
5. Under **Authorized JavaScript origins**, add:
   - `http://localhost:5173` (development frontend)
   - `https://chessfam.com` (production frontend)
   - `https://www.chessfam.com` (production frontend with www)

6. Under **Authorized redirect URIs**, add:
   - `http://localhost:3000/api/v1/auth/google/callback` (development backend)
   - `https://api.chessfam.com/api/v1/auth/google/callback` (production backend - adjust to your actual API domain)

7. Click "Create"
8. You'll see a popup with your **Client ID** and **Client Secret**
9. **Copy both values** - you'll need them in the next step

## Step 5: Update Environment Variables

### Backend (.env)

Add these to your `backend/.env` file:

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
GOOGLE_CALLBACK_URL=http://localhost:3000/api/v1/auth/google/callback
FRONTEND_URL=http://localhost:5173
```

**For production**, update:
```bash
GOOGLE_CALLBACK_URL=https://api.chessfam.com/api/v1/auth/google/callback
FRONTEND_URL=https://chessfam.com
```

### Important Notes

- Never commit your `.env` file to git (it's already in `.gitignore`)
- For production, use your actual API domain in `GOOGLE_CALLBACK_URL`
- Make sure `FRONTEND_URL` matches where your frontend is hosted

## Step 6: Restart Backend Server

After adding the environment variables, restart your backend server:

```bash
cd backend
npm run dev
```

## Step 7: Test Google Login

1. Go to your frontend at `http://localhost:5173`
2. Navigate to the Login page
3. Click "Continue with Google"
4. You should be redirected to Google's login page
5. After logging in with Google, you'll be redirected back to your app

## How It Works

1. **User clicks "Continue with Google"** on login page
2. **Frontend redirects** to `GET /api/v1/auth/google`
3. **Backend redirects** to Google's OAuth page
4. **User logs in** with Google and grants permissions
5. **Google redirects** to `GET /api/v1/auth/google/callback?code=...`
6. **Backend exchanges** the code for access tokens
7. **Backend fetches** user profile from Google
8. **Backend creates/links** user account in database
9. **Backend redirects** to `FRONTEND_URL/auth/callback?token=...&refreshToken=...`
10. **Frontend stores** tokens and logs user in

## Database Schema

The Google OAuth implementation uses these user fields (already in your schema):

```sql
users (
  google_id VARCHAR(255),           -- Google's unique user ID
  auth_provider VARCHAR(20),        -- 'email', 'google', or 'both'
  email_verified BOOLEAN,           -- Auto-set to true for Google users
  avatar TEXT                       -- Google profile picture URL
)
```

## Troubleshooting

### "Google OAuth is not configured"
- Make sure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in backend `.env`
- Restart your backend server

### "Redirect URI mismatch"
- Go to Google Cloud Console → Credentials → Your OAuth Client
- Make sure the redirect URI matches exactly: `http://localhost:3000/api/v1/auth/google/callback`
- Check there are no trailing slashes

### "Error: Failed to exchange code for tokens"
- Verify `GOOGLE_CLIENT_SECRET` is correct
- Check `GOOGLE_CALLBACK_URL` matches what's registered in Google Console

### "Authentication Failed" on callback page
- Check browser console for errors
- Verify `FRONTEND_URL` is set correctly in backend `.env`
- Make sure JWT secrets are configured

## Production Deployment

When deploying to production:

1. Update authorized origins in Google Console to include your production domain
2. Update redirect URIs to use your production API URL
3. Set production environment variables on your hosting platform
4. Test thoroughly before making it available to users

## Security Notes

- Google automatically verifies email addresses
- The implementation prevents duplicate accounts by checking both `google_id` and `email`
- Users who sign up with email can link their Google account by logging in with Google
- Tokens are stored client-side in localStorage (consider httpOnly cookies for enhanced security)
