import { Request, Response, NextFunction } from 'express';
import { constructWebhookEvent } from '../services/stripeService';
import { handleStripeWebhook } from '../services/webhookService';

// This middleware requires raw body, so it must be used before express.json()
export const stripeWebhookHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const signature = req.headers['stripe-signature'] as string;

  if (!signature) {
    return res.status(400).json({ error: 'Missing stripe-signature header' });
  }

  try {
    const event = constructWebhookEvent(req.body, signature);
    await handleStripeWebhook(event);
    res.json({ received: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Webhook] Error:', message);
    res.status(400).json({ error: message });
  }
};
