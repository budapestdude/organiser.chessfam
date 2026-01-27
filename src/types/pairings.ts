// Color in chess
export type Color = 'white' | 'black';

// Player for pairing purposes
export interface PairingPlayer {
  id: number;
  name: string;
  rating: number;
  score: number; // Tournament score (1 for win, 0.5 for draw, 0 for loss)
  colorHistory: Color[]; // Colors played in previous rounds
  opponentIds: number[]; // IDs of opponents faced
  hasBye: boolean; // Whether player has received a bye
  isWithdrawn: boolean; // Whether player has withdrawn
}

// A single pairing between two players
export interface Pairing {
  whitePlayerId: number;
  blackPlayerId: number;
  boardNumber: number; // Board assignment (1 = top board)
  isBye?: boolean; // True if this is a bye round for a player
}

// Result of a pairing round
export interface PairingRound {
  roundNumber: number;
  pairings: Pairing[];
  unpaired: number[]; // Players who couldn't be paired
  errors: string[]; // Any errors or warnings
}

// Pairing configuration
export interface PairingConfig {
  system: 'swiss' | 'roundRobin';
  allowRepeats: boolean; // Allow repeat pairings (emergency)
  maxColorStreak: number; // Max same color in a row (typically 2-3)
  scoreGroups: boolean; // Strictly enforce score groups
  ratingDifferenceLimit?: number; // Max rating diff for pairing (optional)
  acceleratedPairings: boolean; // Use accelerated pairing for early rounds
}

// Validation result
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    totalPairings: number;
    byeCount: number;
    repeatPairings: number;
    colorImbalances: number;
    ratingDifferenceAvg: number;
    ratingDifferenceMax: number;
  };
}

// Test scenario for testing pairings
export interface TestScenario {
  name: string;
  description: string;
  players: PairingPlayer[];
  config: PairingConfig;
  expectedOutcome?: {
    shouldSucceed: boolean;
    minPairings?: number;
    maxUnpaired?: number;
  };
}

// Tournament state for pairing
export interface TournamentState {
  players: PairingPlayer[];
  currentRound: number;
  totalRounds: number;
  config: PairingConfig;
}
