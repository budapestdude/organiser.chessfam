export interface Game {
  id: number;
  creator_id: number;
  venue_name: string;
  venue_address?: string;
  venue_lat?: number;
  venue_lng?: number;
  game_date: string; // ISO date string
  game_time: string; // HH:MM:SS format
  duration_minutes: number;
  time_control?: string;
  player_level?: string;
  max_players: number;
  description?: string;
  status: 'open' | 'full' | 'cancelled' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface GameParticipant {
  id: number;
  game_id: number;
  user_id: number;
  joined_at: string;
  status: 'confirmed' | 'cancelled' | 'no-show';
}

export interface GameWithDetails extends Game {
  creator_name: string;
  creator_rating: number;
  participant_count: number;
  participants?: Array<{
    id: number;
    name: string;
    rating: number;
    avatar?: string;
  }>;
}

export interface CreateGameRequest {
  venue_name: string;
  venue_address?: string;
  venue_lat?: number;
  venue_lng?: number;
  game_date: string;
  game_time: string;
  duration_minutes?: number;
  time_control?: string;
  player_level?: string;
  max_players?: number;
  description?: string;
}

export interface JoinGameRequest {
  game_id: number;
}
