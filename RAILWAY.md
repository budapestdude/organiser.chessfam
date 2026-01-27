# Railway Deployment Guide

## Environment Variables

Set these environment variables in your Railway dashboard:

### Required Variables

```
VITE_API_URL=https://backend-production-376c5.up.railway.app/api/v1
```

### Optional Variables

```
VITE_MAIN_APP_URL=https://organiser.chessfam.com
VITE_STRIPE_PUBLIC_KEY=pk_live_your_stripe_key
```

## Steps to Deploy

1. **Set Environment Variables**
   - Go to your Railway project
   - Click on the service
   - Go to "Variables" tab
   - Add the variables listed above

2. **Trigger Redeploy**
   - Railway will automatically rebuild on git push
   - Or manually trigger from the "Deployments" tab

3. **Custom Domain** (Optional)
   - Go to "Settings" tab
   - Click "Generate Domain" or add custom domain
   - For custom domain `organiser.chessfam.com`:
     - Add CNAME record pointing to Railway domain
     - Add custom domain in Railway settings

## Build Configuration

The app uses:
- **Node Version**: 20 (specified in `.nvmrc`)
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Port**: Auto-detected from Railway's `$PORT` environment variable

## Architecture

```
Frontend (organiser.chessfam.com)
    ↓
    API Calls
    ↓
Backend (backend-production-376c5.up.railway.app)
```

## Troubleshooting

### CORS Issues
If you get CORS errors, ensure the backend allows the frontend domain:
```javascript
// Backend CORS configuration should include:
origin: ['https://organiser.chessfam.com', 'https://your-railway-domain.railway.app']
```

### Environment Variables Not Loading
Vite requires environment variables to be set at **build time**, not runtime.
After changing variables in Railway, you must **redeploy** the service.
