# Tournament Series Seed Data

This directory contains seed scripts to populate your database with example tournament series for famous chess tournaments.

## What Gets Created

The seed scripts create **tournament series** (virtual parent containers) for the following famous chess tournaments:

### 1. **Tata Steel Chess Tournament** 🇳🇱
- **Location:** Wijk aan Zee, Netherlands
- **Description:** One of the world's most prestigious chess tournaments, held annually since 1938
- **Editions Created:** 2024, 2025, 2026 (with example data)

### 2. **Sligo Chess Festival** 🇮🇪
- **Location:** Sligo, Ireland
- **Description:** Ireland's premier chess festival combining competitive chess with Irish hospitality

### 3. **GRENKE Chess Classic** 🇩🇪
- **Location:** Baden-Baden, Germany
- **Description:** Elite round-robin tournament, part of the Grand Chess Tour

### 4. **Isle of Wight Chess Festival** 🇬🇧
- **Location:** Isle of Wight, UK
- **Description:** Annual chess congress with multiple sections, combining chess with a holiday atmosphere

### 5. **Prague Chess Festival** 🇨🇿
- **Location:** Prague, Czech Republic
- **Description:** International open tournament in Prague's historic center

## Prerequisites

1. **Database migration 049 must be run first:**
   ```bash
   cd backend
   npm run migrate:up
   ```

2. **At least one user must exist in your database**

3. **Database connection configured** in your `.env` file

## How to Run

### Option 1: Node.js Script (Recommended)

```bash
cd backend
node seed-series.js
```

This will:
- ✅ Create all 5 tournament series
- ✅ Create 3 example editions for Tata Steel (2024, 2025, 2026)
- ✅ Skip any series that already exist
- ✅ Show you the series IDs for testing

### Option 2: SQL File

```bash
cd backend/src/db/seeds
psql -d your_database_name -f tournament_series_examples.sql
```

### Option 3: TypeScript (if using ts-node)

```bash
cd backend
npx ts-node src/db/seeds/seedTournamentSeries.ts
```

## After Seeding

### View the Series Homepages

1. **Tata Steel Chess Tournament:**
   - Visit: `http://localhost:3000/tournaments/{series-id}/series`
   - Replace `{series-id}` with the ID shown in the seed output
   - You'll see all 3 editions (2024, 2025, 2026) on the series homepage

2. **Other Series:**
   - Visit each series homepage using their IDs
   - Create editions via the UI by creating tournaments and linking them to the parent

### Create More Editions

You can create more editions in several ways:

#### Via UI
1. Go to "Create Tournament"
2. Fill in the tournament details
3. Set `parent_tournament_id` to the series ID
4. The edition will appear on the series homepage

#### Via API
```bash
POST /tournaments
{
  "name": "Tata Steel Chess Tournament 2027",
  "parent_tournament_id": 1,  // Series ID
  "start_date": "2027-01-15",
  "tournament_category": "recurring",
  ...
}
```

#### Via SQL
```sql
INSERT INTO tournaments (
  name, parent_tournament_id, start_date, ...
) VALUES (
  'Sligo Chess Festival 2025', 2, '2025-07-10', ...
);
```

## What the Data Looks Like

### Series Parent Record
```
{
  "name": "Tata Steel Chess Tournament",
  "description": "One of the world's most prestigious...",
  "is_series_parent": true,
  "tournament_category": "series",
  "image": "https://images.unsplash.com/...",
  "status": "upcoming"
}
```

### Edition Records
```
{
  "name": "Tata Steel Chess Tournament 2024",
  "parent_tournament_id": 1,  // Links to series parent
  "is_series_parent": false,
  "tournament_category": "recurring",
  "start_date": "2024-01-12",
  "end_date": "2024-01-28",
  "current_participants": 14,
  "prize_pool": 100000,
  "status": "completed"
}
```

## Testing the Feature

### 1. Browse Series
- Go to `/tournaments` - series parents should NOT appear in the list
- Only individual editions appear in tournament browse

### 2. View Individual Edition
- Click on "Tata Steel Chess Tournament 2024"
- You should see a blue banner: "Part of a tournament series"
- Click "View Series" button

### 3. Series Homepage
- See all editions in chronological order
- View aggregate stats (total participants, avg rating, photos)
- Next upcoming edition highlighted
- Photo gallery from all editions
- Reviews from all editions

### 4. Navigation
- Click on any edition to view its detail page
- Return to series homepage via banner link
- Navigate between different editions

## Customization

To customize the seed data:

1. **Edit `seed-series.js`:**
   - Modify the `tournamentSeriesData` array
   - Change descriptions, images, or add new series
   - Add more editions to the `editions` array

2. **Add Your Own Images:**
   - Replace the Unsplash URLs with your own tournament photos
   - Add to the `image` field for series or editions

3. **Add More Series:**
   - Copy the template and add more tournament series
   - Examples: World Chess Championship, Candidates Tournament, etc.

## Troubleshooting

### Error: "No users found"
- Create at least one user in your database first
- Or modify the script to use a specific user ID

### Error: "relation tournaments does not exist"
- Run migration 049 first: `npm run migrate:up`

### Error: "column is_series_parent does not exist"
- Run migration 049 first: `npm run migrate:up`

### Series not showing on homepage
- Check that `parent_tournament_id` matches the series ID
- Check that editions have `is_series_parent = false`
- Check that editions are approved: `approval_status = 'approved'`

## Files

- `seed-series.js` - Main seed script (Node.js)
- `src/db/seeds/seedTournamentSeries.ts` - TypeScript version
- `src/db/seeds/tournament_series_examples.sql` - Raw SQL version
- `TOURNAMENT_SERIES_SEED.md` - This documentation

## Next Steps

After seeding the data:

1. ✅ View the Tata Steel series homepage with 3 editions
2. ✅ Create editions for the other 4 series
3. ✅ Upload photos to editions to see the gallery feature
4. ✅ Add reviews to editions to see cross-edition reviews
5. ✅ Test the navigation between series and editions

Enjoy your tournament series homepages! 🎉
