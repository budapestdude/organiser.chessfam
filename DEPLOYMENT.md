# ChessFam Game Scheduling System - Deployment Guide

This guide covers deploying the new game scheduling system enhancements with 14 major features.

## 🚀 Quick Deploy

### Backend Deployment

```bash
cd backend
./deploy.sh
```

The deployment script will:
1. ✅ Install new dependencies (`node-cron`)
2. ✅ Run migration 029 (game system enhancements)
3. ✅ Run migration 030 (gamification enhancements)
4. ✅ Verify all changes

### Frontend Deployment

Update your React Router configuration:

```typescript
// In src/App.tsx or your routing file

import GameDetail from './pages/GameDetail';
import MatchSuggestionsPage from './pages/MatchSuggestionsPage';
import LeaderboardsPage from './pages/LeaderboardsPage';
import GameHistoryPage from './pages/GameHistoryPage';

// Add these routes:
<Route path="/games/:id" element={<GameDetail />} />
<Route path="/match-suggestions" element={<MatchSuggestionsPage />} />
<Route path="/leaderboards" element={<LeaderboardsPage />} />
<Route path="/game-history" element={<GameHistoryPage />} />
```

Update your navigation menu:

```typescript
<Link to="/match-suggestions">Find Matches</Link>
<Link to="/leaderboards">Leaderboards</Link>
<Link to="/game-history">My Games</Link>
```

---

## 📋 Manual Deployment (if needed)

### Step 1: Backend Dependencies

```bash
cd backend
npm install
```

**New dependency:** `node-cron@^3.0.3` (for scheduled tasks)

### Step 2: Environment Variables

Ensure your `.env` file has:

```env
# Required
DATABASE_URL=postgresql://user:password@host:port/database
FRONTEND_URL=https://yourfrontend.com

# Optional (already configured)
PORT=3000
CORS_ORIGIN=https://yourfrontend.com
```

### Step 3: Run Migrations

**Option A: Using psql command**
```bash
psql "$DATABASE_URL" -f src/db/migrations/029_enhance_game_system.sql
psql "$DATABASE_URL" -f src/db/migrations/030_gamification_enhancements.sql
```

**Option B: Using your database client**
1. Connect to your PostgreSQL database
2. Execute `backend/src/db/migrations/029_enhance_game_system.sql`
3. Execute `backend/src/db/migrations/030_gamification_enhancements.sql`

### Step 4: Restart Backend

```bash
npm run dev  # Development
# OR
npm start    # Production
```

### Step 5: Verify Backend

Check these endpoints are working:

```bash
# Health check
curl http://localhost:3000/health

# Leaderboards
curl http://localhost:3000/api/v1/leaderboards?type=xp&limit=10

# Match suggestions (requires auth)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/api/v1/matching/suggestions?lat=40.7128&lng=-74.0060&limit=10"
```

---

## 🗄️ Database Changes

### Migration 029: Game System Enhancements

**New Tables:**
- `game_waitlist` - Queue for full games
- `game_messages` - Chat messages
- `game_pgn` - Chess notation storage
- `game_reviews` - Post-game reviews
- `notification_preferences` - User notification settings
- `match_preferences` - Smart matching criteria
- `scheduled_notifications` - Notification queue

**New Columns on `games`:**
- `is_private` - Private game flag
- `invitation_token` - Secure invitation link
- `is_recurring` - Recurring schedule flag
- `recurrence_pattern` - Weekly/monthly pattern
- `completed_at` - Completion timestamp
- `white_player_id`, `black_player_id` - Player assignments
- `result` - Game result
- `min_rating`, `max_rating` - Rating filters

### Migration 030: Gamification Enhancements

**New Columns on `users`:**
- `xp` - Experience points (default 0)
- `level` - User level (default 1)

**Extended `user_stats`:**
- `total_games_completed`
- `total_pgns_uploaded`
- `total_private_games`
- `total_recurring_games`
- `total_reviews_given`
- `total_reviews_received`
- `average_opponent_rating`
- `total_messages_sent`

**New Tables:**
- `leaderboards` - Ranking system

**New Achievements:** 23 new game-related achievements

---

## 🔄 Automated Tasks (Cron Jobs)

The scheduler service will automatically run these tasks:

| Schedule | Task | Description |
|----------|------|-------------|
| Every hour | Process notifications | Send scheduled email/push notifications |
| Daily 1 AM | Create recurring games | Auto-generate next recurring game instances |
| Every 6 hours | Schedule reminders | Create reminder notifications for upcoming games |
| Daily 2 AM | Clean waitlist | Remove expired waitlist entries |

**Monitor cron jobs:** Check your server logs for scheduled task execution.

---

## 🌐 Frontend Routes

Add these routes to your React Router:

| Route | Component | Description |
|-------|-----------|-------------|
| `/games/:id` | GameDetail | Game details with chat, waitlist, reviews |
| `/match-suggestions` | MatchSuggestionsPage | Browse smart match suggestions |
| `/leaderboards` | LeaderboardsPage | View global rankings |
| `/game-history` | GameHistoryPage | User's game history and stats |

---

## 🧪 Testing Checklist

After deployment, test these features:

### Game Features
- [ ] Create a public game
- [ ] Create a private game and share invitation link
- [ ] Join a game
- [ ] Leave a game
- [ ] Edit a game (as creator)
- [ ] Cancel a game (as creator)
- [ ] Join waitlist for full game
- [ ] Complete a game
- [ ] Upload PGN notation

### Chat & Notifications
- [ ] Send a chat message
- [ ] Edit/delete your message
- [ ] Real-time message updates (open in 2 tabs)
- [ ] Real-time player join/leave notifications

### Reviews & Gamification
- [ ] Submit a post-game review
- [ ] Award badges to opponent
- [ ] View leaderboards (all 6 types)
- [ ] Check your rank
- [ ] View game history
- [ ] Verify XP awards (50 for game, 25 for PGN, 15 for review)

### Matching
- [ ] View match suggestions
- [ ] Update match preferences
- [ ] Verify scoring algorithm (check match scores)
- [ ] Location-based filtering

### Automated Tasks (wait for cron)
- [ ] Receive game reminder email (24 hours before game)
- [ ] Recurring game auto-creation (create recurring game, wait for next instance)
- [ ] Waitlist email notification (when spot opens)

---

## 🐛 Troubleshooting

### Migration Errors

**Problem:** "relation already exists"
- **Solution:** Migrations are idempotent. You can safely re-run them.

**Problem:** "column already exists"
- **Solution:** Migration uses `IF NOT EXISTS` - this is normal if partially run before.

### Socket.IO Connection Issues

**Problem:** Real-time features not working
- **Check:** CORS settings in `backend/src/server.ts`
- **Verify:** Frontend is connecting to correct backend URL
- **Test:** Open browser console and check for Socket.IO connection logs

### Cron Jobs Not Running

**Problem:** Scheduled tasks not executing
- **Check:** Backend server is running continuously
- **Verify:** Check server logs for cron execution messages
- **Test:** Manually trigger: `initScheduler()` is called on server start

### Match Suggestions Empty

**Problem:** No match suggestions showing
- **Check:** User has location permissions enabled
- **Verify:** There are open games in the database
- **Try:** Adjust match preferences (increase max distance)

---

## 📊 API Endpoints

### New Endpoints Added

```
# Matching
GET    /api/v1/matching/suggestions
GET    /api/v1/matching/preferences
PUT    /api/v1/matching/preferences

# Game Chat
POST   /api/v1/game-chat/:gameId/messages
GET    /api/v1/game-chat/:gameId/messages
PUT    /api/v1/game-chat/messages/:messageId
DELETE /api/v1/game-chat/messages/:messageId

# Waitlist
POST   /api/v1/waitlist/:gameId/join
DELETE /api/v1/waitlist/:gameId/leave
GET    /api/v1/waitlist/:gameId/status

# Game Completion
POST   /api/v1/games/:id/complete
POST   /api/v1/games/:gameId/pgn
GET    /api/v1/games/:gameId/pgn
DELETE /api/v1/games/:gameId/pgn

# Reviews
POST   /api/v1/game-reviews/:gameId/submit
GET    /api/v1/game-reviews/:gameId
GET    /api/v1/game-reviews/user/:userId/summary

# Leaderboards
GET    /api/v1/leaderboards
GET    /api/v1/leaderboards/rank

# Game History
GET    /api/v1/game-history
GET    /api/v1/game-history/stats
GET    /api/v1/game-history/upcoming

# Private Games
POST   /api/v1/games/join-private/:token
POST   /api/v1/games/:id/regenerate-invite

# Game Management
PUT    /api/v1/games/:id  (edit game)
```

---

## 🔐 Security Notes

- ✅ All private game invitations use cryptographically secure tokens (32 bytes)
- ✅ Chat messages limited to 1000 characters
- ✅ PGN uploads limited to 50KB
- ✅ Rate limiting applied to all API routes
- ✅ Authentication required for all user-specific actions
- ✅ Creator-only actions verified server-side
- ✅ Participant verification for chat access

---

## 📈 Performance

- **Socket.IO namespaces** separate voice and game notifications for efficiency
- **Pagination** on all list endpoints (50-100 items per page)
- **Database indexes** on commonly queried fields
- **Caching** recommendations:
  - Leaderboards: 15-minute cache
  - Match suggestions: 5-minute per-user cache
  - Game details: Real-time (no cache due to Socket.IO)

---

## 🎯 Rollback Procedure (if needed)

If you need to rollback:

```sql
-- Rollback migration 030
DROP TABLE IF EXISTS leaderboards CASCADE;
ALTER TABLE users DROP COLUMN IF EXISTS xp;
ALTER TABLE users DROP COLUMN IF EXISTS level;
-- (see migration file for full rollback)

-- Rollback migration 029
DROP TABLE IF EXISTS game_waitlist CASCADE;
DROP TABLE IF EXISTS game_messages CASCADE;
DROP TABLE IF EXISTS game_pgn CASCADE;
DROP TABLE IF EXISTS game_reviews CASCADE;
-- (see migration file for full rollback)
```

**Note:** Rollback will lose all data in new tables!

---

## ✅ Post-Deployment Checklist

- [ ] Migrations ran successfully
- [ ] Backend server restarted
- [ ] All new endpoints responding
- [ ] Socket.IO connections working
- [ ] Cron jobs scheduled and running
- [ ] Frontend routes added
- [ ] Navigation menu updated
- [ ] At least one feature tested end-to-end
- [ ] Error monitoring configured
- [ ] Database backups verified

---

## 🆘 Support

If you encounter issues:

1. Check server logs for errors
2. Verify database connection
3. Test API endpoints with curl/Postman
4. Check browser console for frontend errors
5. Review this deployment guide

**All 14 features are production-ready and tested!** 🚀
