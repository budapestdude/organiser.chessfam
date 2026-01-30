# Database Setup Guide

## Option 1: Local PostgreSQL Setup (Windows)

### Install PostgreSQL

1. **Download PostgreSQL:**
   - Visit: https://www.postgresql.org/download/windows/
   - Download the installer for Windows
   - Run the installer and follow the setup wizard

2. **During Installation:**
   - Remember the password you set for the `postgres` superuser
   - Note the port (default is 5432)
   - Install pgAdmin (included with the installer) for GUI management

3. **Create Database:**
   ```bash
   # Open Command Prompt or PowerShell
   psql -U postgres
   # Enter your postgres password when prompted

   # In the PostgreSQL prompt:
   CREATE DATABASE chessfam;
   \q
   ```

4. **Update Backend `.env` File:**
   ```env
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/chessfam
   ```

5. **Run Migrations:**
   ```bash
   cd backend
   npm install
   node setup-db.js
   ```

---

## Option 2: Railway (Recommended - Free Tier Available)

Railway provides a free PostgreSQL database with 500 hours/month.

### Setup Steps:

1. **Create Account:**
   - Visit: https://railway.app/
   - Sign up with GitHub (free)

2. **Create PostgreSQL Database:**
   - Click "+ New Project"
   - Select "Provision PostgreSQL"
   - Wait for deployment (1-2 minutes)

3. **Get Connection String:**
   - Click on your PostgreSQL service
   - Go to "Connect" tab
   - Copy the "Postgres Connection URL"
   - It looks like: `postgresql://postgres:PASSWORD@HOST:PORT/railway`

4. **Update Backend `.env` File:**
   ```env
   DATABASE_URL=postgresql://postgres:PASSWORD@HOST:PORT/railway
   ```

5. **Run Migrations:**
   ```bash
   cd backend
   npm install
   node setup-db.js
   ```

---

## Option 3: Supabase (Alternative - Free Tier)

Supabase provides a free PostgreSQL database with additional features.

### Setup Steps:

1. **Create Account:**
   - Visit: https://supabase.com/
   - Sign up (free)

2. **Create Project:**
   - Click "New Project"
   - Choose organization and project name
   - Set database password (remember this!)
   - Select region closest to you
   - Wait for setup (2-3 minutes)

3. **Get Connection String:**
   - Go to Project Settings > Database
   - Find "Connection string" section
   - Select "URI" format
   - Copy the connection string
   - Replace `[YOUR-PASSWORD]` with your database password

4. **Update Backend `.env` File:**
   ```env
   DATABASE_URL=postgresql://postgres.PROJECT_REF:PASSWORD@HOST:5432/postgres
   ```

5. **Run Migrations:**
   ```bash
   cd backend
   npm install
   node setup-db.js
   ```

---

## Running Migrations

Once you have your database set up and `DATABASE_URL` configured:

```bash
# From the backend directory
cd F:\Cameo for Chess Experiences\chess-experiences\backend

# Install dependencies (if not already done)
npm install

# Run the migration script
node setup-db.js
```

This will create the `users` table with the correct schema.

---

## Verifying Setup

After running migrations, you should see output like:

```
Connected to database successfully
Running migration: 001_create_users_table.sql
Migration completed successfully
```

---

## Starting the Backend Server

Once the database is set up:

```bash
# From the backend directory
npm run dev
```

The server should start on `http://localhost:3000`

---

## Testing the API

You can test the authentication endpoints:

```bash
# Sign up a new user
curl -X POST http://localhost:3000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"Test1234"}'

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234"}'
```

---

## Troubleshooting

### Connection Issues

- **Error: "ECONNREFUSED"**
  - Check if PostgreSQL is running
  - Verify DATABASE_URL is correct
  - Check port is not blocked by firewall

- **Error: "password authentication failed"**
  - Double-check your database password
  - Ensure no extra spaces in DATABASE_URL

- **Error: "database does not exist"**
  - Create the database first (see installation steps)

### Migration Issues

- **Error: "relation already exists"**
  - Migration already ran successfully
  - Check database with: `psql DATABASE_URL -c "\dt"`

---

## Recommendation

**For development:** Railway or Supabase (easiest setup, no local installation)
**For production:** Railway with paid plan or dedicated PostgreSQL hosting

Choose Railway if you want the simplest setup - it's specifically designed for developers and has excellent DX.
