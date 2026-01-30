# Railway Deployment Guide - ChessFam

This guide walks you through deploying both the PostgreSQL database and backend API to Railway.

---

## Step 1: Create Railway Account & Project

1. Go to https://railway.app/
2. Click "Login" and sign up with GitHub (free)
3. Once logged in, click "+ New Project"

---

## Step 2: Add PostgreSQL Database

1. In your new project, click "+ New"
2. Select "Database" → "Add PostgreSQL"
3. Railway will provision the database (takes 1-2 minutes)
4. Once ready, click on the PostgreSQL service
5. Go to the "Variables" tab
6. Copy the `DATABASE_URL` value (it looks like `postgresql://postgres:...@...railway.app:5432/railway`)
7. Keep this tab open - you'll need this URL

---

## Step 3: Initialize Git Repository (If Not Already Done)

Your backend needs to be in a Git repository to deploy to Railway.

```bash
# Navigate to your backend directory
cd "F:\Cameo for Chess Experiences\backend"

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial backend setup for Railway deployment"
```

---

## Step 4: Deploy Backend Service

### Option A: Deploy from GitHub (Recommended)

1. **Push your backend to GitHub:**
   ```bash
   # Create a new repository on GitHub (go to github.com)
   # Name it something like "chessfam-backend"
   # Don't initialize with README

   # Then run these commands:
   git remote add origin https://github.com/YOUR_USERNAME/chessfam-backend.git
   git branch -M main
   git push -u origin main
   ```

2. **Connect to Railway:**
   - Back in Railway, click "+ New" in your project
   - Select "GitHub Repo"
   - Authenticate GitHub if needed
   - Select your `chessfam-backend` repository
   - Railway will automatically detect it's a Node.js app

### Option B: Deploy from Local (Alternative)

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway:**
   ```bash
   railway login
   ```

3. **Link to your project:**
   ```bash
   cd "F:\Cameo for Chess Experiences\backend"
   railway link
   # Select your project from the list
   ```

4. **Deploy:**
   ```bash
   railway up
   ```

---

## Step 5: Configure Environment Variables

Once your backend service is created in Railway:

1. **Click on your backend service** (not the PostgreSQL service)
2. **Go to "Variables" tab**
3. **Add these environment variables:**

   Click "+ New Variable" for each:

   ```
   Variable Name: DATABASE_URL
   Value: [paste the DATABASE_URL you copied from PostgreSQL service]

   Variable Name: JWT_SECRET
   Value: [generate a random string, e.g., use: openssl rand -base64 32]

   Variable Name: JWT_REFRESH_SECRET
   Value: [generate another random string]

   Variable Name: JWT_EXPIRES_IN
   Value: 15m

   Variable Name: JWT_REFRESH_EXPIRES_IN
   Value: 7d

   Variable Name: FRONTEND_URL
   Value: http://localhost:5173

   Variable Name: NODE_ENV
   Value: production

   Variable Name: PORT
   Value: 3000
   ```

4. **Alternatively, use Railway's "Reference Variables" feature:**
   - Railway automatically shares variables between services in the same project
   - Click "Add Reference" and select the DATABASE_URL from your PostgreSQL service

---

## Step 6: Configure Build & Start Commands

Railway should auto-detect these, but verify:

1. Click on your backend service
2. Go to "Settings" tab
3. Scroll to "Deploy" section
4. Verify:
   - **Build Command:** `npm run build`
   - **Start Command:** `npm start`
5. Under "Deploy" section, set:
   - **Custom Start Command:** `npm run railway:migrate && npm start`

   This will run migrations before starting the server.

---

## Step 7: Generate JWT Secrets

You need secure random strings for JWT secrets:

**On Windows (PowerShell):**
```powershell
# Run this twice to get two different secrets
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

**Or use an online generator:**
- https://randomkeygen.com/ (use "CodeIgniter Encryption Keys")

**Or on Git Bash/WSL:**
```bash
openssl rand -base64 32
```

Copy these values and use them for `JWT_SECRET` and `JWT_REFRESH_SECRET`.

---

## Step 8: Deploy & Monitor

1. **Trigger deployment:**
   - If using GitHub: Push any commit to trigger redeploy
   - If using Railway CLI: Run `railway up`
   - Or click "Deploy" in Railway dashboard

2. **Monitor deployment:**
   - Click on your backend service
   - Go to "Deployments" tab
   - Click on the latest deployment
   - Watch the build logs

3. **Check for successful migration:**
   - Look for "Migration completed successfully" in logs

---

## Step 9: Get Your Backend URL

1. Click on your backend service
2. Go to "Settings" tab
3. Scroll to "Networking" section
4. Click "Generate Domain"
5. Railway will give you a public URL like: `chessfam-backend-production.up.railway.app`
6. **Copy this URL** - you'll need it for the frontend

---

## Step 10: Update Frontend Configuration

Now update your frontend to use the Railway backend:

1. **Edit `chess-experiences/.env`:**
   ```env
   VITE_API_URL=https://YOUR-BACKEND-URL.up.railway.app/api/v1
   ```
   Replace `YOUR-BACKEND-URL` with the domain from Step 9.

2. **Update CORS on Backend:**
   - Go back to Railway → Backend service → Variables
   - Update `FRONTEND_URL` to your frontend URL (if deploying frontend) or keep as `http://localhost:5173` for local development

---

## Step 11: Test the Deployment

### Test Backend Health:
```bash
curl https://YOUR-BACKEND-URL.up.railway.app/health
```

Should return: `{"status":"ok"}`

### Test Signup:
```bash
curl -X POST https://YOUR-BACKEND-URL.up.railway.app/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"Test1234"}'
```

Should return a user object with tokens.

---

## Step 12: Run Frontend Locally (Testing)

```bash
cd "F:\Cameo for Chess Experiences\chess-experiences"
npm run dev
```

The frontend will now connect to your Railway backend!

---

## Common Issues & Troubleshooting

### Build Fails
- **Check logs** in Railway dashboard
- Ensure `package.json` has correct scripts
- Verify all dependencies are in `dependencies` (not `devDependencies`)

### Database Connection Fails
- **Verify DATABASE_URL** is correctly set
- Check PostgreSQL service is running
- Ensure DATABASE_URL includes full connection string with password

### CORS Errors
- **Update FRONTEND_URL** in Railway variables
- Check `src/server.ts` has correct CORS configuration

### Migrations Don't Run
- **Check deployment logs** for migration output
- Manually run migrations: Railway dashboard → Service → Settings → Custom Start Command

### 502 Bad Gateway
- **Check if service is running:** Railway dashboard → Service → Deployments
- Verify PORT environment variable is set
- Check server logs for errors

---

## Managing Your Railway Project

### View Logs:
- Click service → "Deployments" → Latest deployment → View logs

### Restart Service:
- Click service → Settings → "Restart"

### Redeploy:
- Push new commit to GitHub
- Or use `railway up` in CLI

### Database Management:
- Use Railway's built-in database tools
- Or connect with `psql`:
  ```bash
  psql "DATABASE_URL_FROM_RAILWAY"
  ```

---

## Costs & Limits

**Railway Free Tier:**
- $5 free credits per month
- 500 hours of usage
- Perfect for development and small projects

**What uses credits:**
- Database running time
- Backend service running time

**Tip:** Railway will pause services after inactivity to save credits.

---

## Next Steps After Deployment

1. ✅ Backend deployed to Railway
2. ✅ Database provisioned and migrated
3. ✅ Frontend connected to Railway backend
4. 🔄 Deploy frontend to Vercel/Netlify (optional)
5. 🔄 Set up custom domain (optional)
6. 🔄 Implement Phase 2: Profile management

---

## Quick Reference

**Railway Dashboard:** https://railway.app/dashboard

**Backend URL:** https://YOUR-SERVICE.up.railway.app

**Database Connection:**
```bash
# From Railway → PostgreSQL service → Connect tab
psql postgresql://postgres:PASSWORD@HOST:PORT/railway
```

**Useful Commands:**
```bash
# Railway CLI
railway login
railway link
railway up
railway logs
railway run [command]
railway variables
```

---

Good luck with your deployment! 🚀
