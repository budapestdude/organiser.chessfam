import type { PairingPlayer, Pairing, PairingRound, PairingConfig } from '../../types/pairings';

/**
 * Swiss System Pairing Algorithm
 * Implements FIDE Swiss pairing rules with configurable options
 */

interface ScoreGroup {
  score: number;
  players: PairingPlayer[];
}

interface ColorPreference {
  playerId: number;
  preference: 'white' | 'black' | 'none';
  strength: number; // 0-3: 0=none, 1=mild, 2=strong, 3=absolute
}

/**
 * Main Swiss pairing function
 */
export function generateSwissPairings(
  players: PairingPlayer[],
  currentRound: number,
  config: PairingConfig
): PairingRound {
  const errors: string[] = [];
  const pairings: Pairing[] = [];
  const unpaired: number[] = [];

  // Filter out withdrawn players
  const activePlayers = players.filter(p => !p.isWithdrawn);

  if (activePlayers.length === 0) {
    return {
      roundNumber: currentRound,
      pairings: [],
      unpaired: [],
      errors: ['No active players to pair'],
    };
  }

  // Group players by score
  const scoreGroups = groupPlayersByScore(activePlayers);

  // Track paired player IDs
  const pairedIds = new Set<number>();

  // Process each score group from highest to lowest
  for (let i = 0; i < scoreGroups.length; i++) {
    const group = scoreGroups[i];

    // Filter out already paired players
    const availablePlayers = group.players.filter(p => !pairedIds.has(p.id));

    if (availablePlayers.length === 0) continue;

    // If odd number, try to float down one player
    if (availablePlayers.length % 2 === 1) {
      // Try to pair within group first
      const groupPairings = pairScoreGroup(
        availablePlayers,
        config,
        pairings.length + 1
      );

      if (groupPairings.unpaired.length === 1) {
        // Float down the unpaired player to next group
        const floater = availablePlayers.find(p => p.id === groupPairings.unpaired[0]);
        if (floater && i < scoreGroups.length - 1) {
          scoreGroups[i + 1].players.push(floater);
        } else if (floater) {
          // Last group - assign bye
          const byePairing = assignBye(floater, pairings.length + 1);
          pairings.push(byePairing);
          pairedIds.add(floater.id);
        }

        // Add the successful pairings
        groupPairings.pairings.forEach(p => {
          pairings.push(p);
          pairedIds.add(p.whitePlayerId);
          pairedIds.add(p.blackPlayerId);
        });
      } else {
        // All paired successfully
        groupPairings.pairings.forEach(p => {
          pairings.push(p);
          pairedIds.add(p.whitePlayerId);
          pairedIds.add(p.blackPlayerId);
        });
      }
    } else {
      // Even number - pair normally
      const groupPairings = pairScoreGroup(
        availablePlayers,
        config,
        pairings.length + 1
      );

      groupPairings.pairings.forEach(p => {
        pairings.push(p);
        pairedIds.add(p.whitePlayerId);
        pairedIds.add(p.blackPlayerId);
      });

      groupPairings.unpaired.forEach(id => {
        if (i < scoreGroups.length - 1) {
          const player = availablePlayers.find(p => p.id === id);
          if (player) scoreGroups[i + 1].players.push(player);
        }
      });
    }
  }

  // Collect any remaining unpaired players
  activePlayers.forEach(player => {
    if (!pairedIds.has(player.id)) {
      unpaired.push(player.id);
      errors.push(`Could not pair player ${player.name} (ID: ${player.id})`);
    }
  });

  return {
    roundNumber: currentRound,
    pairings,
    unpaired,
    errors,
  };
}

/**
 * Group players by their current score
 */
function groupPlayersByScore(players: PairingPlayer[]): ScoreGroup[] {
  const groups = new Map<number, PairingPlayer[]>();

  players.forEach(player => {
    if (!groups.has(player.score)) {
      groups.set(player.score, []);
    }
    groups.get(player.score)!.push(player);
  });

  // Sort groups by score (highest first)
  const sortedGroups = Array.from(groups.entries())
    .sort(([a], [b]) => b - a)
    .map(([score, players]) => ({
      score,
      players: sortPlayersByRating(players),
    }));

  return sortedGroups;
}

/**
 * Sort players by rating (highest first)
 */
function sortPlayersByRating(players: PairingPlayer[]): PairingPlayer[] {
  return [...players].sort((a, b) => b.rating - a.rating);
}

/**
 * Pair a score group using the Dutch system
 */
function pairScoreGroup(
  players: PairingPlayer[],
  config: PairingConfig,
  startingBoardNumber: number
): { pairings: Pairing[]; unpaired: number[] } {
  const pairings: Pairing[] = [];
  const paired = new Set<number>();

  // Sort by rating
  const sortedPlayers = sortPlayersByRating(players);

  // Calculate color preferences
  const colorPrefs = sortedPlayers.map(p => calculateColorPreference(p, config));

  // Split into two halves (S1 and S2)
  const midpoint = Math.floor(sortedPlayers.length / 2);
  const s1 = sortedPlayers.slice(0, midpoint);
  const s2 = sortedPlayers.slice(midpoint);

  // Try to pair S1 with S2
  for (let i = 0; i < s1.length; i++) {
    const p1 = s1[i];
    if (paired.has(p1.id)) continue;

    // Find best opponent from S2
    let bestOpponent: PairingPlayer | null = null;
    let bestScore = -Infinity;

    for (const p2 of s2) {
      if (paired.has(p2.id)) continue;

      // Check if pairing is valid
      if (!isValidPairing(p1, p2, config)) continue;

      // Score this pairing
      const score = scorePairing(p1, p2, colorPrefs);
      if (score > bestScore) {
        bestScore = score;
        bestOpponent = p2;
      }
    }

    if (bestOpponent) {
      // Determine colors
      const { whitePlayer, blackPlayer } = assignColors(
        p1,
        bestOpponent,
        colorPrefs
      );

      pairings.push({
        whitePlayerId: whitePlayer.id,
        blackPlayerId: blackPlayer.id,
        boardNumber: startingBoardNumber + pairings.length,
      });

      paired.add(p1.id);
      paired.add(bestOpponent.id);
    }
  }

  // Collect unpaired
  const unpaired = sortedPlayers
    .filter(p => !paired.has(p.id))
    .map(p => p.id);

  return { pairings, unpaired };
}

/**
 * Check if two players can be paired
 */
function isValidPairing(
  p1: PairingPlayer,
  p2: PairingPlayer,
  config: PairingConfig
): boolean {
  // Can't pair with self
  if (p1.id === p2.id) return false;

  // Check if they've already played (if repeats not allowed)
  if (!config.allowRepeats && p1.opponentIds.includes(p2.id)) {
    return false;
  }

  // Check rating difference limit
  if (config.ratingDifferenceLimit) {
    const diff = Math.abs(p1.rating - p2.rating);
    if (diff > config.ratingDifferenceLimit) {
      return false;
    }
  }

  return true;
}

/**
 * Score a potential pairing (higher is better)
 */
function scorePairing(
  p1: PairingPlayer,
  p2: PairingPlayer,
  colorPrefs: ColorPreference[]
): number {
  let score = 0;

  // Prefer closer ratings
  const ratingDiff = Math.abs(p1.rating - p2.rating);
  score -= ratingDiff * 0.1;

  // Reward complementary color preferences
  const pref1 = colorPrefs.find(c => c.playerId === p1.id);
  const pref2 = colorPrefs.find(c => c.playerId === p2.id);

  if (pref1 && pref2) {
    if (pref1.preference === 'white' && pref2.preference === 'black') {
      score += 100 * (pref1.strength + pref2.strength);
    } else if (pref1.preference === 'black' && pref2.preference === 'white') {
      score += 100 * (pref1.strength + pref2.strength);
    } else if (pref1.preference !== pref2.preference) {
      score += 50;
    }
  }

  return score;
}

/**
 * Calculate color preference for a player
 */
function calculateColorPreference(
  player: PairingPlayer,
  config: PairingConfig
): ColorPreference {
  const history = player.colorHistory;

  if (history.length === 0) {
    return { playerId: player.id, preference: 'none', strength: 0 };
  }

  // Count colors
  const whiteCount = history.filter(c => c === 'white').length;
  const blackCount = history.filter(c => c === 'black').length;
  const difference = whiteCount - blackCount;

  // Check for streak
  let currentStreak = 1;
  const lastColor = history[history.length - 1];
  for (let i = history.length - 2; i >= 0; i--) {
    if (history[i] === lastColor) {
      currentStreak++;
    } else {
      break;
    }
  }

  // Absolute preference if at max streak
  if (currentStreak >= config.maxColorStreak) {
    const oppositeColor = lastColor === 'white' ? 'black' : 'white';
    return { playerId: player.id, preference: oppositeColor, strength: 3 };
  }

  // Strong preference if imbalanced
  if (Math.abs(difference) >= 2) {
    const preferredColor = difference > 0 ? 'black' : 'white';
    return { playerId: player.id, preference: preferredColor, strength: 2 };
  }

  // Mild preference if slightly imbalanced
  if (difference !== 0) {
    const preferredColor = difference > 0 ? 'black' : 'white';
    return { playerId: player.id, preference: preferredColor, strength: 1 };
  }

  return { playerId: player.id, preference: 'none', strength: 0 };
}

/**
 * Assign colors to two paired players
 */
function assignColors(
  p1: PairingPlayer,
  p2: PairingPlayer,
  colorPrefs: ColorPreference[]
): { whitePlayer: PairingPlayer; blackPlayer: PairingPlayer } {
  const pref1 = colorPrefs.find(c => c.playerId === p1.id);
  const pref2 = colorPrefs.find(c => c.playerId === p2.id);

  // If preferences are opposite, honor them
  if (pref1?.preference === 'white' && pref2?.preference === 'black') {
    return { whitePlayer: p1, blackPlayer: p2 };
  }
  if (pref1?.preference === 'black' && pref2?.preference === 'white') {
    return { whitePlayer: p2, blackPlayer: p1 };
  }

  // If one has strong preference, honor it
  if (pref1 && pref1.strength >= 2) {
    if (pref1.preference === 'white') {
      return { whitePlayer: p1, blackPlayer: p2 };
    } else {
      return { whitePlayer: p2, blackPlayer: p1 };
    }
  }
  if (pref2 && pref2.strength >= 2) {
    if (pref2.preference === 'white') {
      return { whitePlayer: p2, blackPlayer: p1 };
    } else {
      return { whitePlayer: p1, blackPlayer: p2 };
    }
  }

  // Default: higher rated player gets white
  if (p1.rating > p2.rating) {
    return { whitePlayer: p1, blackPlayer: p2 };
  } else {
    return { whitePlayer: p2, blackPlayer: p1 };
  }
}

/**
 * Assign a bye to a player
 */
function assignBye(player: PairingPlayer, boardNumber: number): Pairing {
  return {
    whitePlayerId: player.id,
    blackPlayerId: -1, // -1 indicates bye
    boardNumber,
    isBye: true,
  };
}

