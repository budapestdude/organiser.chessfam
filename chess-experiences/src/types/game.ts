export interface Game {
  id: number;
  creator_id: number;
  venue_name: string;
  venue_address?: string;
  venue_lat?: number;
  venue_lng?: number;
  game_date: string;
  game_time: string;
  duration_minutes: number;
  time_control?: string;
  player_level?: string;
  max_players: number;
  description?: string;
  status: 'open' | 'full' | 'cancelled' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface GameWithDetails extends Game {
  creator_name: string;
  creator_rating: number;
  creator_avatar?: string;
  participant_count: number;
  participants?: Array<{
    id: number;
    name: string;
    rating: number;
    avatar?: string;
    joined_at: string;
    status: string;
  }>;
}

export interface CreateGameData {
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

export interface GameFilters {
  status?: 'open' | 'full' | 'cancelled' | 'completed';
  date_from?: string;
  date_to?: string;
  venue?: string;
  player_level?: string;
}
