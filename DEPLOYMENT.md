# ChessFam Organizer Hub - Deployment Guide

This guide covers the complete deployment process for the ChessFam Organizer Hub, including backend updates and frontend deployment to `organiser.chessfam.com`.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Backend Deployment](#backend-deployment)
3. [Frontend Deployment](#frontend-deployment)
4. [DNS Configuration](#dns-configuration)
5. [Post-Deployment Testing](#post-deployment-testing)
6. [Monitoring](#monitoring)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Accounts
- **Backend hosting** (Railway, Render, or similar)
- **Frontend hosting** (Cloudflare Pages, Vercel, or Netlify)
- **Domain registrar** access for DNS configuration
- **Sentry account** for error monitoring (optional)

### Required Tools
- Node.js 18+ and npm
- Git
- PostgreSQL 14+ (for backend)

---

## Backend Deployment

### Step 1: Deploy New Backend Files

The following files need to be added to your existing backend:

#### New Files Created:
```
backend/
├── src/
│   ├── routes/organizer.ts (NEW)
│   ├── controllers/organizerController.ts (NEW)
│   ├── controllers/tournamentAnalyticsController.ts (NEW)
│   ├── services/organizerService.ts (NEW)
│   └── services/tournamentAnalyticsService.ts (NEW)
```

#### Modified Files:
```
backend/
├── src/
│   ├── middleware/auth.ts (MODIFIED - added ownership verification)
│   ├── routes/tournaments.ts (MODIFIED - added analytics routes)
│   ├── routes/clubs.ts (MODIFIED - added member exports)
│   └── server.ts (MODIFIED - mounted organizer routes)
```

### Step 2: Update Environment Variables

Add the following to your backend `.env`:

```env
# Existing variables
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-jwt-refresh-secret

# CORS - Add organiser subdomain
ALLOWED_ORIGINS=https://chessfam.com,https://organiser.chessfam.com,http://localhost:5173
```

### Step 3: Database Migrations

No new database migrations required - all new endpoints use existing tables:
- `tournaments`
- `clubs`
- `tournament_registrations`
- `club_memberships`
- `payments`

### Step 4: Deploy Backend Changes

#### For Railway:
```bash
cd /path/to/chessfam-backend
git add .
git commit -m "Add organizer hub backend endpoints"
git push origin main
# Railway will auto-deploy
```

#### For Render:
```bash
# Commit changes, then trigger manual deploy in Render dashboard
# or connect GitHub auto-deploy
```

### Step 5: Verify Backend Endpoints

Test the new endpoints:

```bash
# Replace with your API URL
API_URL="https://api.chessfam.com/api/v1"

# Get auth token (login first)
TOKEN="your-jwt-token"

# Test organizer dashboard
curl -H "Authorization: Bearer $TOKEN" \
  "$API_URL/organizer/dashboard"

# Test tournament analytics
curl -H "Authorization: Bearer $TOKEN" \
  "$API_URL/tournaments/1/analytics"

# Test financial reports
curl -H "Authorization: Bearer $TOKEN" \
  "$API_URL/organizer/financials?from=2024-01-01&to=2024-12-31"
```

Expected responses:
- `200 OK` with JSON data
- `401 Unauthorized` if token is invalid
- `403 Forbidden` if accessing non-owned resources

---

## Frontend Deployment

### Step 1: Configure Environment Variables

Create `.env.production` in the frontend root:

```env
VITE_API_URL=https://api.chessfam.com/api/v1
VITE_MAIN_APP_URL=https://chessfam.com
VITE_STRIPE_PUBLIC_KEY=pk_live_...
```

### Step 2: Build the Frontend

```bash
cd /Users/michaelduke/Downloads/chessfam-organizer-hub
npm install
npm run build
```

Verify build output in `dist/` directory:
```
dist/
├── index.html
├── assets/
│   ├── index-*.css
│   ├── index-*.js
│   └── charts-vendor-*.js
```

### Step 3: Deploy to Cloudflare Pages

#### Option A: Via Cloudflare Dashboard

1. Go to **Cloudflare Pages** dashboard
2. Click **Create a project**
3. Connect your Git repository
4. Configure build settings:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/`
   - **Node version**: `18`
5. Add environment variables:
   - `VITE_API_URL`
   - `VITE_MAIN_APP_URL`
   - `VITE_STRIPE_PUBLIC_KEY`
6. Click **Save and Deploy**

#### Option B: Via Wrangler CLI

```bash
npm install -g wrangler

# Login
wrangler login

# Deploy
wrangler pages deploy dist --project-name=chessfam-organizer-hub
```

### Step 4: Deploy to Vercel (Alternative)

```bash
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Set environment variables
vercel env add VITE_API_URL
vercel env add VITE_MAIN_APP_URL
vercel env add VITE_STRIPE_PUBLIC_KEY
```

### Step 5: Deploy to Netlify (Alternative)

```bash
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod --dir=dist

# Set environment variables in Netlify dashboard
```

---

## DNS Configuration

### Step 1: Add Subdomain Record

In your DNS provider (Cloudflare, Namecheap, etc.):

#### For Cloudflare Pages:
1. Go to **DNS** > **Records**
2. Click **Add record**
3. Configure:
   - **Type**: `CNAME`
   - **Name**: `organiser`
   - **Target**: `chessfam-organizer-hub.pages.dev` (or your Pages URL)
   - **Proxy status**: Proxied (orange cloud)
   - **TTL**: Auto

#### For Vercel:
1. Go to **DNS** > **Records**
2. Add:
   - **Type**: `CNAME`
   - **Name**: `organiser`
   - **Target**: `cname.vercel-dns.com`
3. In Vercel dashboard, add `organiser.chessfam.com` as custom domain

#### For Netlify:
1. Go to **DNS** > **Records**
2. Add:
   - **Type**: `CNAME`
   - **Name**: `organiser`
   - **Target**: Your Netlify site URL

### Step 2: SSL Certificate

- **Cloudflare**: SSL is automatic with proxied records
- **Vercel**: SSL is automatic for custom domains
- **Netlify**: SSL is automatic via Let's Encrypt

Wait 5-10 minutes for DNS propagation and SSL provisioning.

### Step 3: Verify DNS

```bash
# Check DNS resolution
dig organiser.chessfam.com

# Check SSL
curl -I https://organiser.chessfam.com
```

---

## Post-Deployment Testing

### Automated Checklist

Use this checklist to verify deployment:

#### Backend Tests:
- [ ] Backend health check passes: `GET /api/v1/health`
- [ ] CORS allows organiser subdomain
- [ ] Organizer dashboard endpoint works
- [ ] Tournament analytics endpoint works
- [ ] Financial reports endpoint works
- [ ] Ownership verification prevents unauthorized access

#### Frontend Tests:
- [ ] Site loads at https://organiser.chessfam.com
- [ ] SSL certificate is valid (green padlock)
- [ ] No console errors on page load
- [ ] Login flow works
- [ ] Dashboard loads with real data
- [ ] Tournaments list shows owned tournaments only
- [ ] Clubs list shows owned clubs only
- [ ] Analytics charts render correctly
- [ ] Financial reports load
- [ ] CSV export downloads
- [ ] Mobile menu works on small screens
- [ ] All navigation links work
- [ ] Logout works and redirects to login

### Manual Testing Script

```bash
#!/bin/bash
# Save as test-deployment.sh

BASE_URL="https://organiser.chessfam.com"

echo "Testing deployment..."

# 1. Check site loads
echo "✓ Checking site availability..."
curl -f -s -o /dev/null -w "%{http_code}" $BASE_URL || exit 1

# 2. Check assets load
echo "✓ Checking assets..."
curl -f -s -o /dev/null $BASE_URL/assets/index*.css || exit 1

# 3. Check API connectivity (requires login token)
echo "✓ Testing API..."
# Add your test token here
TOKEN="your-test-token"
curl -f -H "Authorization: Bearer $TOKEN" \
  https://api.chessfam.com/api/v1/organizer/dashboard || exit 1

echo "✅ All tests passed!"
```

---

## Monitoring

### Set Up Sentry (Optional)

1. Create Sentry project at https://sentry.io
2. Install Sentry SDK:

```bash
npm install @sentry/react
```

3. Initialize Sentry in `src/main.tsx`:

```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: import.meta.env.MODE,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay(),
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

4. Add Sentry DSN to environment variables
5. Rebuild and redeploy

### Analytics (Optional)

Add Google Analytics or Plausible:

```html
<!-- In index.html -->
<script defer data-domain="organiser.chessfam.com"
  src="https://plausible.io/js/script.js"></script>
```

### Uptime Monitoring

Use UptimeRobot, Pingdom, or similar:
- Monitor: `https://organiser.chessfam.com`
- Check interval: 5 minutes
- Alert on: HTTP 500 errors or downtime

---

## Troubleshooting

### Issue: CORS Errors

**Symptoms**: `Access-Control-Allow-Origin` errors in browser console

**Solution**:
1. Verify backend `ALLOWED_ORIGINS` includes `https://organiser.chessfam.com`
2. Restart backend after env var change
3. Clear browser cache

### Issue: 401 Unauthorized

**Symptoms**: All API calls return 401

**Solution**:
1. Check JWT token is being sent in request headers
2. Verify `VITE_API_URL` points to correct backend
3. Check token hasn't expired (15min default)
4. Test token refresh flow

### Issue: 403 Forbidden on Analytics

**Symptoms**: Dashboard loads but analytics/financials return 403

**Solution**:
1. Verify ownership middleware is checking correct user ID
2. Check that tournaments/clubs have correct `organizer_id`/`owner_id`
3. Ensure user is logged in with organizer account

### Issue: Charts Not Rendering

**Symptoms**: Blank spaces where charts should be

**Solution**:
1. Check browser console for errors
2. Verify Recharts is installed: `npm list recharts`
3. Check data format matches chart expectations
4. Test with mock data

### Issue: Mobile Menu Not Working

**Symptoms**: Hamburger menu doesn't open on mobile

**Solution**:
1. Check Tailwind `lg:` breakpoint classes are applied
2. Verify `useState` for menu state is working
3. Check z-index layers aren't conflicting
4. Test on actual mobile device (not just browser devtools)

### Issue: Build Fails

**Symptoms**: `npm run build` errors

**Solution**:
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for TypeScript errors
npm run build 2>&1 | grep "error TS"

# Fix any TypeScript errors, then rebuild
npm run build
```

### Issue: Environment Variables Not Working

**Symptoms**: API calls go to wrong URL or undefined

**Solution**:
1. Verify `.env.production` exists
2. Check variable names start with `VITE_`
3. Rebuild after changing env vars (Vite bakes them into build)
4. For production, set env vars in hosting platform dashboard

---

## Rollback Procedure

### Frontend Rollback

#### Cloudflare Pages:
1. Go to **Deployments** tab
2. Click previous successful deployment
3. Click **Rollback to this deployment**

#### Vercel:
1. Go to **Deployments**
2. Click previous deployment
3. Click **Promote to Production**

### Backend Rollback

#### Git-based:
```bash
# Revert to previous commit
git revert HEAD
git push origin main
```

#### Manual:
1. Remove new route files
2. Revert modified files from backup
3. Restart backend service

---

## Success Criteria

Deployment is successful when:

✅ Frontend loads at `https://organiser.chessfam.com` with valid SSL
✅ Login works with existing ChessFam accounts
✅ Dashboard shows real data from backend
✅ All pages load without errors
✅ Charts render correctly
✅ Mobile responsive design works
✅ CSV exports download
✅ Error monitoring is active (if configured)
✅ 99.9% uptime after 24 hours

---

## Support

For issues:
1. Check Sentry for error reports
2. Review server logs in hosting dashboard
3. Test API endpoints directly with curl
4. Check #tech-support in team Slack

## Maintenance

### Regular Tasks:
- Weekly: Review Sentry error reports
- Monthly: Check uptime stats
- Quarterly: Update dependencies (`npm update`)
- As needed: Scale hosting resources based on usage

---

**Last Updated**: 2026-01-27
**Version**: 1.0.0
