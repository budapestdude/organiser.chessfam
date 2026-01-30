import apiClient from './client';

export interface SubscriptionStatus {
  tier: 'free' | 'premium';
  status: string;
  inTrial: boolean;
  trialEndsAt: string | null;
  quotaUsed: number;
  quotaLimit: number;
  quotaRemaining: number;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId: string | null;
}

export interface CheckoutResponse {
  checkoutUrl: string;
  sessionId: string;
}

export interface BillingPortalResponse {
  portalUrl: string;
}

export const subscriptionApi = {
  /**
   * Get current user's subscription status
   */
  getStatus: async (): Promise<{ success: boolean; data: SubscriptionStatus }> => {
    const response = await apiClient.get('/subscription/status');
    return response.data;
  },

  /**
   * Create Stripe checkout session for subscription
   */
  createCheckout: async (priceId: string): Promise<{ success: boolean; data: CheckoutResponse }> => {
    const response = await apiClient.post('/subscription/checkout', { priceId });
    return response.data;
  },

  /**
   * Cancel subscription at period end
   */
  cancel: async (): Promise<{ success: boolean; data: SubscriptionStatus }> => {
    const response = await apiClient.post('/subscription/cancel');
    return response.data;
  },

  /**
   * Reactivate a canceled subscription
   */
  reactivate: async (): Promise<{ success: boolean; data: SubscriptionStatus }> => {
    const response = await apiClient.post('/subscription/reactivate');
    return response.data;
  },

  /**
   * Get Stripe billing portal URL
   */
  getBillingPortal: async (): Promise<{ success: boolean; data: BillingPortalResponse }> => {
    const response = await apiClient.get('/subscription/billing-portal');
    return response.data;
  },
};
