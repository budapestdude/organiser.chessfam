import apiClient from './client';
import type { DashboardData } from '../types';

interface FinancialData {
  summary: {
    total_revenue: number;
    total_refunds: number;
    net_revenue: number;
  };
  by_month: Array<{
    month: string;
    revenue: number;
    refunds: number;
    net: number;
  }>;
  by_event: Array<{
    event_id: number;
    event_name: string;
    type: 'tournament' | 'club';
    revenue: number;
    refunds: number;
    participants: number;
  }>;
  transactions: Array<{
    id: number;
    date: string;
    type: 'payment' | 'refund';
    amount: number;
    event_name: string;
    participant_name: string;
    status: string;
  }>;
}

export const organizerAPI = {
  async getDashboard(): Promise<DashboardData> {
    const response = await apiClient.get('/organizer/dashboard');
    return response.data;
  },

  async getFinancials(from: string, to: string): Promise<FinancialData> {
    const response = await apiClient.get('/organizer/financials', {
      params: { from, to }
    });
    return response.data;
  },
};
