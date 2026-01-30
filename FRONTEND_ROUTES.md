# Frontend Routes - Quick Reference

Add these routes to your React Router configuration.

## Location: src/App.tsx (or your routing file)

### Step 1: Import New Pages

```typescript
import GameDetail from './pages/GameDetail';
import MatchSuggestionsPage from './pages/MatchSuggestionsPage';
import LeaderboardsPage from './pages/LeaderboardsPage';
import GameHistoryPage from './pages/GameHistoryPage';
```

### Step 2: Add Routes

```typescript
<Routes>
  {/* Existing routes... */}

  {/* New game scheduling routes */}
  <Route path="/games/:id" element={<GameDetail />} />
  <Route path="/match-suggestions" element={<MatchSuggestionsPage />} />
  <Route path="/leaderboards" element={<LeaderboardsPage />} />
  <Route path="/game-history" element={<GameHistoryPage />} />

  {/* Protected route example if needed: */}
  <Route
    path="/game-history"
    element={
      <ProtectedRoute>
        <GameHistoryPage />
      </ProtectedRoute>
    }
  />
</Routes>
```

### Step 3: Update Navigation (Optional)

Add links to your navbar/menu component:

```typescript
// In your Navbar component
<Link to="/games">Find Games</Link>
<Link to="/match-suggestions">Matches For You</Link>
<Link to="/leaderboards">Leaderboards</Link>
<Link to="/game-history">My Games</Link>
```

### Step 4: Update GamesList Component (Optional)

Make game cards clickable to navigate to detail page:

```typescript
// In src/pages/GamesList.tsx
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();

// On game card click:
onClick={() => navigate(`/games/${game.id}`)}
```

## Route Summary

| Path | Component | Auth Required | Description |
|------|-----------|---------------|-------------|
| `/games/:id` | GameDetail | No* | View game details, chat, join/leave |
| `/match-suggestions` | MatchSuggestionsPage | No** | Browse match suggestions |
| `/leaderboards` | LeaderboardsPage | No | View global rankings |
| `/game-history` | GameHistoryPage | Yes | View personal game history |

\* Some features require auth (join, chat, review)
\** Better experience with auth (saved preferences)

## Navigation Examples

### In GamesList
```typescript
<button onClick={() => navigate(`/games/${game.id}`)}>
  View Details
</button>
```

### In Dashboard
```typescript
<Link to="/match-suggestions">
  See {suggestionsCount} Matches
</Link>
```

### In Profile
```typescript
<Link to="/game-history">
  View My Games ({gamesCount})
</Link>
```

### In Navbar
```typescript
<div className="nav-links">
  <NavLink to="/games">Games</NavLink>
  <NavLink to="/match-suggestions">Matches</NavLink>
  <NavLink to="/leaderboards">Rankings</NavLink>
  <NavLink to="/game-history">History</NavLink>
</div>
```

## That's it! 🎉

After adding these routes, all 14 features will be accessible through the UI.
