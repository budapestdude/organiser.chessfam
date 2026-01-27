import type {
  PairingPlayer,
  PairingRound,
  PairingConfig,
  ValidationResult,
} from '../../types/pairings';

/**
 * Pairing Validation System
 * Validates Swiss pairings against FIDE rules and configuration
 */

export function validatePairings(
  round: PairingRound,
  players: PairingPlayer[],
  config: PairingConfig
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Create player lookup
  const playerMap = new Map(players.map(p => [p.id, p]));

  // Track stats
  const stats = {
    totalPairings: round.pairings.length,
    byeCount: 0,
    repeatPairings: 0,
    colorImbalances: 0,
    ratingDifferenceAvg: 0,
    ratingDifferenceMax: 0,
  };

  let totalRatingDiff = 0;

  // Validate each pairing
  for (const pairing of round.pairings) {
    // Handle bye
    if (pairing.isBye) {
      stats.byeCount++;
      const player = playerMap.get(pairing.whitePlayerId);

      if (!player) {
        errors.push(`Bye assigned to unknown player ID ${pairing.whitePlayerId}`);
        continue;
      }

      if (player.hasBye) {
        errors.push(`Player ${player.name} already received a bye`);
      }

      continue;
    }

    // Get both players
    const whitePlayer = playerMap.get(pairing.whitePlayerId);
    const blackPlayer = playerMap.get(pairing.blackPlayerId);

    if (!whitePlayer) {
      errors.push(`Unknown white player ID ${pairing.whitePlayerId}`);
      continue;
    }
    if (!blackPlayer) {
      errors.push(`Unknown black player ID ${pairing.blackPlayerId}`);
      continue;
    }

    // Check if players are withdrawn
    if (whitePlayer.isWithdrawn) {
      errors.push(`Withdrawn player ${whitePlayer.name} is paired`);
    }
    if (blackPlayer.isWithdrawn) {
      errors.push(`Withdrawn player ${blackPlayer.name} is paired`);
    }

    // Check for repeat pairings
    if (whitePlayer.opponentIds.includes(blackPlayer.id)) {
      if (config.allowRepeats) {
        warnings.push(
          `Repeat pairing: ${whitePlayer.name} vs ${blackPlayer.name} (allowed by config)`
        );
      } else {
        errors.push(`Forbidden repeat pairing: ${whitePlayer.name} vs ${blackPlayer.name}`);
      }
      stats.repeatPairings++;
    }

    // Check rating difference
    const ratingDiff = Math.abs(whitePlayer.rating - blackPlayer.rating);
    totalRatingDiff += ratingDiff;
    stats.ratingDifferenceMax = Math.max(stats.ratingDifferenceMax, ratingDiff);

    if (config.ratingDifferenceLimit && ratingDiff > config.ratingDifferenceLimit) {
      errors.push(
        `Rating difference exceeds limit: ${whitePlayer.name} (${whitePlayer.rating}) vs ${blackPlayer.name} (${blackPlayer.rating}) - diff: ${ratingDiff}`
      );
    }

    // Check score groups
    if (config.scoreGroups) {
      const scoreDiff = Math.abs(whitePlayer.score - blackPlayer.score);
      if (scoreDiff > 1) {
        warnings.push(
          `Players from distant score groups: ${whitePlayer.name} (${whitePlayer.score}) vs ${blackPlayer.name} (${blackPlayer.score})`
        );
      }
    }

    // Check color allocations
    const whiteColorCheck = validateColorAllocation(whitePlayer, 'white', config);
    const blackColorCheck = validateColorAllocation(blackPlayer, 'black', config);

    if (!whiteColorCheck.valid) {
      errors.push(
        `Color violation for ${whitePlayer.name} (white): ${whiteColorCheck.reason}`
      );
      stats.colorImbalances++;
    }
    if (!blackColorCheck.valid) {
      errors.push(
        `Color violation for ${blackPlayer.name} (black): ${blackColorCheck.reason}`
      );
      stats.colorImbalances++;
    }

    // Warnings for color imbalances (not violations)
    if (whiteColorCheck.warning) {
      warnings.push(`${whitePlayer.name} (white): ${whiteColorCheck.warning}`);
    }
    if (blackColorCheck.warning) {
      warnings.push(`${blackPlayer.name} (black): ${blackColorCheck.warning}`);
    }
  }

  // Calculate average rating difference
  stats.ratingDifferenceAvg =
    round.pairings.length > stats.byeCount
      ? totalRatingDiff / (round.pairings.length - stats.byeCount)
      : 0;

  // Check for unpaired players
  if (round.unpaired.length > 0) {
    const maxExpectedUnpaired = players.filter(p => !p.isWithdrawn).length % 2;
    if (round.unpaired.length > maxExpectedUnpaired) {
      errors.push(
        `Too many unpaired players: ${round.unpaired.length} (expected max ${maxExpectedUnpaired})`
      );
    }

    round.unpaired.forEach(id => {
      const player = playerMap.get(id);
      if (player) {
        warnings.push(`Unpaired player: ${player.name}`);
      }
    });
  }

  // Check for duplicate pairings in round
  const pairedPlayers = new Set<number>();
  for (const pairing of round.pairings) {
    if (!pairing.isBye) {
      if (pairedPlayers.has(pairing.whitePlayerId)) {
        errors.push(`Player ${pairing.whitePlayerId} paired multiple times`);
      }
      if (pairedPlayers.has(pairing.blackPlayerId)) {
        errors.push(`Player ${pairing.blackPlayerId} paired multiple times`);
      }
      pairedPlayers.add(pairing.whitePlayerId);
      pairedPlayers.add(pairing.blackPlayerId);
    } else {
      if (pairedPlayers.has(pairing.whitePlayerId)) {
        errors.push(`Player ${pairing.whitePlayerId} has both bye and regular pairing`);
      }
      pairedPlayers.add(pairing.whitePlayerId);
    }
  }

  // Check board numbers are sequential
  const boardNumbers = round.pairings.map(p => p.boardNumber).sort((a, b) => a - b);
  for (let i = 0; i < boardNumbers.length; i++) {
    if (boardNumbers[i] !== i + 1) {
      warnings.push(`Board numbers not sequential: expected ${i + 1}, got ${boardNumbers[i]}`);
      break;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    stats,
  };
}

/**
 * Validate color allocation for a player
 */
function validateColorAllocation(
  player: PairingPlayer,
  assignedColor: 'white' | 'black',
  config: PairingConfig
): { valid: boolean; reason?: string; warning?: string } {
  const history = player.colorHistory;

  if (history.length === 0) {
    return { valid: true };
  }

  // Check for color streak violation
  let currentStreak = 1;
  const lastColor = history[history.length - 1];

  for (let i = history.length - 2; i >= 0; i--) {
    if (history[i] === lastColor) {
      currentStreak++;
    } else {
      break;
    }
  }

  // If player has max streak of one color, they MUST get opposite color
  if (currentStreak >= config.maxColorStreak && lastColor === assignedColor) {
    return {
      valid: false,
      reason: `Has streak of ${currentStreak} ${lastColor}, max allowed is ${config.maxColorStreak}`,
    };
  }

  // Count total color imbalance
  const whiteCount = history.filter(c => c === 'white').length;
  const blackCount = history.filter(c => c === 'black').length;
  const imbalance = whiteCount - blackCount;

  // Calculate what new imbalance would be
  const newImbalance = assignedColor === 'white' ? imbalance + 1 : imbalance - 1;

  // Warning if imbalance will be significant
  if (Math.abs(newImbalance) >= 2) {
    return {
      valid: true,
      warning: `Color imbalance will be ${newImbalance > 0 ? '+' : ''}${newImbalance} (${
        newImbalance > 0 ? whiteCount + 1 : whiteCount
      }W, ${newImbalance < 0 ? blackCount + 1 : blackCount}B)`,
    };
  }

  return { valid: true };
}

/**
 * Validate accelerated pairings (for first rounds)
 */
export function validateAcceleratedPairings(
  round: PairingRound,
  players: PairingPlayer[],
  config: PairingConfig,
  roundNumber: number
): ValidationResult {
  // First validate normally
  const baseValidation = validatePairings(round, players, config);

  // Additional checks for accelerated pairings
  if (config.acceleratedPairings && roundNumber <= 2) {
    const warnings = [...baseValidation.warnings];

    // In accelerated pairings, top half plays bottom half
    const sortedPlayers = [...players]
      .filter(p => !p.isWithdrawn)
      .sort((a, b) => b.rating - a.rating);

    const midpoint = Math.floor(sortedPlayers.length / 2);
    const topHalf = new Set(sortedPlayers.slice(0, midpoint).map(p => p.id));

    for (const pairing of round.pairings) {
      if (pairing.isBye) continue;

      const whiteInTop = topHalf.has(pairing.whitePlayerId);
      const blackInTop = topHalf.has(pairing.blackPlayerId);

      // Both in same half is not ideal for accelerated
      if (whiteInTop === blackInTop) {
        warnings.push(
          `Accelerated pairing anomaly: both players in ${whiteInTop ? 'top' : 'bottom'} half`
        );
      }
    }

    return {
      ...baseValidation,
      warnings,
    };
  }

  return baseValidation;
}

/**
 * Quick validation check (for UI feedback)
 */
export function quickValidate(round: PairingRound): {
  hasErrors: boolean;
  hasPairings: boolean;
  pairingCount: number;
  unpairedCount: number;
} {
  return {
    hasErrors: round.errors.length > 0,
    hasPairings: round.pairings.length > 0,
    pairingCount: round.pairings.length,
    unpairedCount: round.unpaired.length,
  };
}

/**
 * Compare two pairing rounds for quality
 */
export function comparePairings(
  result1: ValidationResult,
  result2: ValidationResult
): { better: 1 | 2 | 'tie'; reason: string } {
  // Validity is most important
  if (result1.isValid && !result2.isValid) {
    return { better: 1, reason: 'Result 1 is valid, Result 2 has errors' };
  }
  if (!result1.isValid && result2.isValid) {
    return { better: 2, reason: 'Result 2 is valid, Result 1 has errors' };
  }

  // If both invalid or both valid, compare by stats
  let score1 = 0;
  let score2 = 0;

  // Fewer repeat pairings is better
  if (result1.stats.repeatPairings < result2.stats.repeatPairings) score1++;
  if (result2.stats.repeatPairings < result1.stats.repeatPairings) score2++;

  // Fewer color imbalances is better
  if (result1.stats.colorImbalances < result2.stats.colorImbalances) score1++;
  if (result2.stats.colorImbalances < result1.stats.colorImbalances) score2++;

  // Lower average rating difference is better
  if (result1.stats.ratingDifferenceAvg < result2.stats.ratingDifferenceAvg) score1++;
  if (result2.stats.ratingDifferenceAvg < result1.stats.ratingDifferenceAvg) score2++;

  // Fewer warnings is better
  if (result1.warnings.length < result2.warnings.length) score1++;
  if (result2.warnings.length < result1.warnings.length) score2++;

  if (score1 > score2) {
    return { better: 1, reason: `Better quality (score ${score1} vs ${score2})` };
  }
  if (score2 > score1) {
    return { better: 2, reason: `Better quality (score ${score2} vs ${score1})` };
  }

  return { better: 'tie', reason: 'Equal quality' };
}
