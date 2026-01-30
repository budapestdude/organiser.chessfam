# Cloudflare R2 Storage Setup Guide

This guide will help you set up Cloudflare R2 for persistent image storage in production.

## Why R2?

- **Zero egress fees** - Unlike AWS S3, you don't pay for bandwidth
- **S3-compatible** - Drop-in replacement using standard S3 APIs
- **Global CDN** - Fast delivery worldwide via Cloudflare's network
- **Affordable** - $0.015/GB/month storage

## Prerequisites

- Cloudflare account (free tier works)
- Credit card on file (required for R2, even on free tier)

## Step 1: Create an R2 Bucket

1. Log into [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **R2 Object Storage** in the left sidebar
3. Click **Create bucket**
4. Choose a bucket name (e.g., `chessfam-images`)
   - Bucket names must be globally unique
   - Use lowercase letters, numbers, and hyphens only
5. Select a location (choose closest to your users)
6. Click **Create bucket**

## Step 2: Enable Public Access & Get Public URL

To allow direct image access via URLs:

1. Go to your bucket's **Settings** tab
2. Scroll to **Public Access** section
3. Click **Allow Access** (this enables the public development URL)
4. Copy the **Public Development URL** that appears
   - It will look like: `https://pub-d7ac1beebae14972ab58697202c39d9e.r2.dev`
   - **Copy this entire URL** - you'll need it in Step 4

### For Now: Use Development URL ✅
- Perfect for getting started and testing
- Works immediately, no extra setup
- You can upgrade to custom domain later when needed

### Optional: Add Custom Domain (for production)
Only do this when you're ready for production traffic:

1. Click **Connect Domain**
2. Enter your domain (e.g., `cdn.chessfam.com`)
3. Add the CNAME record to your DNS:
   ```
   cdn.chessfam.com CNAME {bucket-name}.r2.cloudflarestorage.com
   ```
4. Wait for DNS propagation (5-10 minutes)
5. Update `R2_PUBLIC_URL` to your custom domain

## Step 3: Create API Token

1. In R2, click **Manage R2 API Tokens**
2. Click **Create API Token**
3. Configure the token:
   - **Token name**: `chessfam-backend-upload`
   - **Permissions**:
     - ✅ Object Read & Write
     - ❌ Admin Read & Write (not needed)
   - **Bucket scope**: Select your specific bucket
   - **TTL**: Leave empty (never expires)
4. Click **Create API Token**
5. **IMPORTANT**: Copy these values immediately (you can't see them again):
   - Account ID
   - Access Key ID
   - Secret Access Key

## Step 4: Configure Backend Environment Variables

Add these **5 variables** to your Railway environment variables or `.env` file:

```bash
R2_ACCOUNT_ID=your-account-id-from-step-3
R2_ACCESS_KEY_ID=your-access-key-id-from-step-3
R2_SECRET_ACCESS_KEY=your-secret-access-key-from-step-3
R2_BUCKET_NAME=chessfam-images
R2_PUBLIC_URL=https://pub-d7ac1beebae14972ab58697202c39d9e.r2.dev
```

**Important:**
- Use the exact Public Development URL you copied in Step 2
- All 5 variables are required for R2 to work
- Don't forget the `https://` in the URL

### Railway Deployment

1. Go to your Railway project
2. Click on your backend service
3. Go to **Variables** tab
4. Add each variable individually
5. Railway will automatically restart with new config

## Step 5: Test the Integration

1. Deploy your backend with the new environment variables
2. Try uploading an image through your app:
   - Create a tournament with an image
   - Upload a venue image
   - Upload a club image
3. Check the console logs for:
   ```
   ✅ R2 storage configured successfully
      Bucket: chessfam-images
      Public URL: https://pub-chessfam-images.r2.dev
   ```
4. Verify the image loads by visiting the returned URL

## Troubleshooting

### Images not uploading
- Check Railway logs for R2 connection errors
- Verify all 4 environment variables are set correctly
- Ensure bucket has public access enabled
- Check API token permissions include Object Read & Write

### Images upload but don't display
- Verify bucket public access is enabled
- Check the R2_PUBLIC_URL matches your bucket's public domain
- Test the URL directly in your browser
- Check CORS settings if accessing from different domain

### "R2 not configured" warning in logs
- At least one required env var is missing
- App will fall back to local filesystem (ephemeral on Railway)
- Set all 4 required variables: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`

## Fallback Behavior

If R2 is not configured, the app automatically falls back to local filesystem storage:
- ✅ Works in development without R2 setup
- ⚠️ Not suitable for production (files lost on restart)
- Console shows: `⚠️  R2 not configured. Image uploads will use local filesystem.`

## Cost Estimate

For a chess platform with moderate usage:

### Storage
- 1,000 images × 500 KB average = 500 MB
- Cost: 500 MB × $0.015/GB = **$0.0075/month** (~$0.01)

### Operations
- 1,000 uploads/month (Class A): $0.0045
- 10,000 views/month (Class B): $0.0036
- Total operations: **$0.01/month**

### Total
- **~$0.02/month** for typical usage
- **No egress fees** regardless of traffic

Compare to AWS S3:
- Storage: $0.023/GB (54% more expensive)
- Egress: $0.09/GB (R2 is FREE)
- For 10 GB of image views: S3 = $0.90, R2 = $0

## Migration from Local Storage

If you already have images stored locally:

1. Set up R2 as described above
2. Existing images in database will still reference old URLs
3. New uploads will automatically use R2
4. Old images will break when container restarts
5. **Manual migration required** - contact if needed

## Security Best Practices

1. **API Token Scope**: Only grant access to specific bucket
2. **Environment Variables**: Never commit tokens to git
3. **Public Access**: Only enable for image buckets (not private data)
4. **Token Rotation**: Rotate API tokens periodically (every 90 days)
5. **Custom Domain**: Use custom domain with HTTPS for production

## Support

- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [R2 Pricing](https://www.cloudflare.com/products/r2/)
- [API Reference](https://developers.cloudflare.com/r2/api/s3/api/)

## Alternative: Cloudflare Images

If you need automatic image optimization and transformations, consider [Cloudflare Images](https://www.cloudflare.com/products/cloudflare-images/) instead:
- $5/month for 100,000 images
- Automatic WebP/AVIF conversion
- On-the-fly resizing via URL
- Better for image-heavy applications
- More expensive but more features

For ChessFam's use case, R2 is recommended as a cost-effective starting point.
