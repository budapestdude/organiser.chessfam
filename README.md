# ChessFam Organizer Hub

A dedicated management platform for tournament and club organizers at `organiser.chessfam.com`.

## Overview

The ChessFam Organizer Hub is a separate frontend application that provides tournament and club organizers with comprehensive tools to manage their events, track analytics, and monitor financials. Built with React, TypeScript, and Tailwind CSS, it shares the same backend API with the main ChessFam application.

## Features

### Dashboard
- Overview of all tournaments and clubs
- Real-time statistics (revenue, participants, events)
- Recent activity feed
- Upcoming events calendar

### Tournament Management
- View all owned tournaments
- Detailed tournament pages with participant lists
- Comprehensive analytics:
  - Registration trends
  - Rating distribution
  - Geographic distribution
  - Revenue breakdown
  - Refund statistics
- Export participant data to CSV

### Club Management
- View all owned clubs
- Detailed club pages with member lists
- Club analytics:
  - Member growth trends
  - Rating distribution
  - Role distribution
  - Monthly revenue
  - Messaging activity
  - Event statistics
- Export member data to CSV

### Analytics Dashboard
- Cross-event comparison
- Event and revenue distribution
- Tournament status breakdown
- Participant distribution analysis
- Recent activity tracking

### Financial Reports
- Revenue and refund tracking
- Monthly revenue trends
- Event-by-event breakdown
- Transaction history
- Date range filtering
- Export to CSV

## Tech Stack

### Frontend
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router DOM 7** - Routing
- **Zustand** - State management
- **Tailwind CSS 4** - Styling
- **Recharts** - Data visualization
- **Lucide React** - Icons
- **Axios** - HTTP client

### Backend (Shared)
- **Node.js** with Express
- **PostgreSQL** - Database
- **JWT** - Authentication

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Access to ChessFam backend API

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd chessfam-organizer-hub

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Update .env with your API URL
VITE_API_URL=http://localhost:3000/api/v1
VITE_MAIN_APP_URL=http://localhost:5173
```

### Development

```bash
# Start development server
npm run dev

# Open browser at http://localhost:5173
```

### Building for Production

```bash
# Build the application
npm run build

# Preview production build
npm run preview
```

### Environment Variables

Create a `.env` file with the following variables:

```env
# API Configuration
VITE_API_URL=https://api.chessfam.com/api/v1
VITE_MAIN_APP_URL=https://chessfam.com

# Optional: Stripe (for future features)
VITE_STRIPE_PUBLIC_KEY=pk_test_...
```

## Project Structure

```
chessfam-organizer-hub/
├── src/
│   ├── api/              # API client modules
│   │   ├── client.ts     # Axios setup with caching
│   │   ├── auth.ts       # Authentication endpoints
│   │   ├── organizer.ts  # Organizer dashboard & financials
│   │   ├── tournaments.ts # Tournament management
│   │   └── clubs.ts      # Club management
│   ├── components/
│   │   ├── common/       # Reusable components
│   │   │   ├── StatsCard.tsx
│   │   │   ├── Pagination.tsx
│   │   │   └── LoadingSkeleton.tsx
│   │   ├── layout/       # Layout components
│   │   │   ├── Layout.tsx
│   │   │   └── OrganizerSidebar.tsx
│   │   ├── ProtectedRoute.tsx
│   │   └── ErrorBoundary.tsx
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── tournaments/  # Tournament pages
│   │   │   ├── TournamentsList.tsx
│   │   │   ├── TournamentDetail.tsx
│   │   │   └── TournamentAnalytics.tsx
│   │   ├── clubs/        # Club pages
│   │   │   ├── ClubsList.tsx
│   │   │   ├── ClubDetail.tsx
│   │   │   └── ClubAnalytics.tsx
│   │   ├── analytics/
│   │   │   └── AnalyticsDashboard.tsx
│   │   └── financials/
│   │       └── FinancialReports.tsx
│   ├── store/            # Zustand state management
│   │   └── index.ts
│   ├── types/            # TypeScript type definitions
│   │   └── index.ts
│   ├── utils/            # Utility functions
│   │   └── token.ts      # JWT token management
│   ├── App.tsx           # Main app component
│   ├── main.tsx          # Entry point
│   └── index.css         # Global styles
├── public/               # Static assets
├── .env.example          # Environment variables template
├── DEPLOYMENT.md         # Deployment guide
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Key Features Implementation

### Authentication
- JWT-based authentication with access tokens (15min) and refresh tokens (365 days)
- Automatic token refresh on 401 responses
- Protected routes requiring authentication
- Shared authentication with main ChessFam app

### State Management
- Zustand store with persist middleware
- Separate slices for auth, dashboard, tournaments, clubs, and financials
- Automatic data refetching on mount

### Data Visualization
- Recharts for all charts and graphs
- Consistent dark theme across all visualizations
- Responsive charts that adapt to screen size
- Interactive tooltips with formatted data

### Design System
- Glass-morphism cards (`bg-white/5`, `backdrop-blur-xl`)
- Purple primary color (#8b5cf6)
- Gold accent color (#fbbf24)
- Chess dark theme backgrounds (#1a1a2e, #0f0f1a)
- Consistent spacing and typography

### Mobile Responsiveness
- Hamburger menu on small screens
- Collapsible sidebar
- Responsive grid layouts
- Touch-friendly button sizes
- Horizontal scroll for wide tables

## API Endpoints

### Organizer
- `GET /api/v1/organizer/dashboard` - Aggregate dashboard data
- `GET /api/v1/organizer/financials` - Financial reports with date filtering

### Tournaments
- `GET /api/v1/tournaments` - List all owned tournaments
- `GET /api/v1/tournaments/:id` - Get tournament details
- `GET /api/v1/tournaments/:id/analytics` - Get analytics data
- `GET /api/v1/tournaments/:id/participants` - List participants
- `POST /api/v1/tournaments/:id/participants/bulk-action` - Bulk operations
- `GET /api/v1/tournaments/:id/participants/export` - Export CSV

### Clubs
- `GET /api/v1/clubs` - List all owned clubs
- `GET /api/v1/clubs/:id` - Get club details
- `GET /api/v1/clubs/:id/analytics` - Get analytics data
- `GET /api/v1/clubs/:id/members` - List members
- `POST /api/v1/clubs/:id/members/bulk-action` - Bulk operations
- `GET /api/v1/clubs/:id/members/export` - Export CSV

## Development Guidelines

### Code Style
- Use TypeScript for all new files
- Follow existing naming conventions
- Use functional components with hooks
- Prefer composition over inheritance
- Keep components focused and single-purpose

### Component Guidelines
- Extract reusable components to `components/common/`
- Use loading skeletons instead of spinners where possible
- Handle loading and error states explicitly
- Use semantic HTML elements
- Ensure accessibility (ARIA labels, keyboard navigation)

### State Management
- Use Zustand for global state
- Use local state for component-specific data
- Avoid prop drilling - use context or store
- Persist only essential auth state

### Styling
- Use Tailwind utility classes
- Follow existing color palette
- Use responsive design classes (`sm:`, `md:`, `lg:`)
- Maintain consistent spacing scale

## Testing

```bash
# Run type checking
npm run build

# Preview production build
npm run preview
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive deployment instructions.

Quick deploy:

```bash
# Build
npm run build

# Deploy to Cloudflare Pages
wrangler pages deploy dist --project-name=chessfam-organizer-hub

# Or deploy to Vercel
vercel --prod
```

## Contributing

This is a private project for ChessFam organizers. For internal contributions:

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit PR for review
5. Deploy after approval

## License

Proprietary - ChessFam Ltd.

## Support

For technical support:
- Check [DEPLOYMENT.md](./DEPLOYMENT.md) troubleshooting section
- Review Sentry error reports
- Contact tech team

---

**Version**: 1.0.0
**Last Updated**: 2026-01-27
**Maintained by**: ChessFam Development Team
