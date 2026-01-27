import type { PairingPlayer, TestScenario, Color } from '../../types/pairings';

/**
 * Generate a random rating within a range
 */
function generateRating(min: number = 1200, max: number = 2400): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate a player name
 */
function generatePlayerName(id: number): string {
  const firstNames = ['Alex', 'Jordan', 'Sam', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Avery', 'Quinn', 'Sage'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];

  return `${firstNames[id % firstNames.length]} ${lastNames[Math.floor(id / firstNames.length) % lastNames.length]}`;
}

/**
 * Generate mock players
 */
export function generatePlayers(
  count: number,
  options: {
    minRating?: number;
    maxRating?: number;
    scoreDistribution?: 'equal' | 'random' | 'topHeavy';
    withHistory?: boolean;
    roundsPlayed?: number;
  } = {}
): PairingPlayer[] {
  const {
    minRating = 1200,
    maxRating = 2400,
    scoreDistribution = 'equal',
    withHistory = false,
    roundsPlayed = 0,
  } = options;

  const players: PairingPlayer[] = [];

  for (let i = 0; i < count; i++) {
    const rating = generateRating(minRating, maxRating);

    let score = 0;
    if (scoreDistribution === 'equal') {
      score = roundsPlayed;
    } else if (scoreDistribution === 'random') {
      // Random score between 0 and roundsPlayed
      score = Math.random() * roundsPlayed;
    } else if (scoreDistribution === 'topHeavy') {
      // Higher rated players tend to have better scores
      const ratingFactor = (rating - minRating) / (maxRating - minRating);
      score = roundsPlayed * (0.3 + ratingFactor * 0.7) + (Math.random() - 0.5);
    }
    score = Math.max(0, Math.min(roundsPlayed, Math.round(score * 2) / 2)); // Round to 0.5

    const colorHistory: Color[] = [];
    const opponentIds: number[] = [];

    if (withHistory && roundsPlayed > 0) {
      // Generate random color history
      for (let round = 0; round < roundsPlayed; round++) {
        colorHistory.push(Math.random() > 0.5 ? 'white' : 'black');
      }

      // Generate random opponent IDs (simplified - doesn't check for validity)
      for (let round = 0; round < roundsPlayed; round++) {
        let opponentId;
        do {
          opponentId = Math.floor(Math.random() * count) + 1;
        } while (opponentId === i + 1 || opponentIds.includes(opponentId));
        opponentIds.push(opponentId);
      }
    }

    players.push({
      id: i + 1,
      name: generatePlayerName(i),
      rating,
      score,
      colorHistory,
      opponentIds,
      hasBye: false,
      isWithdrawn: false,
    });
  }

  // Sort by rating (higher first)
  return players.sort((a, b) => b.rating - a.rating);
}

/**
 * Create a simple test scenario
 */
export function createSimpleScenario(playerCount: number = 8): TestScenario {
  return {
    name: `Simple ${playerCount}-player tournament`,
    description: `Basic scenario with ${playerCount} players, no history`,
    players: generatePlayers(playerCount),
    config: {
      system: 'swiss',
      allowRepeats: false,
      maxColorStreak: 2,
      scoreGroups: true,
      acceleratedPairings: false,
    },
    expectedOutcome: {
      shouldSucceed: true,
      minPairings: Math.floor(playerCount / 2),
      maxUnpaired: playerCount % 2,
    },
  };
}

/**
 * Create odd-player scenario (requires bye)
 */
export function createOddPlayerScenario(): TestScenario {
  return {
    name: 'Odd player scenario',
    description: 'Tournament with 9 players requiring bye assignment',
    players: generatePlayers(9),
    config: {
      system: 'swiss',
      allowRepeats: false,
      maxColorStreak: 2,
      scoreGroups: true,
      acceleratedPairings: false,
    },
    expectedOutcome: {
      shouldSucceed: true,
      minPairings: 4,
      maxUnpaired: 1,
    },
  };
}

/**
 * Create color imbalance scenario
 */
export function createColorImbalanceScenario(): TestScenario {
  const players = generatePlayers(8, { withHistory: true, roundsPlayed: 2 });

  // Force color imbalances
  players.forEach(player => {
    player.colorHistory = ['white', 'white']; // Everyone played white twice
  });

  return {
    name: 'Color imbalance scenario',
    description: 'All players have played white twice - algorithm must balance colors',
    players,
    config: {
      system: 'swiss',
      allowRepeats: false,
      maxColorStreak: 2,
      scoreGroups: true,
      acceleratedPairings: false,
    },
    expectedOutcome: {
      shouldSucceed: true,
      minPairings: 4,
      maxUnpaired: 0,
    },
  };
}

/**
 * Create repeat pairing scenario
 */
export function createRepeatPairingScenario(): TestScenario {
  const players = generatePlayers(4, {
    withHistory: true,
    roundsPlayed: 2,
    scoreDistribution: 'equal'
  });

  // Force situation where everyone has played each other
  players[0].opponentIds = [2, 3];
  players[1].opponentIds = [1, 4];
  players[2].opponentIds = [1, 4];
  players[3].opponentIds = [2, 3];

  return {
    name: 'Repeat pairing scenario',
    description: 'Small tournament where repeat pairings are necessary in round 3',
    players,
    config: {
      system: 'swiss',
      allowRepeats: false,
      maxColorStreak: 2,
      scoreGroups: false, // Must allow cross-score pairing
      acceleratedPairings: false,
    },
    expectedOutcome: {
      shouldSucceed: true, // Should succeed with repeat allowed
      minPairings: 2,
      maxUnpaired: 0,
    },
  };
}

/**
 * Create large tournament scenario
 */
export function createLargeTournamentScenario(): TestScenario {
  return {
    name: 'Large tournament (100 players)',
    description: 'Large-scale tournament to test performance and complex pairings',
    players: generatePlayers(100, {
      minRating: 1000,
      maxRating: 2800,
      withHistory: true,
      roundsPlayed: 3,
      scoreDistribution: 'topHeavy',
    }),
    config: {
      system: 'swiss',
      allowRepeats: false,
      maxColorStreak: 2,
      scoreGroups: true,
      acceleratedPairings: true,
    },
    expectedOutcome: {
      shouldSucceed: true,
      minPairings: 50,
      maxUnpaired: 0,
    },
  };
}

/**
 * Create rating difference scenario
 */
export function createRatingDifferenceScenario(): TestScenario {
  const players = generatePlayers(8, {
    minRating: 1200,
    maxRating: 2400,
  });

  // Create extreme rating differences
  players[0].rating = 2400;
  players[1].rating = 2350;
  players[2].rating = 2300;
  players[3].rating = 2250;
  players[4].rating = 1400;
  players[5].rating = 1350;
  players[6].rating = 1300;
  players[7].rating = 1250;

  return {
    name: 'Rating difference limits',
    description: 'Test maximum rating difference constraints',
    players,
    config: {
      system: 'swiss',
      allowRepeats: false,
      maxColorStreak: 2,
      scoreGroups: true,
      ratingDifferenceLimit: 400, // Max 400 point difference
      acceleratedPairings: false,
    },
    expectedOutcome: {
      shouldSucceed: true,
      minPairings: 4,
      maxUnpaired: 0,
    },
  };
}

/**
 * Create mid-tournament scenario (various scores)
 */
export function createMidTournamentScenario(): TestScenario {
  const players = generatePlayers(16, {
    minRating: 1400,
    maxRating: 2200,
    withHistory: true,
    roundsPlayed: 3,
    scoreDistribution: 'topHeavy',
  });

  return {
    name: 'Mid-tournament round 4',
    description: 'Tournament at round 4 with varied scores and histories',
    players,
    config: {
      system: 'swiss',
      allowRepeats: false,
      maxColorStreak: 2,
      scoreGroups: true,
      acceleratedPairings: false,
    },
    expectedOutcome: {
      shouldSucceed: true,
      minPairings: 8,
      maxUnpaired: 0,
    },
  };
}

/**
 * Get all predefined test scenarios
 */
export function getAllTestScenarios(): TestScenario[] {
  return [
    createSimpleScenario(8),
    createSimpleScenario(16),
    createOddPlayerScenario(),
    createColorImbalanceScenario(),
    createRepeatPairingScenario(),
    createRatingDifferenceScenario(),
    createMidTournamentScenario(),
    createLargeTournamentScenario(),
  ];
}
