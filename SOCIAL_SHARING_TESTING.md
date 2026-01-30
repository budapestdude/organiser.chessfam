# Social Sharing Testing Guide

## Overview
All detail pages (Tournament, Club, Master, Location) now have complete social sharing functionality including:
- Share buttons with Web Share API support (mobile)
- Clipboard fallback (desktop)
- Comprehensive OpenGraph and Twitter Card meta tags
- Structured data (Schema.org JSON-LD)

## Features Implemented

### 1. Share Buttons
Each detail page has a share button in the top-right header that:
- Uses native Web Share API on mobile devices
- Falls back to copying link to clipboard on desktop
- Includes appropriate share text for each entity type

### 2. Meta Tags

#### OpenGraph Tags (Facebook, LinkedIn, etc.)
All pages include:
- `og:type` - Specific type for each entity:
  - Tournament: `event`
  - Club: `website`
  - Master: `profile`
  - Location: `place`
- `og:url` - Canonical URL
- `og:title` - Page-specific title
- `og:description` - Dynamic description
- `og:image` - Entity image or default og-image.png

#### Twitter Card Tags
All pages include:
- `twitter:card` - `summary_large_image`
- `twitter:title` - Page-specific title
- `twitter:description` - Dynamic description
- `twitter:image` - Entity image or default og-image.png

## Testing Instructions

### 1. Test Share Button Functionality

#### On Mobile:
1. Open any detail page (tournament, club, master, or location)
2. Click the share button (top-right corner)
3. Verify native share sheet appears
4. Test sharing to different apps (Messages, Email, etc.)

#### On Desktop:
1. Open any detail page
2. Click the share button
3. Verify "Link copied to clipboard!" alert appears
4. Paste the link to verify it copied correctly

### 2. Test Social Media Previews

#### Facebook Sharing Debugger
1. Visit: https://developers.facebook.com/tools/debug/
2. Enter a page URL (e.g., `https://chessfam.com/tournament/1`)
3. Click "Debug"
4. Verify all meta tags are detected:
   - Title matches page title
   - Description is present and accurate
   - Image loads correctly
5. Click "Scrape Again" to refresh cache if needed

#### Twitter Card Validator
1. Visit: https://cards-dev.twitter.com/validator
2. Enter a page URL
3. Click "Preview card"
4. Verify the card displays correctly with:
   - Large image
   - Correct title
   - Correct description

#### LinkedIn Post Inspector
1. Visit: https://www.linkedin.com/post-inspector/
2. Enter a page URL
3. Verify preview appears correctly
4. Check title, description, and image

### 3. Test OpenGraph Tags Directly

Use browser DevTools:
```bash
# View all meta tags
document.querySelectorAll('meta[property^="og:"]')

# Check specific tags
document.querySelector('meta[property="og:title"]').content
document.querySelector('meta[property="og:description"]').content
document.querySelector('meta[property="og:image"]').content
document.querySelector('meta[property="og:url"]').content
document.querySelector('meta[property="og:type"]').content
```

### 4. Test Twitter Tags Directly

Use browser DevTools:
```bash
# View all Twitter meta tags
document.querySelectorAll('meta[name^="twitter:"]')

# Check specific tags
document.querySelector('meta[name="twitter:card"]').content
document.querySelector('meta[name="twitter:title"]').content
document.querySelector('meta[name="twitter:description"]').content
document.querySelector('meta[name="twitter:image"]').content
```

### 5. Visual Testing Checklist

For each page type, verify:

#### Tournament Detail Page
- [ ] Share button present and functional
- [ ] og:type = "event"
- [ ] Title: "{Tournament Name} | ChessFam"
- [ ] Description includes tournament details
- [ ] Image shows tournament photo or fallback

#### Club Detail Page
- [ ] Share button present and functional
- [ ] og:type = "website"
- [ ] Title: "{Club Name} | Chess Club | ChessFam"
- [ ] Description includes club details
- [ ] Image shows club photo or fallback

#### Master Detail Page
- [ ] Share button present and functional
- [ ] og:type = "profile"
- [ ] Title: "{Title} {Name} | Chess Master | ChessFam"
- [ ] Description includes rating and bio
- [ ] Image shows master photo or fallback

#### Location Detail Page
- [ ] Share button present and functional
- [ ] og:type = "place"
- [ ] Title: "{Location Name} | Chess Venue | ChessFam"
- [ ] Description includes location details
- [ ] Image shows venue photo or fallback

## Common Issues & Solutions

### Issue: Social media shows old/cached preview
**Solution:** Use the respective debugger tools to scrape/refresh:
- Facebook: Use Sharing Debugger and click "Scrape Again"
- Twitter: Wait 24-48 hours or use Card Validator
- LinkedIn: Use Post Inspector to refresh

### Issue: Image not showing in preview
**Solution:**
1. Verify image URL is absolute (not relative)
2. Check image is publicly accessible
3. Verify image meets platform requirements:
   - Facebook: Min 200x200px, recommended 1200x630px
   - Twitter: Min 300x157px, recommended 1200x628px
   - Max file size: 8MB

### Issue: Share button not working on mobile
**Solution:**
1. Verify HTTPS (Web Share API requires secure context)
2. Check browser compatibility
3. Fallback to clipboard should work if Web Share API unavailable

## Best Practices

1. **Images**: Always provide high-quality images (1200x630px) for best social previews
2. **Descriptions**: Keep under 200 characters for optimal display
3. **Titles**: Keep concise, under 60 characters
4. **Testing**: Always test on multiple platforms before launch
5. **Cache**: Remember social platforms cache meta tags for 24-48 hours

## Next Steps

1. ✅ Share buttons implemented on all detail pages
2. ✅ OpenGraph tags verified
3. ✅ Twitter Card tags verified
4. ⏳ Create custom og-image.png (1200x630px) - **Requires design asset**
5. ⏳ Test on production after deployment

## Resources

- [OpenGraph Protocol](https://ogp.me/)
- [Twitter Cards Documentation](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [Facebook Sharing Best Practices](https://developers.facebook.com/docs/sharing/best-practices)
- [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)
