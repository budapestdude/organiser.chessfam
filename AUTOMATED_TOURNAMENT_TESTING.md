# Automated Tournament Testing System

## Overview
Complete end-to-end testing system for the Swiss pairing engine that creates mock tournaments and runs them from start to finish with automated result input.

## Features

### Backend API (`/api/v1/pairings-test`)

#### Endpoints:
- `POST /api/v1/pairings-test/create` - Create test tournament with mock participants
- `POST /api/v1/pairings-test/:tournamentId/run-all` - Run entire tournament (all rounds with random results)
- `POST /api/v1/pairings-test/:tournamentId/run-round` - Run single round with random results
- `DELETE /api/v1/pairings-test/:tournamentId` - Delete test tournament

#### Mock Data Generation:
- Random chess player names (from a pool of famous players)
- Random ratings (1600-2800 range)
- Realistic result distribution (40% white wins, 35% draws, 25% black wins)

### Frontend Interface (`/tournament-automated-test`)

#### Configuration Options:
- **Number of Players**: 8, 12, 16, 24, 32, or 64
- **Number of Rounds**: 3, 5, 7, 9, or 11
- **Pairing System**: Dutch or Burstein
- **Tournament Name**: Custom naming

#### Controls:
- **Run All Rounds** - Executes entire tournament instantly with all rounds and results
- **Run Next Round** - Executes one round at a time (step-through mode)
- **Delete Tournament** - Cleans up test data

#### Real-time Display:
- Tournament information and progress bar
- Live standings table with medals for top 3
- Round-by-round results summary
- Final winner announcement
- Win-Draw-Loss statistics

## Usage

### Quick Test (Full Auto):
1. Navigate to `/tournament-automated-test`
2. Configure tournament settings (players, rounds, system)
3. Click "Create Test Tournament"
4. Click "Run All Rounds"
5. View complete results and standings instantly

### Step-by-Step Test:
1. Navigate to `/tournament-automated-test`
2. Configure tournament settings
3. Click "Create Test Tournament"
4. Click "Run Next Round" to execute one round at a time
5. Review pairings and standings after each round
6. Continue until tournament completion

### Detailed Pairing View:
After creating/running a test tournament, navigate to:
`/tournaments/:id/pairings` to view detailed board-by-board pairings

## Technical Implementation

### Backend Services:
- **pairingsTestController.ts** - Test tournament creation and automation
- **pairingsTest.ts** - Express routes for test endpoints
- Uses actual bbpPairings engine (not mocked)
- Stores real data in database (can be deleted)

### Frontend Components:
- **TournamentAutomatedTest.tsx** - Main testing interface
- **pairingsTest.ts** - API client for test endpoints
- Real-time progress tracking
- Responsive design with glass-card styling

### Database:
- Creates real tournament records
- Creates real participant registrations
- Creates real game pairings in tournament_games table
- All test data can be cleaned up via delete endpoint

## Testing Scenarios

### Recommended Tests:
1. **Small tournament** (8 players, 3 rounds) - Quick validation
2. **Medium tournament** (16 players, 5 rounds) - Standard use case
3. **Large tournament** (32+ players, 7+ rounds) - Stress testing
4. **Dutch vs Burstein** - Compare pairing systems

### What to Validate:
- ✅ All players get paired each round
- ✅ No duplicate pairings (unless unavoidable)
- ✅ Score groups respected
- ✅ Color balance (alternating colors)
- ✅ Standings calculate correctly
- ✅ Round generation works consistently
- ✅ Results update standings properly

## Files Modified/Created

### Backend:
- `backend/src/controllers/pairingsTestController.ts` ✨ NEW
- `backend/src/routes/pairingsTest.ts` ✨ NEW
- `backend/src/server.ts` (added test routes)

### Frontend:
- `src/pages/tournaments/TournamentAutomatedTest.tsx` ✨ NEW
- `src/api/pairingsTest.ts` ✨ NEW
- `src/App.tsx` (added route)

## Next Steps

After running automated tests:
1. Review standings to verify scoring accuracy
2. Check tournament pairings page for detailed board view
3. Validate color distribution across rounds
4. Test edge cases (odd number of players, etc.)
5. Compare Dutch vs Burstein results

## Cleanup

Test tournaments are stored in the database. To clean up:
- Use the "Delete Tournament" button in the UI
- OR manually delete from tournaments table using tournament ID
