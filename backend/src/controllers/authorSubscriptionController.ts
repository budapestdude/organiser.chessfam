import { Request, Response } from 'express';
import {
  setupAuthorPricing,
  getAuthorPricing,
  createAuthorSubscriptionCheckout,
  getUserAuthorSubscriptions,
  cancelAuthorSubscription,
  reactivateAuthorSubscription,
  getAuthorSubscribers,
  getAuthorRevenue,
} from '../services/authorSubscriptionService';

/**
 * POST /author-subscriptions/pricing/setup
 * Setup author pricing with Stripe products
 */
export const setupPricing = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const username = (req as any).user.username;

    const {
      monthlyPriceCents,
      annualPriceCents,
      defaultPreviewPercent = 30,
    } = req.body;

    // Validation
    if (!monthlyPriceCents || !annualPriceCents) {
      return res.status(400).json({
        success: false,
        message: 'monthlyPriceCents and annualPriceCents are required',
      });
    }

    if (monthlyPriceCents < 100 || annualPriceCents < 100) {
      return res.status(400).json({
        success: false,
        message: 'Prices must be at least €1.00 (100 cents)',
      });
    }

    if (defaultPreviewPercent < 0 || defaultPreviewPercent > 100) {
      return res.status(400).json({
        success: false,
        message: 'Preview percentage must be between 0 and 100',
      });
    }

    const pricing = await setupAuthorPricing(
      userId,
      username,
      monthlyPriceCents,
      annualPriceCents,
      defaultPreviewPercent
    );

    res.json({
      success: true,
      data: pricing,
    });
  } catch (error: any) {
    console.error('Error setting up author pricing:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to setup author pricing',
    });
  }
};

/**
 * GET /author-subscriptions/pricing?author_id=123
 * Get author pricing (public)
 */
export const getPricing = async (req: Request, res: Response) => {
  try {
    const authorId = parseInt(req.query.author_id as string);

    if (!authorId || isNaN(authorId)) {
      return res.status(400).json({
        success: false,
        message: 'author_id is required',
      });
    }

    const pricing = await getAuthorPricing(authorId);

    if (!pricing) {
      return res.status(404).json({
        success: false,
        message: 'Author pricing not found',
      });
    }

    res.json({
      success: true,
      data: pricing,
    });
  } catch (error: any) {
    console.error('Error fetching author pricing:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch author pricing',
    });
  }
};

/**
 * POST /author-subscriptions/checkout
 * Create Stripe checkout session for author subscription
 */
export const createCheckout = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const email = (req as any).user.email;

    const { authorId, tier } = req.body;

    if (!authorId || !tier) {
      return res.status(400).json({
        success: false,
        message: 'authorId and tier are required',
      });
    }

    if (tier !== 'monthly' && tier !== 'annual') {
      return res.status(400).json({
        success: false,
        message: 'tier must be either "monthly" or "annual"',
      });
    }

    // Check if user is trying to subscribe to themselves
    if (userId === authorId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot subscribe to your own content',
      });
    }

    const result = await createAuthorSubscriptionCheckout(
      authorId,
      userId,
      email,
      tier
    );

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
 * GET /author-subscriptions/my-subscriptions
 * Get user's subscriptions to authors
 */
export const getMySubscriptions = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const subscriptions = await getUserAuthorSubscriptions(userId);

    res.json({
      success: true,
      data: subscriptions,
    });
  } catch (error: any) {
    console.error('Error fetching user subscriptions:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch subscriptions',
    });
  }
};

/**
 * POST /author-subscriptions/:id/cancel
 * Cancel author subscription at period end
 */
export const cancel = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const subscriptionId = parseInt(req.params.id);

    if (!subscriptionId || isNaN(subscriptionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription ID',
      });
    }

    await cancelAuthorSubscription(subscriptionId, userId);

    res.json({
      success: true,
      message: 'Subscription will be canceled at the end of the current billing period',
    });
  } catch (error: any) {
    console.error('Error canceling subscription:', error);
    res.status(error.message === 'Subscription not found' ? 404 : 500).json({
      success: false,
      message: error.message || 'Failed to cancel subscription',
    });
  }
};

/**
 * POST /author-subscriptions/:id/reactivate
 * Reactivate canceled author subscription
 */
export const reactivate = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const subscriptionId = parseInt(req.params.id);

    if (!subscriptionId || isNaN(subscriptionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription ID',
      });
    }

    await reactivateAuthorSubscription(subscriptionId, userId);

    res.json({
      success: true,
      message: 'Subscription reactivated successfully',
    });
  } catch (error: any) {
    console.error('Error reactivating subscription:', error);
    res.status(
      error.message === 'Subscription not found'
        ? 404
        : error.message === 'Subscription period has already ended'
        ? 400
        : 500
    ).json({
      success: false,
      message: error.message || 'Failed to reactivate subscription',
    });
  }
};

/**
 * GET /author-subscriptions/subscribers
 * Get author's subscribers (author only)
 */
export const getSubscribers = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    // Parse query params
    const filters = {
      status: req.query.status as string | undefined,
      tier: req.query.tier as 'monthly' | 'annual' | undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
    };

    const subscribers = await getAuthorSubscribers(userId, filters);

    res.json({
      success: true,
      data: subscribers,
    });
  } catch (error: any) {
    console.error('Error fetching subscribers:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch subscribers',
    });
  }
};

/**
 * GET /author-subscriptions/revenue
 * Get author's revenue statistics (author only)
 */
export const getRevenue = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    // Parse date range if provided
    const dateRange = {
      startDate: req.query.start_date
        ? new Date(req.query.start_date as string)
        : undefined,
      endDate: req.query.end_date
        ? new Date(req.query.end_date as string)
        : undefined,
    };

    const revenue = await getAuthorRevenue(userId, dateRange);

    res.json({
      success: true,
      data: revenue,
    });
  } catch (error: any) {
    console.error('Error fetching revenue:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch revenue statistics',
    });
  }
};

/**
 * GET /author-subscriptions/stats
 * Get author's dashboard stats (author only)
 */
export const getStats = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    // Get both revenue stats and subscriber list
    const [revenue, subscribers] = await Promise.all([
      getAuthorRevenue(userId),
      getAuthorSubscribers(userId, { status: 'active' }),
    ]);

    res.json({
      success: true,
      data: {
        ...revenue,
        recentSubscribers: subscribers.slice(0, 5), // Show 5 most recent
      },
    });
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch statistics',
    });
  }
};
