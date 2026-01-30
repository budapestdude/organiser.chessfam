export interface CreateBookingRequest {
  master_id: number;
  session_type: string;
  booking_date: string;
  booking_time: string;
  time_control: string;
  number_of_games: number;
  location_type: string;
  price_per_game: number;
  total_price: number;
  notes?: string;
}

export interface Booking {
  id: number;
  user_id: number;
  master_id: number;
  session_type: string;
  booking_date: string;
  booking_time: string;
  time_control: string;
  number_of_games: number;
  location_type: string;
  price_per_game: number;
  total_price: number;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface BookingWithMaster extends Booking {
  master_name: string;
  master_title: string;
  master_image?: string;
}
