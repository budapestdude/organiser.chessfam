import apiClient from './client';

export interface CheckoutResponse {
  sessionId: string;
  url: string;
  paymentId: number;
}

export interface PaymentStatusResponse {
  status: 'paid' | 'unpaid' | 'no_payment_required' | null;
  payment: {
    id: number;
    amount: number;
    currency: string;
    status: string;
    payment_type: string;
    created_at: string;
    completed_at: string | null;
  } | null;
}

export interface PaymentHistoryItem {
  id: number;
  amount: number;
  currency: string;
  status: string;
  payment_type: string;
  description: string;
  created_at: string;
  completed_at: string | null;
  booking_date?: string;
  booking_time?: string;
  tournament_name?: string;
  tournament_date?: string;
}

export const paymentsApi = {
  // Create checkout session for master booking
  createBookingCheckout: async (bookingId: number): Promise<CheckoutResponse> => {
    const response = await apiClient.post('/payments/master-booking', { bookingId });
    return response.data;
  },

  // Create checkout session for tournament entry
  createTournamentCheckout: async (tournamentId: number): Promise<CheckoutResponse> => {
    const response = await apiClient.post('/payments/tournament-entry', { tournamentId });
    return response.data;
  },

  // Get payment status by Stripe session ID
  getPaymentStatus: async (sessionId: string): Promise<PaymentStatusResponse> => {
    const response = await apiClient.get(`/payments/status/${sessionId}`);
    return response.data;
  },

  // Get user's payment history
  getPaymentHistory: async (page = 1, limit = 20): Promise<{ payments: PaymentHistoryItem[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> => {
    const response = await apiClient.get('/payments/history', { params: { page, limit } });
    return response.data;
  },
};
