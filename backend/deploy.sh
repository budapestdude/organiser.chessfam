#!/bin/bash

# ChessFam Game Scheduling System - Deployment Script
# This script handles migrations and dependency installation for the new features

set -e  # Exit on error

echo "🚀 ChessFam Deployment Script"
echo "=============================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ Error: .env file not found${NC}"
    echo "Please create a .env file with your database credentials"
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

echo -e "${BLUE}📦 Step 1: Installing Dependencies${NC}"
npm install
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

echo -e "${BLUE}🗄️  Step 2: Running Database Migrations${NC}"
echo "This will add new tables and columns for:"
echo "  - Game chat and messaging"
echo "  - Waitlist management"
echo "  - Private game invitations"
echo "  - PGN upload and storage"
echo "  - Post-game reviews and ratings"
echo "  - Leaderboards and rankings"
echo "  - Match preferences"
echo "  - Scheduled notifications"
echo "  - XP and level system"
echo "  - 23 new achievements"
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ Error: DATABASE_URL not set in .env${NC}"
    exit 1
fi

# Run migration 029
echo -e "${YELLOW}Running migration 029: Game system enhancements...${NC}"
psql "$DATABASE_URL" -f src/db/migrations/029_enhance_game_system.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Migration 029 completed successfully${NC}"
else
    echo -e "${RED}❌ Migration 029 failed${NC}"
    exit 1
fi

echo ""

# Run migration 030
echo -e "${YELLOW}Running migration 030: Gamification enhancements...${NC}"
psql "$DATABASE_URL" -f src/db/migrations/030_gamification_enhancements.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Migration 030 completed successfully${NC}"
else
    echo -e "${RED}❌ Migration 030 failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo ""
echo "New features available:"
echo "  ✅ Location-based game search"
echo "  ✅ Smart matching algorithm"
echo "  ✅ Real-time notifications (Socket.IO)"
echo "  ✅ Game chat"
echo "  ✅ Waitlist system"
echo "  ✅ Private games with invitation links"
echo "  ✅ Game editing"
echo "  ✅ Recurring games (automated)"
echo "  ✅ Email reminders (automated)"
echo "  ✅ Game completion workflow"
echo "  ✅ PGN upload"
echo "  ✅ Post-game reviews"
echo "  ✅ Leaderboards (6 types)"
echo "  ✅ Game history"
echo ""
echo -e "${BLUE}📝 Next Steps:${NC}"
echo "1. Restart your backend server"
echo "2. Update frontend routes (see DEPLOYMENT.md)"
echo "3. Test the new features"
echo ""
echo -e "${YELLOW}⚠️  Note: Cron jobs will run automatically:${NC}"
echo "  - Every hour: Process scheduled notifications"
echo "  - Daily at 1 AM: Create recurring games"
echo "  - Every 6 hours: Schedule game reminders"
echo "  - Daily at 2 AM: Clean up old waitlist entries"
echo ""
