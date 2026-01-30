# Sentry Error Tracking Setup

Sentry is now configured for both frontend and backend error tracking and performance monitoring.

## Configuration

### Backend (Node.js/Express)
- **DSN**: `https://f14e34e76c4c1da3d6fc2ae894bba464@o4510766621196288.ingest.de.sentry.io/4510766635221072`
- **Environment Variable**: `SENTRY_DSN`
- **File**: `backend/src/server.ts`
- **Features**:
  - Error tracking
  - Performance monitoring (10% sample rate in production)
  - Profiling (10% sample rate in production)
  - Only enabled in production (`NODE_ENV=production`)

### Frontend (React/Vite)
- **DSN**: `https://3049edfd1f24ccd82cac8461b1f82b7e@o4510766621196288.ingest.de.sentry.io/4510766622769232`
- **Environment Variable**: `VITE_SENTRY_DSN`
- **File**: `src/main.tsx`
- **Features**:
  - Error tracking
  - Browser tracing (10% sample rate in production)
  - Session replay (10% session sample, 100% on errors)
  - Only enabled in production (`MODE=production`)

## Production Deployment

### Railway (Backend)
Add the environment variable in Railway dashboard:
\`\`\`
SENTRY_DSN=https://f14e34e76c4c1da3d6fc2ae894bba464@o4510766621196288.ingest.de.sentry.io/4510766635221072
\`\`\`

Also ensure \`NODE_ENV=production\` is set in Railway.

### Frontend (Vite Build)
The frontend environment variable is already in \`.env\`:
\`\`\`
VITE_SENTRY_DSN=https://3049edfd1f24ccd82cac8461b1f82b7e@o4510766621196288.ingest.de.sentry.io/4510766622769232
\`\`\`

This will be bundled into your production build automatically.

## Testing Sentry

### Backend Test
To test backend error tracking, trigger an error in production:
\`\`\`bash
curl https://your-backend-url.com/test-sentry-error
\`\`\`

### Frontend Test
To test frontend error tracking:
1. Open browser console on production site
2. Run: \`throw new Error('Sentry test error from frontend!')\`
3. Check Sentry dashboard for the error

## Sentry Dashboard

View errors and performance data in your Sentry dashboard.

## What Gets Tracked

### Automatic (Backend)
- Uncaught exceptions
- Unhandled promise rejections
- HTTP errors (via error middleware)
- Performance traces (10% sample)

### Automatic (Frontend)
- JavaScript errors
- Unhandled promise rejections
- React component errors (via ErrorBoundary)
- Navigation performance
- Session replays (on errors)

## Privacy & Data

- Session replay masks text and blocks media
- Only enabled in production
- Sample rates: 10% for performance, 100% for errors
- Data sent to Sentry's EU region (\`.ingest.de.sentry.io\`)

## Next Steps

1. ✅ DSNs configured in environment files
2. ✅ Code already integrated
3. 🔄 Add \`SENTRY_DSN\` to Railway environment variables
4. 🔄 Deploy frontend and backend
5. 🔄 Test error tracking in production
6. 🔄 Monitor Sentry dashboard

## Notes

- Sentry is **disabled in development**
- Set \`NODE_ENV=production\` in production to enable backend tracking
- Vite automatically sets \`MODE=production\` for production builds
