import apiClient from './client';

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

export const bookingsApi = {
  createBooking: async (data: CreateBookingRequest) => {
    const response = await apiClient.post('/bookings', data);
    return response.data;
  },

  getUserBookings: async () => {
    const response = await apiClient.get('/bookings/user');
    return response.data;
  },

  getBookingById: async (id: number) => {
    const response = await apiClient.get(`/bookings/${id}`);
    return response.data;
  }
};
