import { Request, Response } from 'express';
import {
  getSubscriptionStatus,
  createSubscriptionCheckout,
  cancelSubscription,
  reactivateSubscription,
  createBillingPortalSession,
} from '../services/subscriptionService';

/**
 * GET /subscription/status
 * Get current user's subscription status
 */
export const getStatus = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const status = await getSubscriptionStatus(userId);

    res.json({
      success: true,
      data: status,
    });
  } catch (error: any) {
    console.error('Error fetching subscription status:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch subscription status',
    });
  }
};

/**
 * POST /subscription/checkout
 * Create Stripe checkout session for subscription
 */
export const createCheckout = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const email = (req as any).user.email;
    const { priceId } = req.body;

    if (!priceId) {
      return res.status(400).json({
        success: false,
        message: 'priceId is required',
      });
    }

    // Validate price ID format
    if (!priceId.startsWith('price_')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid price ID format',
      });
    }

    const result = await createSubscriptionCheckout(userId, priceId, email);

    res.json({
      success: true,
      data: {
        checkoutUrl: result.checkoutUrl,
        sessionId: result.sessionId,
      },
    });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create checkout session',
    });
  }
};

/**
 * POST /subscription/cancel
 * Cancel subscription at period end
 */
export const cancel = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    await cancelSubscription(userId);

    // Get updated status
    const status = await getSubscriptionStatus(userId);

    res.json({
      success: true,
      message: 'Subscription will be canceled at the end of the current billing period',
      data: status,
    });
  } catch (error: any) {
    console.error('Error canceling subscription:', error);
    res.status(error.message === 'No active subscription found' ? 404 : 500).json({
      success: false,
      message: error.message || 'Failed to cancel subscription',
    });
  }
};

/**
 * POST /subscription/reactivate
 * Reactivate a canceled subscription (before period end)
 */
export const reactivate = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    await reactivateSubscription(userId);

    // Get updated status
    const status = await getSubscriptionStatus(userId);

    res.json({
      success: true,
      message: 'Subscription reactivated successfully',
      data: status,
    });
  } catch (error: any) {
    console.error('Error reactivating subscription:', error);

    const statusCode =
      error.message === 'No subscription found'
        ? 404
        : error.message === 'Subscription period has already ended'
        ? 400
        : 500;

    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to reactivate subscription',
    });
  }
};

/**
 * GET /subscription/billing-portal
 * Get Stripe billing portal URL
 */
export const getBillingPortal = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const result = await createBillingPortalSession(userId);

    res.json({
      success: true,
      data: {
        portalUrl: result.portalUrl,
      },
    });
  } catch (error: any) {
    console.error('Error creating billing portal session:', error);
    res.status(error.message === 'No Stripe customer found' ? 404 : 500).json({
      success: false,
      message: error.message || 'Failed to create billing portal session',
    });
  }
};
