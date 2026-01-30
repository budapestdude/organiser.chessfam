# Tournament Series - Deployment Notes

## 🚀 What Will Happen on Next Deployment

The next deployment will automatically:

### 1. ✅ Run Database Migration (049)
- Adds `is_series_parent` boolean field to tournaments table
- Updates constraints to allow 'series' tournament category
- Adds performance index on `is_series_parent`
- **Location:** `backend/setup-db.js` includes migration 049

### 2. ✅ Seed Tournament Series Data
- Creates 5 famous tournament series placeholders:
  - Tata Steel Chess Tournament (with 3 editions: 2024, 2025, 2026)
  - Sligo Chess Festival
  - GRENKE Chess Classic
  - Isle of Wight Chess Festival
  - Prague Chess Festival
- **Location:** `backend/package.json` - `start` script runs `npm run seed:series`

### 3. ✅ Deploy New Features
- Backend API endpoints for series operations
- Frontend Tournament Series Homepage component
- Series navigation from individual tournaments

## 📋 Deployment Sequence

When you deploy, this happens automatically:

```bash
1. npm run build                    # Compile TypeScript
2. node setup-db.js                 # Run all migrations (including 049)
3. npm run backfill:tournaments     # Backfill existing data
4. npm run seed:series              # Create tournament series ⭐ NEW
5. node dist/server.js              # Start server
```

## ✨ What Users Will See Immediately

After deployment:

### For Tata Steel Chess Tournament
- ✅ Series homepage available at `/tournaments/{id}/series`
- ✅ 3 editions viewable (2024, 2025, 2026)
- ✅ Timeline showing all editions
- ✅ Aggregate stats across editions
- ✅ "Next Edition" highlight for 2026

### For Other 4 Series
- ✅ Series containers created
- ⏳ Need editions to be created (can be done via UI or API)
- ⏳ Organizers can link existing tournaments to these series

### For Individual Tournaments
- ✅ Any tournament with `parent_tournament_id` shows blue banner
- ✅ "View Series" button links to series homepage
- ✅ Easy navigation between editions

## 🔧 Post-Deployment Tasks (Optional)

After deployment, you can:

### 1. Create More Editions
For the 4 series without editions (Sligo, GRENKE, Isle of Wight, Prague):

**Option A: Via UI**
- Go to "Create Tournament"
- Fill in tournament details
- Set `parent_tournament_id` to the series ID
- Submit

**Option B: Via API**
```bash
POST /tournaments
{
  "name": "Sligo Chess Festival 2025",
  "parent_tournament_id": 2,  # Series ID from seed
  "start_date": "2025-07-10",
  "tournament_category": "recurring",
  ...
}
```

### 2. Add Photos to Editions
- Upload images to tournament editions
- They'll appear in the series photo gallery
- Test the aggregation feature

### 3. Add Reviews to Editions
- Users can review individual editions
- Reviews appear on both edition page and series homepage
- Test cross-edition review display

### 4. Customize Series Data
If you want to change descriptions or images:
- Edit `backend/seed-series.js`
- Update the `tournamentSeriesData` array
- Redeploy or run `npm run seed:series` again

## 📊 Monitoring After Deployment

### Check Migration Success
```sql
-- Check migration ran
SELECT * FROM schema_migrations WHERE migration_name = '049_add_series_parent_flag.sql';

-- Check field exists
SELECT column_name FROM information_schema.columns
WHERE table_name = 'tournaments' AND column_name = 'is_series_parent';
```

### Check Seed Data
```sql
-- Check series created (should return 5)
SELECT id, name FROM tournaments WHERE is_series_parent = true;

-- Check Tata Steel editions (should return 3)
SELECT id, name, start_date FROM tournaments
WHERE parent_tournament_id = (
  SELECT id FROM tournaments
  WHERE name = 'Tata Steel Chess Tournament' AND is_series_parent = true
);
```

### Check API Endpoints
```bash
# Get series data
curl http://your-domain/api/tournaments/1/series

# Get series images
curl http://your-domain/api/tournaments/1/series/images

# Get series reviews
curl http://your-domain/api/tournaments/1/series/reviews
```

### Check Frontend
- Visit `/tournaments` - series parents should NOT appear in list
- Visit `/tournament/2` - should show series banner (if it's an edition)
- Visit `/tournaments/1/series` - should show series homepage with 3 editions

## 🐛 Troubleshooting

### If Migration Fails
The `setup-db.js` script handles this gracefully:
- Ignores "already exists" errors
- Continues with other migrations
- Logs warnings but doesn't stop deployment

### If Seed Fails
The `seed-series.js` script:
- Checks if series already exist before creating
- Skips existing series
- Won't duplicate data on multiple runs
- Safe to run multiple times

### If Series Don't Appear
```sql
-- Check if created
SELECT * FROM tournaments WHERE is_series_parent = true;

-- If empty, manually run seed:
cd backend && npm run seed:series
```

## 📝 Files Modified for Deployment

### Backend
- ✅ `backend/setup-db.js` - Added migrations 048 & 049
- ✅ `backend/package.json` - Added seed:series to start script
- ✅ `backend/seed-series.js` - New seed script
- ✅ `backend/src/db/migrations/049_add_series_parent_flag.sql` - New migration

### No Frontend Build Changes
- Frontend changes are JavaScript/TypeScript (no build config needed)
- New components and routes are included in normal build process

## 🎯 Success Criteria

After deployment is successful if:

✅ Migration 049 completed without errors
✅ 5 tournament series exist in database
✅ 3 Tata Steel editions exist and are linked to parent
✅ Series homepage loads at `/tournaments/{id}/series`
✅ Tata Steel shows 3 editions in timeline
✅ Individual tournament pages show series banner when applicable
✅ No errors in server logs related to tournaments
✅ Regular tournament browsing still works (series parents filtered out)

## 🚨 Rollback Plan (If Needed)

If something goes wrong:

### Quick Fix
```sql
-- Hide series from appearing anywhere
UPDATE tournaments SET is_series_parent = false WHERE is_series_parent = true;
```

### Full Rollback
```sql
-- Remove series and unlink editions
UPDATE tournaments SET parent_tournament_id = NULL WHERE parent_tournament_id IS NOT NULL;
DELETE FROM tournaments WHERE is_series_parent = true;
ALTER TABLE tournaments DROP COLUMN IF EXISTS is_series_parent;
```

### Disable Seed
```json
// In package.json, remove seed:series from start script
"start": "node setup-db.js && npm run backfill:tournaments && node dist/server.js",
```

## 📞 Support

If you encounter issues:

1. Check server logs for migration/seed errors
2. Check database schema: `\d tournaments` (psql)
3. Verify series count: `SELECT COUNT(*) FROM tournaments WHERE is_series_parent = true;`
4. Test API manually: `GET /tournaments/1/series`

## 🎉 That's It!

The deployment is fully automated. Just deploy as normal and the tournament series feature will be live with 5 example series ready to go!

**First thing to test:** Visit `/tournaments/1/series` to see the Tata Steel Chess Tournament with its 3 editions! 🏆
