# ChessFam Backend API

Backend API for the ChessFam chess platform with authentication, user management, bookings, and payments.

## Tech Stack

- Node.js + Express
- TypeScript
- PostgreSQL
- JWT Authentication
- Bcrypt password hashing
- Stripe (for payments)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

**Required Environment Variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for access tokens
- `JWT_REFRESH_SECRET` - Secret key for refresh tokens
- `CORS_ORIGIN` - Frontend URL (e.g., http://localhost:5173)

### 3. Set Up PostgreSQL Database

You can use Railway, Supabase, or local PostgreSQL.

**For Railway:**
1. Create a new project on Railway
2. Add PostgreSQL service
3. Copy the connection string to `.env` as `DATABASE_URL`

**For Local PostgreSQL:**
```bash
# Create database
createdb chessfam

# Update DATABASE_URL in .env
DATABASE_URL=postgresql://your_username@localhost:5432/chessfam
```

### 4. Run Database Migrations

```bash
# Connect to your PostgreSQL database and run the migration file
psql $DATABASE_URL < src/db/migrations/001_create_users_table.sql
```

### 5. Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3000`

### 6. Test the API

**Health Check:**
```bash
curl http://localhost:3000/health
```

**Signup:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"Password123"}'
```

**Login:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123"}'
```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run migrate:up` - Run database migrations

## API Endpoints

### Authentication

- `POST /api/v1/auth/signup` - Create new account
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh access token
- `GET /api/v1/auth/me` - Get current user (protected)
- `POST /api/v1/auth/logout` - Logout (protected)

## Security Features

- Password hashing with bcrypt (12 salt rounds)
- JWT tokens (15min access, 7 day refresh)
- Rate limiting (5 requests/15min for auth endpoints)
- Input validation
- CORS protection
- Helmet security headers

## Project Structure

```
backend/
├── src/
│   ├── config/          # Database, JWT configuration
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Auth, error handling, rate limiting
│   ├── models/          # TypeScript interfaces
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Helpers, validators, errors
│   ├── types/           # TypeScript type definitions
│   ├── db/migrations/   # Database migrations
│   └── server.ts        # Express app entry point
├── .env                 # Environment variables (not in git)
├── .env.example         # Environment template
├── package.json
└── tsconfig.json
```

## Development

The server uses `ts-node-dev` for hot reloading during development. Any changes to TypeScript files will automatically restart the server.

## Deployment

### Deploy to Railway

1. Push your code to GitHub
2. Create new project on Railway
3. Add PostgreSQL service
4. Connect your GitHub repo
5. Add environment variables in Railway dashboard
6. Railway will auto-deploy on push

### Environment Variables for Production

Make sure to set strong, random secrets for production:
- Generate JWT secrets: `openssl rand -base64 64`
- Use Railway's provided `DATABASE_URL`
- Set `NODE_ENV=production`
- Set `CORS_ORIGIN` to your frontend domain

## Next Steps

After Phase 1 is complete, we'll add:
- User profile management (Phase 2)
- Bookings, favorites, messages (Phase 3)
- Stripe payment integration (Phase 4)
