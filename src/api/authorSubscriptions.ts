import apiClient from './client';

export interface AuthorPricing {
  authorId: number;
  enabled: boolean;
  monthlyPriceCents: number | null;
  monthlyPremiumDiscountPercent: number;
  annualPriceCents: number | null;
  annualPremiumDiscountPercent: number;
  defaultPreviewPercent: number;
  stripeProductId: string | null;
  stripeMonthlyPriceId: string | null;
  stripeMonthlyPremiumPriceId: string | null;
  stripeAnnualPriceId: string | null;
  stripeAnnualPremiumPriceId: string | null;
}

export interface AuthorSubscription {
  id: number;
  authorId: number;
  subscriberId: number;
  status: string;
  tier: 'monthly' | 'annual';
  amount: number;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  author_name?: string;
}

export interface SubscriberInfo {
  subscriberId: number;
  subscriberName: string;
  subscriberEmail: string;
  tier: 'monthly' | 'annual';
  status: string;
  amount: number;
  startDate: string;
  currentPeriodEnd: string | null;
  isPremiumSubscriber: boolean;
}

export interface RevenueStats {
  totalRevenue: number;
  mrr: number;
  totalSubscribers: number;
  monthlySubscribers: number;
  annualSubscribers: number;
  newSubscribersThisMonth: number;
  canceledSubscribersThisMonth: number;
  churnRate: number;
  averageRevenuePerSubscriber: number;
}

export interface CheckoutResponse {
  checkoutUrl: string;
  sessionId: string;
}

export const authorSubscriptionsApi = {
  /**
   * Setup author pricing with Stripe products (author only)
   */
  setupPricing: async (data: {
    monthlyPriceCents: number;
    annualPriceCents: number;
    defaultPreviewPercent?: number;
  }): Promise<{ success: boolean; data: AuthorPricing }> => {
    const response = await apiClient.post('/author-subscriptions/pricing/setup', data);
    return response.data;
  },

  /**
   * Get author pricing (public)
   */
  getPricing: async (authorId: number): Promise<{ success: boolean; data: AuthorPricing }> => {
    const response = await apiClient.get(`/author-subscriptions/pricing?author_id=${authorId}`);
    return response.data;
  },

  /**
   * Create Stripe checkout session for author subscription
   */
  createCheckout: async (data: {
    authorId: number;
    tier: 'monthly' | 'annual';
  }): Promise<{ success: boolean; data: CheckoutResponse }> => {
    const response = await apiClient.post('/author-subscriptions/checkout', data);
    return response.data;
  },

  /**
   * Get user's subscriptions to authors
   */
  getMySubscriptions: async (): Promise<{ success: boolean; data: AuthorSubscription[] }> => {
    const response = await apiClient.get('/author-subscriptions/my-subscriptions');
    return response.data;
  },

  /**
   * Cancel author subscription at period end
   */
  cancelSubscription: async (subscriptionId: number): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post(`/author-subscriptions/${subscriptionId}/cancel`);
    return response.data;
  },

  /**
   * Reactivate canceled author subscription
   */
  reactivateSubscription: async (subscriptionId: number): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post(`/author-subscriptions/${subscriptionId}/reactivate`);
    return response.data;
  },

  /**
   * Get author's subscribers (author only)
   */
  getSubscribers: async (filters?: {
    status?: string;
    tier?: 'monthly' | 'annual';
    limit?: number;
    offset?: number;
  }): Promise<{ success: boolean; data: SubscriberInfo[] }> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.tier) params.append('tier', filters.tier);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const response = await apiClient.get(`/author-subscriptions/subscribers?${params.toString()}`);
    return response.data;
  },

  /**
   * Get author's revenue statistics (author only)
   */
  getRevenue: async (dateRange?: {
    start_date?: string;
    end_date?: string;
  }): Promise<{ success: boolean; data: RevenueStats }> => {
    const params = new URLSearchParams();
    if (dateRange?.start_date) params.append('start_date', dateRange.start_date);
    if (dateRange?.end_date) params.append('end_date', dateRange.end_date);

    const response = await apiClient.get(`/author-subscriptions/revenue?${params.toString()}`);
    return response.data;
  },

  /**
   * Get author's dashboard stats (author only)
   */
  getStats: async (): Promise<{ success: boolean; data: RevenueStats & { recentSubscribers: SubscriberInfo[] } }> => {
    const response = await apiClient.get('/author-subscriptions/stats');
    return response.data;
  },
};
