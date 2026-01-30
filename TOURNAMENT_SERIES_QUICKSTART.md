# Tournament Series Homepage - Quick Start Guide

## 🎯 What Was Built

A **Tournament Series Homepage** feature that groups multiple editions of recurring tournaments together. Users can:
- Browse all editions of a tournament in one place (e.g., "Tata Steel 2024, 2025, 2026")
- View historical photos from all editions in one gallery
- Read reviews across all editions
- See aggregate statistics (total participants, average rating, etc.)
- Navigate between editions easily

## 🚀 Quick Start

### 1. Run Database Migration

```bash
cd backend
npm run migrate:up
```

This creates the `is_series_parent` field needed for series containers.

### 2. Seed Example Tournament Series

```bash
cd backend
npm run seed:series
```

This creates 5 famous tournament series:
- ✅ **Tata Steel Chess Tournament** (with 3 editions: 2024, 2025, 2026)
- ✅ **Sligo Chess Festival** (Ireland)
- ✅ **GRENKE Chess Classic** (Germany)
- ✅ **Isle of Wight Chess Festival** (UK)
- ✅ **Prague Chess Festival** (Czech Republic)

### 3. View the Series Homepage

After seeding, the script will show you the series ID. Visit:

```
http://localhost:3000/tournaments/{series-id}/series
```

For example, if Tata Steel has ID 1:
```
http://localhost:3000/tournaments/1/series
```

## 📁 Files Created

### Backend
- ✅ `backend/src/db/migrations/049_add_series_parent_flag.sql` - Database migration
- ✅ `backend/src/services/tournamentsService.ts` - 4 new service methods + updated getTournaments
- ✅ `backend/src/controllers/tournamentsController.ts` - 4 new controller methods
- ✅ `backend/src/routes/tournaments.ts` - 4 new routes
- ✅ `backend/seed-series.js` - Seed script for example data
- ✅ `backend/src/db/seeds/seedTournamentSeries.ts` - TypeScript seed version
- ✅ `backend/src/db/seeds/tournament_series_examples.sql` - SQL seed version
- ✅ `backend/TOURNAMENT_SERIES_SEED.md` - Seed documentation

### Frontend
- ✅ `src/pages/TournamentSeriesHomepage.tsx` - New series homepage component
- ✅ `src/api/tournaments.ts` - Updated with 4 new API methods
- ✅ `src/pages/TournamentDetail.tsx` - Added series banner
- ✅ `src/App.tsx` - Added series route

## 🎨 Features on Series Homepage

### Hero Section
- Series name and description
- Cover image
- 4 stat cards:
  - Total Editions Held
  - Total Players (across all editions)
  - Average Rating (from reviews)
  - Photo Count (from all galleries)

### Next Edition Highlight
- Golden highlighted card
- "Register Now" call-to-action
- Date and location

### Editions Timeline
- All editions listed chronologically
- Shows: date, participants, prize pool, location
- "Upcoming" badge for future editions
- Clickable cards to view edition details

### Photo Gallery
- Aggregates photos from all editions
- Lightbox view
- Shows combined gallery

### Reviews Section
- Reviews from all editions
- Shows which edition each review is from
- Aggregate rating across all editions

## 🔗 How It Works

### Data Model

**Series Parent (Virtual Container):**
```json
{
  "id": 1,
  "name": "Tata Steel Chess Tournament",
  "description": "One of the world's most prestigious...",
  "is_series_parent": true,
  "tournament_category": "series",
  "status": "upcoming"
}
```

**Tournament Editions (Real Tournaments):**
```json
{
  "id": 2,
  "name": "Tata Steel Chess Tournament 2024",
  "parent_tournament_id": 1,  // Links to series
  "is_series_parent": false,
  "start_date": "2024-01-12",
  "current_participants": 14,
  "status": "completed"
}
```

### API Endpoints

```
GET  /tournaments/:id/series          - Get series data + all editions + stats
GET  /tournaments/:id/series/images   - Get all images across editions
GET  /tournaments/:id/series/reviews  - Get all reviews across editions
POST /tournaments/series/create       - Create series + first edition
```

### User Flow

1. User browses tournaments → sees "Tata Steel 2024"
2. Clicks on it → sees tournament detail page
3. Sees blue banner: "Part of a tournament series"
4. Clicks "View Series" → goes to series homepage
5. Sees all editions: 2024, 2025, 2026
6. Views combined photo gallery from all editions
7. Reads reviews from all editions
8. Clicks on specific edition to register

## 📝 Creating Your Own Series

### Option 1: Via Seed Script (Recommended for Examples)

Edit `backend/seed-series.js` and add your series:

```javascript
{
  name: 'Your Tournament Name',
  description: 'Description of your tournament series',
  image: 'https://example.com/image.jpg'
}
```

Then run: `npm run seed:series`

### Option 2: Via SQL

```sql
-- Create series parent
INSERT INTO tournaments (
  name, description, image, organizer_id,
  is_series_parent, tournament_category,
  status, current_participants, entry_fee,
  created_at, updated_at
) VALUES (
  'My Chess Tournament',
  'Annual tournament description',
  'https://example.com/image.jpg',
  1,  -- Your user ID
  true,
  'series',
  'upcoming',
  0,
  0,
  NOW(),
  NOW()
) RETURNING id;

-- Create edition linked to parent (use id from above)
INSERT INTO tournaments (
  name, parent_tournament_id, start_date, ...
) VALUES (
  'My Chess Tournament 2024',
  1,  -- Series parent ID
  '2024-06-15',
  ...
);
```

### Option 3: Via API (Future Enhancement)

The `createTournamentSeries` endpoint is ready but needs UI integration in `CreateTournament.tsx`.

## 🧪 Testing

1. **Migration worked?**
   ```sql
   SELECT is_series_parent FROM tournaments LIMIT 1;
   ```
   Should not error.

2. **Series created?**
   ```sql
   SELECT id, name FROM tournaments WHERE is_series_parent = true;
   ```
   Should show 5 series.

3. **Editions linked?**
   ```sql
   SELECT id, name, parent_tournament_id
   FROM tournaments
   WHERE parent_tournament_id IS NOT NULL;
   ```
   Should show 3 Tata Steel editions.

4. **Series homepage works?**
   - Visit `/tournaments/1/series` (replace 1 with your series ID)
   - Should show all editions, stats, and next edition

5. **Banner appears?**
   - Visit any tournament edition (e.g., `/tournament/2`)
   - Should see blue "Part of a series" banner
   - Click "View Series" → should go to series homepage

## 🎯 Example Series IDs (After Seeding)

After running the seed script, you'll get IDs like:
- Series ID 1: Tata Steel Chess Tournament
- Series ID 2: Sligo Chess Festival
- Series ID 3: GRENKE Chess Classic
- Series ID 4: Isle of Wight Chess Festival
- Series ID 5: Prague Chess Festival

Visit: `http://localhost:3000/tournaments/1/series` to see Tata Steel with all 3 editions!

## 🐛 Troubleshooting

**"is_series_parent column doesn't exist"**
- Run migration: `npm run migrate:up`

**"No series showing"**
- Run seed: `npm run seed:series`
- Check series created: `SELECT * FROM tournaments WHERE is_series_parent = true`

**"Banner not showing on edition page"**
- Check edition has `parent_tournament_id` set
- Check edition has `is_series_parent = false`

**"Series homepage shows no editions"**
- Check editions have `parent_tournament_id` matching series ID
- Check editions have `approval_status = 'approved'`

## 📚 Documentation

- **Full implementation details:** See `/Users/michaelduke/.claude/plans/soft-juggling-lake.md`
- **Seed documentation:** See `backend/TOURNAMENT_SERIES_SEED.md`
- **Architecture:** Series parents are virtual containers, editions are real tournaments

## 🎉 You're Ready!

1. ✅ Migration run
2. ✅ Series seeded
3. ✅ Visit series homepage
4. ✅ Enjoy browsing tournament history!

Try visiting: `http://localhost:3000/tournaments/1/series` to see Tata Steel with its 2024, 2025, and 2026 editions!
