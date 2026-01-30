import { query } from '../config/database';
import { createCheckoutSession } from './stripeService';
import { ValidationError, NotFoundError } from '../utils/errors';

export interface CreateClubMembershipPaymentParams {
  userId: number;
  clubId: number;
  membershipType: 'monthly' | 'yearly' | 'lifetime';
  clubName: string;
  membershipFee: number;
  userEmail: string;
  userName: string;
}

export interface ClubPaymentResult {
  sessionId: string;
  url: string;
  paymentId: number;
}

export const createClubMembershipPayment = async (
  params: CreateClubMembershipPaymentParams
): Promise<ClubPaymentResult> => {
  const { userId, clubId, membershipType, clubName, membershipFee, userEmail } = params;

  // Calculate amount based on membership type
  let amount = membershipFee * 100; // Convert to cents
  let description = `${clubName} - ${membershipType} membership`;

  if (membershipType === 'yearly') {
    amount = membershipFee * 12 * 100; // 12 months
  } else if (membershipType === 'lifetime') {
    amount = membershipFee * 100 * 100; // 100 months equivalent
  } else if (membershipType === 'monthly') {
    amount = membershipFee * 100;
  }

  // Create payment record
  const paymentResult = await query(
    `INSERT INTO payments (
       user_id, club_id, amount, currency, status, payment_type, description
     ) VALUES ($1, $2, $3, 'usd', 'pending', 'club_membership', $4)
     RETURNING id`,
    [userId, clubId, amount, description]
  );

  const paymentId = paymentResult.rows[0].id;

  // Create Stripe checkout session
  const session = await createCheckoutSession({
    mode: membershipType === 'monthly' ? 'subscription' : 'payment',
    lineItems: [
      {
        name: `${clubName} Membership`,
        description,
        amount,
        quantity: 1,
      },
    ],
    metadata: {
      userId: userId.toString(),
      clubId: clubId.toString(),
      paymentId: paymentId.toString(),
      membershipType,
      paymentType: 'club_membership',
    },
    customerEmail: userEmail,
  });

  // Update payment record with Stripe session ID
  await query(
    `UPDATE payments SET stripe_checkout_session_id = $1 WHERE id = $2`,
    [session.sessionId, paymentId]
  );

  return {
    sessionId: session.sessionId,
    url: session.url,
    paymentId,
  };
};

export const getClubPayment = async (paymentId: number) => {
  const result = await query(
    `SELECT p.*, c.name as club_name
     FROM payments p
     LEFT JOIN clubs c ON p.club_id = c.id
     WHERE p.id = $1`,
    [paymentId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Payment not found');
  }

  return result.rows[0];
};

export const markClubPaymentAsCompleted = async (
  paymentId: number,
  clubId: number,
  userId: number
): Promise<void> => {
  // Update payment status
  await query(
    `UPDATE payments SET status = 'succeeded', completed_at = NOW() WHERE id = $1`,
    [paymentId]
  );

  // Update club membership payment status and activate
  const membershipResult = await query(
    `SELECT id FROM club_memberships WHERE club_id = $1 AND user_id = $2`,
    [clubId, userId]
  );

  if (membershipResult.rows.length > 0) {
    // Update existing membership
    await query(
      `UPDATE club_memberships
       SET payment_status = 'paid', payment_id = $1, status = 'active', updated_at = NOW()
       WHERE club_id = $2 AND user_id = $3`,
      [paymentId, clubId, userId]
    );
  }

  // Update club member count
  await query(
    `UPDATE clubs SET member_count = (
      SELECT COUNT(*) FROM club_memberships WHERE club_id = $1 AND status = 'active'
    ) WHERE id = $1`,
    [clubId]
  );
};
