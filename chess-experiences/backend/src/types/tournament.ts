export interface CreateTournamentRegistrationRequest {
  tournament_id: number;
  player_name: string;
  player_rating?: number;
  player_email: string;
  player_phone?: string;
  entry_fee: number;
  notes?: string;
}

export interface TournamentRegistration {
  id: number;
  user_id: number;
  tournament_id: number;
  player_name: string;
  player_rating: number | null;
  player_email: string;
  player_phone: string | null;
  entry_fee: number;
  status: string;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface TournamentRegistrationWithDetails extends TournamentRegistration {
  tournament_name?: string;
  tournament_date?: string;
  tournament_location?: string;
}
