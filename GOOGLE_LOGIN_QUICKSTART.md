# Google Login - Quick Start

## Current Status: ✅ Implemented, ⚙️ Needs Configuration

Google login is **fully implemented** in the codebase. You just need to add your Google OAuth credentials.

## What's Already Done

✅ Backend OAuth routes (`/api/v1/auth/google` and `/api/v1/auth/google/callback`)
✅ Backend Google authentication service
✅ Frontend Google login button on Login page
✅ Frontend OAuth callback handler
✅ Database schema supports Google authentication
✅ User account linking (Google + email)

## What You Need To Do

1. **Get Google OAuth Credentials** (5 minutes)
   - Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - Create OAuth 2.0 Client ID
   - See detailed steps in `GOOGLE_OAUTH_SETUP.md`

2. **Add Credentials to Backend** (1 minute)
   - Open `backend/.env`
   - Uncomment and fill in:
     ```bash
     GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
     GOOGLE_CLIENT_SECRET=your-client-secret
     GOOGLE_CALLBACK_URL=https://api.chessfam.com/api/v1/auth/google/callback
     ```

3. **Configure Authorized Redirect URIs** in Google Console:
   - Production: `https://api.chessfam.com/api/v1/auth/google/callback`
   - (Replace with your actual API domain)

4. **Restart Backend Server**
   ```bash
   cd backend
   npm run dev  # or your production restart command
   ```

5. **Test It**
   - Go to https://chessfam.com/login
   - Click "Continue with Google"
   - Login with your Google account
   - You should be redirected back and logged in! ✨

## Important Notes

- **Never commit** your actual credentials (`.env` is in `.gitignore`)
- **Production URL**: Update `GOOGLE_CALLBACK_URL` to match your production API domain
- **JWT Secrets**: Already added to your `.env` file
- **Refresh Token**: Set to 365 days for persistent login

## Already Configured

These are already set up in your `backend/.env`:
- ✅ JWT_SECRET (generated)
- ✅ JWT_REFRESH_SECRET (generated)
- ✅ JWT_EXPIRES_IN (15 minutes)
- ✅ JWT_REFRESH_EXPIRES_IN (365 days)
- ✅ FRONTEND_URL (https://chessfam.com)
- ✅ CORS_ORIGIN (includes chessfam.com)

## Need Help?

See the detailed guide: `GOOGLE_OAUTH_SETUP.md`

## Quick Test Checklist

- [ ] Google OAuth credentials created in Google Cloud Console
- [ ] `GOOGLE_CLIENT_ID` added to `backend/.env`
- [ ] `GOOGLE_CLIENT_SECRET` added to `backend/.env`
- [ ] `GOOGLE_CALLBACK_URL` added to `backend/.env`
- [ ] Redirect URI added in Google Console
- [ ] Backend server restarted
- [ ] Tested login flow on frontend
