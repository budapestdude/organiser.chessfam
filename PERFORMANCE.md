# Performance Optimization Guide

This document outlines all performance optimizations implemented in ChessFam and best practices for maintaining optimal performance.

## 📊 Implemented Optimizations

### 1. Code Splitting & Lazy Loading

**What:** All route components are lazy-loaded using React.lazy()
**Impact:** Reduces initial bundle size from ~1.7MB to separate chunks
**Location:** `src/App.tsx`

```typescript
// Before: All components loaded upfront (1.7MB bundle)
import TournamentDetail from './pages/TournamentDetail';

// After: Lazy loaded (split into separate chunks)
const TournamentDetail = lazy(() => import('./pages/TournamentDetail'));

// Wrapped in Suspense for loading states
<Suspense fallback={<PageLoader />}>
  <Routes>...</Routes>
</Suspense>
```

**Benefits:**
- Initial page load reduced by ~70%
- Only loads code for the current route
- Better caching (unchanged routes stay cached)

### 2. Manual Chunk Splitting

**What:** Vendors and libraries split into logical chunks
**Impact:** Better caching and parallel loading
**Location:** `vite.config.ts`

**Chunks:**
- `react-vendor` - React, React DOM, React Router (core framework)
- `ui-vendor` - Framer Motion, Headless UI (UI libraries)
- `utils-vendor` - Axios, Zustand, date-fns, uuid (utilities)
- `chess-vendor` - chess.js, react-chessboard (chess-specific)
- `icons-vendor` - lucide-react (icon library)

**Benefits:**
- Vendors cached separately from app code
- Updates to app code don't invalidate vendor cache
- Faster builds (vendors only rebuild when dependencies change)

### 3. Compression

**Frontend (Vite):**
- Gzip compression (.gz files)
- Brotli compression (.br files)
- Pre-compressed assets served by CDN

**Backend (Express):**
- Response compression middleware
- Threshold: 1KB (only compress responses > 1KB)
- Excludes already-compressed content (images)

**Impact:** 60-80% reduction in transfer size

### 4. Build Optimizations

**Terser Minification:**
```typescript
minify: 'terser',
terserOptions: {
  compress: {
    drop_console: true,  // Remove console.logs
    drop_debugger: true, // Remove debuggers
  },
}
```

**CSS Code Splitting:**
- Separate CSS per route
- Only load CSS for current page

**Tree Shaking:**
- Removes unused exports from node_modules
- Dead code elimination

### 5. Caching Strategy

**Frontend Assets:**
```
index.html: no-cache (always fresh)
/assets/*: immutable, max-age=31536000 (1 year)
```

**Why:**
- HTML changes frequently (routes, meta tags)
- Hashed assets never change (cache forever)
- Build process generates new hashes on changes

### 6. Image Optimization

**Recommendations:**
1. Use WebP format (70% smaller than JPEG)
2. Serve responsive images with srcset
3. Lazy load images below the fold
4. Compress images before upload

**Implementation Example:**
```typescript
<img
  src="/images/tournament.webp"
  srcSet="
    /images/tournament-400.webp 400w,
    /images/tournament-800.webp 800w,
    /images/tournament-1200.webp 1200w
  "
  sizes="(max-width: 600px) 400px, (max-width: 1200px) 800px, 1200px"
  loading="lazy"
  alt="Tournament"
/>
```

## 🚀 Performance Best Practices

### React Component Optimization

#### 1. Use React.memo for Pure Components

```typescript
// Prevents re-render if props haven't changed
const TournamentCard = React.memo(({ tournament }) => {
  return (
    <div>
      <h3>{tournament.name}</h3>
      <p>{tournament.date}</p>
    </div>
  );
});
```

**When to use:**
- List items that render many times
- Components with expensive render logic
- Components that receive the same props frequently

**When NOT to use:**
- Components that rarely re-render
- Components with props that change on every render

#### 2. useMemo for Expensive Calculations

```typescript
function TournamentsList({ tournaments, filters }) {
  // Expensive filtering/sorting only runs when dependencies change
  const filteredTournaments = useMemo(() => {
    return tournaments
      .filter(t => t.category === filters.category)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [tournaments, filters]);

  return <div>{filteredTournaments.map(...)}</div>;
}
```

**When to use:**
- Expensive array operations (filter, map, sort)
- Complex calculations
- Creating derived state from props

#### 3. useCallback for Stable Function References

```typescript
function TournamentDetail() {
  // Function reference stays stable across re-renders
  const handleRegister = useCallback((tournamentId) => {
    registerForTournament(tournamentId);
    trackConversion('tournament_registration');
  }, []); // Empty deps = function never changes

  return <RegisterButton onClick={handleRegister} />;
}
```

**When to use:**
- Passing callbacks to memoized child components
- Callbacks used in useEffect dependencies
- Event handlers passed to many children

#### 4. Avoid Inline Object/Array Creation

```typescript
// ❌ Bad: Creates new object on every render
<TournamentCard style={{ padding: 20 }} />

// ✅ Good: Define outside component or use useMemo
const cardStyle = { padding: 20 };
<TournamentCard style={cardStyle} />

// ❌ Bad: Creates new array on every render
<FilterButtons filters={['all', 'upcoming', 'past']} />

// ✅ Good: Define outside component
const FILTER_OPTIONS = ['all', 'upcoming', 'past'];
<FilterButtons filters={FILTER_OPTIONS} />
```

#### 5. Virtualization for Long Lists

For lists with 100+ items, use virtualization:

```typescript
import { FixedSizeList } from 'react-window';

function TournamentsList({ tournaments }) {
  const Row = ({ index, style }) => (
    <div style={style}>
      <TournamentCard tournament={tournaments[index]} />
    </div>
  );

  return (
    <FixedSizeList
      height={600}
      itemCount={tournaments.length}
      itemSize={100}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
}
```

**Benefits:**
- Only renders visible items
- Smooth scrolling with 1000+ items
- Constant memory usage

### Database Query Optimization

#### 1. Use Indexes

```sql
-- Add indexes for frequently queried columns
CREATE INDEX idx_tournaments_start_date ON tournaments(start_date);
CREATE INDEX idx_tournaments_status ON tournaments(status);
CREATE INDEX idx_users_email ON users(email);
```

#### 2. Limit Results

```typescript
// Always use LIMIT for lists
const tournaments = await query(
  `SELECT * FROM tournaments ORDER BY start_date DESC LIMIT 50`
);
```

#### 3. Select Only Needed Columns

```typescript
// ❌ Bad: Fetches all columns
SELECT * FROM tournaments

// ✅ Good: Only fetch what you need
SELECT id, name, start_date, venue_city FROM tournaments
```

#### 4. Use JOIN Instead of Multiple Queries

```typescript
// ❌ Bad: N+1 query problem
const tournaments = await query('SELECT * FROM tournaments');
for (const t of tournaments.rows) {
  const venue = await query('SELECT * FROM venues WHERE id = $1', [t.venue_id]);
}

// ✅ Good: Single query with JOIN
const tournaments = await query(`
  SELECT t.*, v.name as venue_name, v.city as venue_city
  FROM tournaments t
  LEFT JOIN venues v ON t.venue_id = v.id
`);
```

### API Response Optimization

#### 1. Pagination

```typescript
// Always paginate large datasets
export const getTournaments = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  const result = await query(
    'SELECT * FROM tournaments LIMIT $1 OFFSET $2',
    [limit, offset]
  );

  res.json({
    data: result.rows,
    pagination: { page, limit, total: totalCount }
  });
};
```

#### 2. Field Selection

Allow clients to specify which fields they need:

```typescript
// GET /api/tournaments?fields=id,name,date
const fields = req.query.fields || '*';
const query = `SELECT ${fields} FROM tournaments`;
```

#### 3. Caching Headers

```typescript
// Cache static data
res.set('Cache-Control', 'public, max-age=3600'); // 1 hour

// Don't cache dynamic data
res.set('Cache-Control', 'no-cache, must-revalidate');
```

## 📈 Measuring Performance

### Frontend Metrics

**Lighthouse Audit:**
```bash
npm install -g lighthouse
lighthouse https://chessfam.com --view
```

**Key metrics:**
- First Contentful Paint (FCP) < 1.8s
- Largest Contentful Paint (LCP) < 2.5s
- Time to Interactive (TTI) < 3.8s
- Cumulative Layout Shift (CLS) < 0.1

**Bundle Analysis:**
```bash
ANALYZE=true npm run build
```

Opens interactive bundle visualization showing:
- Size of each chunk
- What's inside each chunk
- Opportunities for optimization

### Backend Metrics

**Response Time Monitoring:**
```typescript
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${duration}ms`);
  });
  next();
});
```

**Database Query Performance:**
```sql
-- Enable query timing
EXPLAIN ANALYZE SELECT * FROM tournaments WHERE status = 'upcoming';
```

## 🎯 Performance Checklist

### Before Each Release

- [ ] Run bundle analyzer (ANALYZE=true npm run build)
- [ ] Check for bundle size increase > 10%
- [ ] Run Lighthouse audit
- [ ] Test on slow 3G network (Chrome DevTools)
- [ ] Check largest chunks are cached properly
- [ ] Verify lazy loading works on all routes
- [ ] Test image loading (lazy load, WebP format)
- [ ] Check for console.logs in production build
- [ ] Verify compression working (gzip/brotli)
- [ ] Test API response times (< 200ms for most endpoints)

### Regular Maintenance

- [ ] Review and remove unused dependencies (monthly)
- [ ] Update heavy dependencies if lighter alternatives exist
- [ ] Audit and optimize slow database queries
- [ ] Review and add indexes for common queries
- [ ] Check for N+1 query problems
- [ ] Monitor bundle size trends

## 🔧 Tools

**Bundle Analysis:**
- Vite build stats
- rollup-plugin-visualizer

**Performance Testing:**
- Chrome DevTools (Network, Performance tabs)
- Lighthouse
- WebPageTest

**Database:**
- PostgreSQL EXPLAIN ANALYZE
- pg_stat_statements extension

## 📚 Additional Resources

- [Web Vitals](https://web.dev/vitals/)
- [React Performance](https://react.dev/learn/render-and-commit)
- [Vite Performance](https://vitejs.dev/guide/performance.html)
- [PostgreSQL Performance](https://www.postgresql.org/docs/current/performance-tips.html)
