import { query } from '../config/database';
import { NotFoundError, ValidationError, ForbiddenError, ConflictError } from '../utils/errors';

// Validation helpers
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const validateMembershipFee = (fee: number): void => {
  if (fee < 0 || fee > 10000) {
    throw new ValidationError('Membership fee must be between 0 and 10000');
  }
};

export interface Club {
  id: number;
  owner_id?: number;
  venue_id?: number;
  name: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  founded_year?: number;
  member_count: number;
  image?: string;
  meeting_schedule?: string;
  membership_fee: number;
  is_active: boolean;
  website?: string;
  contact_email?: string;
  premium_discount_eligible?: boolean; // Staff-managed: true if 10% discount applies for premium members
  created_at: Date;
  updated_at: Date;
}

export interface ClubWithDetails extends Club {
  owner_name?: string;
  venue_name?: string;
  venue_address?: string;
}

export interface CreateClubInput {
  name: string;
  description?: string;
  // Location fields
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  founded_year?: number;
  image?: string;
  meeting_schedule?: string;
  membership_fee?: number;
  venue_id?: number;
  website?: string;
  contact_email?: string;
}

export const getClubs = async (filters: {
  city?: string;
  country?: string;
  is_active?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  includeUnapproved?: boolean; // For admin panel
}): Promise<{ clubs: ClubWithDetails[]; total: number }> => {
  const { city, country, is_active = true, search, page = 1, limit = 20, includeUnapproved = false } = filters;
  const offset = (page - 1) * limit;

  let whereClause = 'WHERE 1=1';
  const params: any[] = [];
  let paramIndex = 1;

  // Only show approved clubs to regular users
  if (!includeUnapproved) {
    whereClause += ` AND c.approval_status = 'approved'`;
  }

  if (is_active !== undefined) {
    whereClause += ` AND c.is_active = $${paramIndex++}`;
    params.push(is_active);
  }

  if (city) {
    whereClause += ` AND LOWER(c.city) LIKE LOWER($${paramIndex++})`;
    params.push(`%${city}%`);
  }

  if (country) {
    whereClause += ` AND LOWER(c.country) LIKE LOWER($${paramIndex++})`;
    params.push(`%${country}%`);
  }

  if (search) {
    // Fuzzy search using pg_trgm similarity (handles typos and partial matches)
    // Very generous threshold (0.1) and space-insensitive matching
    whereClause += ` AND (
      similarity(c.name, $${paramIndex}) > 0.1 OR
      similarity(COALESCE(c.description, ''), $${paramIndex}) > 0.1 OR
      word_similarity($${paramIndex}, c.name) > 0.2 OR
      similarity(REPLACE(LOWER(c.name), ' ', ''), REPLACE(LOWER($${paramIndex}), ' ', '')) > 0.3 OR
      c.name ILIKE $${paramIndex + 1} OR
      COALESCE(c.description, '') ILIKE $${paramIndex + 1}
    )`;
    params.push(search, `%${search}%`);
    paramIndex += 2;
  }

  const countResult = await query(
    `SELECT COUNT(*) FROM clubs c ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].count);

  const result = await query(
    `SELECT c.*,
            u.name as owner_name,
            v.name as venue_name,
            v.address as venue_address
            ${search ? `,
            GREATEST(
              similarity(c.name, $${paramIndex - 2}),
              similarity(COALESCE(c.description, ''), $${paramIndex - 2}),
              word_similarity($${paramIndex - 2}, c.name),
              similarity(REPLACE(LOWER(c.name), ' ', ''), REPLACE(LOWER($${paramIndex - 2}), ' ', ''))
            ) as search_rank` : ''}
     FROM clubs c
     LEFT JOIN users u ON c.owner_id = u.id
     LEFT JOIN venues v ON c.venue_id = v.id
     ${whereClause}
     ORDER BY ${search ? 'search_rank DESC,' : ''} c.member_count DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    [...params, limit, offset]
  );

  return { clubs: result.rows, total };
};

export const getClubById = async (id: number): Promise<ClubWithDetails> => {
  const result = await query(
    `SELECT c.*,
            u.name as owner_name,
            v.name as venue_name,
            v.address as venue_address,
            v.city as venue_city
     FROM clubs c
     LEFT JOIN users u ON c.owner_id = u.id
     LEFT JOIN venues v ON c.venue_id = v.id
     WHERE c.id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Club not found');
  }

  return result.rows[0];
};

export const createClub = async (
  ownerId: number,
  input: CreateClubInput
): Promise<Club> => {
  const {
    name,
    description,
    address,
    city,
    state,
    country,
    founded_year,
    image,
    meeting_schedule,
    membership_fee = 0,
    venue_id,
    website,
    contact_email,
  } = input;

  if (!name) {
    throw new ValidationError('Club name is required');
  }

  // Validate email
  if (contact_email && !isValidEmail(contact_email)) {
    throw new ValidationError('Invalid email address');
  }

  // Validate website URL
  if (website && !isValidUrl(website)) {
    throw new ValidationError('Invalid website URL');
  }

  // Validate membership fee
  validateMembershipFee(membership_fee);

  // Geocode address for accurate coordinates
  let latitude: number | undefined;
  let longitude: number | undefined;

  if (city) {
    try {
      const { geocodeAddress } = await import('./geocodingService');
      const geoResult = await geocodeAddress({ address, city, state, country });
      if (geoResult) {
        latitude = geoResult.latitude;
        longitude = geoResult.longitude;
        console.log(`[Club] Geocoded "${city}" to coordinates: ${latitude}, ${longitude}`);
      }
    } catch (err) {
      console.error('[Club] Geocoding failed:', err);
    }
  }

  const result = await query(
    `INSERT INTO clubs (
       owner_id, venue_id, name, description, address, city, state, country,
       founded_year, image, meeting_schedule, membership_fee, website, contact_email,
       latitude, longitude, approval_status
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
     RETURNING *`,
    [
      ownerId, venue_id, name, description, address, city, state, country,
      founded_year, image, meeting_schedule, membership_fee, website, contact_email,
      latitude, longitude, 'pending'
    ]
  );

  // Add owner as first member with 'owner' role
  await query(
    `INSERT INTO club_memberships (club_id, user_id, role)
     VALUES ($1, $2, 'owner')`,
    [result.rows[0].id, ownerId]
  );

  // Update member count
  await query(
    `UPDATE clubs SET member_count = 1 WHERE id = $1`,
    [result.rows[0].id]
  );

  // Create associated community for the club (for city bubbles)
  try {
    const communitiesService = await import('./communitiesService');
    await communitiesService.createCommunity(ownerId, {
      name,
      description,
      type: 'club',
      city,
      country,
      latitude,
      longitude,
      image,
      tags: ['club'],
    });
  } catch (err) {
    // Log but don't fail club creation if community creation fails
    console.error('Failed to create community for club:', err);
  }

  return result.rows[0];
};

export const updateClub = async (
  id: number,
  userId: number,
  input: Partial<CreateClubInput>
): Promise<Club> => {
  const club = await getClubById(id);

  // Check if user is owner or admin
  const membershipResult = await query(
    `SELECT role FROM club_memberships WHERE club_id = $1 AND user_id = $2`,
    [id, userId]
  );

  const membership = membershipResult.rows[0];
  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    throw new ForbiddenError('Only club owners or admins can update the club');
  }

  // Validate email if being updated
  if (input.contact_email && !isValidEmail(input.contact_email)) {
    throw new ValidationError('Invalid email address');
  }

  // Validate website URL if being updated
  if (input.website && !isValidUrl(input.website)) {
    throw new ValidationError('Invalid website URL');
  }

  // Validate membership fee if being updated
  if (input.membership_fee !== undefined) {
    validateMembershipFee(input.membership_fee);
  }

  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  const fields = [
    'name', 'description', 'city', 'country', 'founded_year',
    'image', 'meeting_schedule', 'membership_fee', 'venue_id',
    'website', 'contact_email'
  ];

  for (const field of fields) {
    if (input[field as keyof CreateClubInput] !== undefined) {
      updates.push(`${field} = $${paramIndex++}`);
      values.push(input[field as keyof CreateClubInput]);
    }
  }

  if (updates.length === 0) {
    return club;
  }

  updates.push(`updated_at = NOW()`);
  values.push(id);

  const result = await query(
    `UPDATE clubs SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  return result.rows[0];
};

export const joinClub = async (clubId: number, userId: number): Promise<any> => {
  const club = await getClubById(clubId);

  if (!club.is_active) {
    throw new ValidationError('This club is not accepting new members');
  }

  // Check if already a member
  const existing = await query(
    `SELECT id, status FROM club_memberships WHERE club_id = $1 AND user_id = $2`,
    [clubId, userId]
  );

  if (existing.rows.length > 0) {
    if (existing.rows[0].status === 'active') {
      throw new ConflictError('You are already a member of this club');
    }
    if (existing.rows[0].status === 'banned') {
      throw new ForbiddenError('You are banned from this club');
    }
    // Reactivate inactive membership
    await query(
      `UPDATE club_memberships SET status = 'active', joined_at = NOW()
       WHERE club_id = $1 AND user_id = $2`,
      [clubId, userId]
    );
  } else {
    // Calculate membership fee with premium discount if applicable
    const originalFee = club.membership_fee || 0;
    let finalFee = originalFee;
    let discountApplied = 0;
    let discountType: string | null = null;

    if (originalFee > 0 && club.premium_discount_eligible) {
      // Check if user has premium subscription
      try {
        const { getSubscriptionStatus } = await import('./subscriptionService');
        const subscription = await getSubscriptionStatus(userId);

        // Apply 10% discount for premium members (including those in trial)
        if (subscription.tier === 'premium' || subscription.inTrial) {
          discountApplied = Math.round(originalFee * 0.1 * 100) / 100; // 10% discount, rounded to 2 decimals
          finalFee = originalFee - discountApplied;
          discountType = 'premium_member';
        }
      } catch (error) {
        // If subscription check fails, continue without discount
        console.error('Failed to check subscription status for discount:', error);
      }
    }

    await query(
      `INSERT INTO club_memberships (
        club_id, user_id, membership_fee, original_fee, discount_applied, discount_type
      )
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [clubId, userId, finalFee, originalFee, discountApplied, discountType]
    );
  }

  // Update member count
  await query(
    `UPDATE clubs SET member_count = (
       SELECT COUNT(*) FROM club_memberships WHERE club_id = $1 AND status = 'active'
     ), updated_at = NOW()
     WHERE id = $1`,
    [clubId]
  );

  return { clubId, userId, status: 'active' };
};

export const leaveClub = async (clubId: number, userId: number): Promise<void> => {
  // Check membership
  const membershipResult = await query(
    `SELECT role FROM club_memberships WHERE club_id = $1 AND user_id = $2 AND status = 'active'`,
    [clubId, userId]
  );

  if (membershipResult.rows.length === 0) {
    throw new NotFoundError('You are not a member of this club');
  }

  if (membershipResult.rows[0].role === 'owner') {
    throw new ValidationError('Club owner cannot leave. Transfer ownership first.');
  }

  await query(
    `UPDATE club_memberships SET status = 'inactive' WHERE club_id = $1 AND user_id = $2`,
    [clubId, userId]
  );

  // Update member count
  await query(
    `UPDATE clubs SET member_count = (
       SELECT COUNT(*) FROM club_memberships WHERE club_id = $1 AND status = 'active'
     ), updated_at = NOW()
     WHERE id = $1`,
    [clubId]
  );
};

export const getClubMembers = async (
  clubId: number,
  page: number = 1,
  limit: number = 50
): Promise<{ members: any[]; total: number }> => {
  const offset = (page - 1) * limit;

  const countResult = await query(
    `SELECT COUNT(*) FROM club_memberships WHERE club_id = $1 AND status = 'active'`,
    [clubId]
  );
  const total = parseInt(countResult.rows[0].count);

  const result = await query(
    `SELECT cm.*, u.name, u.rating, u.avatar
     FROM club_memberships cm
     JOIN users u ON cm.user_id = u.id
     WHERE cm.club_id = $1 AND cm.status = 'active'
     ORDER BY
       CASE cm.role
         WHEN 'owner' THEN 1
         WHEN 'admin' THEN 2
         WHEN 'officer' THEN 3
         ELSE 4
       END,
       cm.joined_at ASC
     LIMIT $2 OFFSET $3`,
    [clubId, limit, offset]
  );

  return { members: result.rows, total };
};

export const getUserClubs = async (userId: number): Promise<ClubWithDetails[]> => {
  const result = await query(
    `SELECT DISTINCT c.*,
            COALESCE(cm.role, 'owner') as user_role,
            COALESCE(cm.joined_at, c.created_at) as user_joined_at,
            u.name as owner_name
     FROM clubs c
     LEFT JOIN club_memberships cm ON c.id = cm.club_id AND cm.user_id = $1 AND cm.status = 'active'
     LEFT JOIN users u ON c.owner_id = u.id
     WHERE (cm.user_id = $1 OR c.owner_id = $1)
     ORDER BY COALESCE(cm.joined_at, c.created_at) DESC`,
    [userId]
  );

  return result.rows;
};

export const isUserMember = async (clubId: number, userId: number): Promise<boolean> => {
  const result = await query(
    `SELECT id FROM club_memberships WHERE club_id = $1 AND user_id = $2 AND status = 'active'`,
    [clubId, userId]
  );

  return result.rows.length > 0;
};

export const updateMemberRole = async (
  clubId: number,
  actorId: number,
  targetUserId: number,
  newRole: 'member' | 'officer' | 'admin'
): Promise<void> => {
  // Check actor's role
  const actorResult = await query(
    `SELECT role FROM club_memberships WHERE club_id = $1 AND user_id = $2 AND status = 'active'`,
    [clubId, actorId]
  );

  if (actorResult.rows.length === 0) {
    throw new ForbiddenError('You are not a member of this club');
  }

  const actorRole = actorResult.rows[0].role;
  if (!['owner', 'admin'].includes(actorRole)) {
    throw new ForbiddenError('Only owners and admins can change member roles');
  }

  // Can't change owner role
  const targetResult = await query(
    `SELECT role FROM club_memberships WHERE club_id = $1 AND user_id = $2 AND status = 'active'`,
    [clubId, targetUserId]
  );

  if (targetResult.rows.length === 0) {
    throw new NotFoundError('User is not a member of this club');
  }

  if (targetResult.rows[0].role === 'owner') {
    throw new ForbiddenError('Cannot change owner role');
  }

  // Admin can't promote to admin
  if (actorRole === 'admin' && newRole === 'admin') {
    throw new ForbiddenError('Only owners can promote members to admin');
  }

  await query(
    `UPDATE club_memberships SET role = $1 WHERE club_id = $2 AND user_id = $3`,
    [newRole, clubId, targetUserId]
  );
};

// Transfer club ownership to another member
export const transferOwnership = async (
  clubId: number,
  currentOwnerId: number,
  newOwnerId: number
): Promise<void> => {
  // Verify current owner
  const club = await getClubById(clubId);

  if (club.owner_id !== currentOwnerId) {
    throw new ForbiddenError('Only the club owner can transfer ownership');
  }

  // Verify new owner is an active member
  const memberCheck = await query(
    `SELECT id, role FROM club_memberships WHERE club_id = $1 AND user_id = $2 AND status = 'active'`,
    [clubId, newOwnerId]
  );

  if (memberCheck.rows.length === 0) {
    throw new ValidationError('New owner must be an active member of the club');
  }

  // Begin transaction
  await query('BEGIN');

  try {
    // Update club owner_id
    await query(
      `UPDATE clubs SET owner_id = $1, updated_at = NOW() WHERE id = $2`,
      [newOwnerId, clubId]
    );

    // Update old owner role to admin
    await query(
      `UPDATE club_memberships SET role = 'admin', updated_at = NOW() WHERE club_id = $1 AND user_id = $2`,
      [clubId, currentOwnerId]
    );

    // Update new owner role
    await query(
      `UPDATE club_memberships SET role = 'owner', updated_at = NOW() WHERE club_id = $1 AND user_id = $2`,
      [clubId, newOwnerId]
    );

    // Record transfer in ownership_transfers table (if exists)
    try {
      await query(
        `INSERT INTO ownership_transfers (entity_type, entity_id, from_user_id, to_user_id, transfer_type, transferred_by)
         VALUES ('club', $1, $2, $3, 'transfer', $2)`,
        [clubId, currentOwnerId, newOwnerId]
      );
    } catch (err) {
      // Table might not exist, ignore error
      console.log('[Club] ownership_transfers table not found, skipping record');
    }

    await query('COMMIT');
    console.log(`[Club] Ownership of club ${clubId} transferred from ${currentOwnerId} to ${newOwnerId}`);
  } catch (error) {
    await query('ROLLBACK');
    throw error;
  }
};

// Delete a club (soft delete)
export const deleteClub = async (
  clubId: number,
  userId: number,
  isAdmin: boolean = false
): Promise<void> => {
  const club = await getClubById(clubId);

  // Check permissions
  if (!isAdmin && club.owner_id !== userId) {
    throw new ForbiddenError('Only the club owner or admin can delete the club');
  }

  // Check for active memberships
  const memberCount = await query(
    `SELECT COUNT(*) FROM club_memberships WHERE club_id = $1 AND status = 'active'`,
    [clubId]
  );

  if (parseInt(memberCount.rows[0].count) > 1) {
    throw new ValidationError(
      'Cannot delete club with active members. Please remove all members first or transfer ownership.'
    );
  }

  // Soft delete (set is_active to false)
  await query(
    `UPDATE clubs SET is_active = false, updated_at = NOW() WHERE id = $1`,
    [clubId]
  );

  console.log(`[Club] Club ${clubId} marked as inactive by user ${userId}`);
};

// Ban a member from the club
export const banMember = async (
  clubId: number,
  actorId: number,
  targetUserId: number
): Promise<void> => {
  // Check actor has permission (owner or admin)
  const actorResult = await query(
    `SELECT role FROM club_memberships WHERE club_id = $1 AND user_id = $2 AND status = 'active'`,
    [clubId, actorId]
  );

  if (actorResult.rows.length === 0 || !['owner', 'admin'].includes(actorResult.rows[0].role)) {
    throw new ForbiddenError('Only owners and admins can ban members');
  }

  // Can't ban owner
  const targetResult = await query(
    `SELECT role FROM club_memberships WHERE club_id = $1 AND user_id = $2`,
    [clubId, targetUserId]
  );

  if (targetResult.rows.length === 0) {
    throw new NotFoundError('User is not a member of this club');
  }

  if (targetResult.rows[0].role === 'owner') {
    throw new ForbiddenError('Cannot ban the club owner');
  }

  // Ban user
  await query(
    `UPDATE club_memberships SET status = 'banned', updated_at = NOW()
     WHERE club_id = $1 AND user_id = $2`,
    [clubId, targetUserId]
  );

  // Update member count
  await query(
    `UPDATE clubs SET member_count = (
      SELECT COUNT(*) FROM club_memberships WHERE club_id = $1 AND status = 'active'
    ), updated_at = NOW() WHERE id = $1`,
    [clubId]
  );

  console.log(`[Club] User ${targetUserId} banned from club ${clubId} by ${actorId}`);
};

// Unban a member
export const unbanMember = async (
  clubId: number,
  actorId: number,
  targetUserId: number
): Promise<void> => {
  // Check actor has permission (owner or admin)
  const actorResult = await query(
    `SELECT role FROM club_memberships WHERE club_id = $1 AND user_id = $2 AND status = 'active'`,
    [clubId, actorId]
  );

  if (actorResult.rows.length === 0 || !['owner', 'admin'].includes(actorResult.rows[0].role)) {
    throw new ForbiddenError('Only owners and admins can unban members');
  }

  // Check if user is actually banned
  const targetResult = await query(
    `SELECT status FROM club_memberships WHERE club_id = $1 AND user_id = $2`,
    [clubId, targetUserId]
  );

  if (targetResult.rows.length === 0) {
    throw new NotFoundError('User is not a member of this club');
  }

  if (targetResult.rows[0].status !== 'banned') {
    throw new ValidationError('User is not banned');
  }

  // Unban user
  await query(
    `UPDATE club_memberships SET status = 'active', updated_at = NOW()
     WHERE club_id = $1 AND user_id = $2`,
    [clubId, targetUserId]
  );

  // Update member count
  await query(
    `UPDATE clubs SET member_count = (
      SELECT COUNT(*) FROM club_memberships WHERE club_id = $1 AND status = 'active'
    ), updated_at = NOW() WHERE id = $1`,
    [clubId]
  );

  console.log(`[Club] User ${targetUserId} unbanned from club ${clubId} by ${actorId}`);
};

// ============================================
// MULTI-VENUE SUPPORT
// ============================================

export interface ClubVenue {
  id: number;
  club_id: number;
  venue_id: number;
  is_primary: boolean;
  created_at: Date;
  venue_name?: string;
  venue_address?: string;
  venue_city?: string;
  venue_country?: string;
}

// Get all venues for a club
export const getClubVenues = async (clubId: number): Promise<ClubVenue[]> => {
  const result = await query(
    `SELECT cv.*, v.name as venue_name, v.address as venue_address, v.city as venue_city, v.country as venue_country
     FROM club_venues cv
     JOIN venues v ON cv.venue_id = v.id
     WHERE cv.club_id = $1
     ORDER BY cv.is_primary DESC, cv.created_at ASC`,
    [clubId]
  );

  return result.rows;
};

// Add a venue to a club
export const addClubVenue = async (
  clubId: number,
  venueId: number,
  actorId: number,
  isPrimary: boolean = false
): Promise<ClubVenue> => {
  // Check actor has permission (owner or admin)
  const actorResult = await query(
    `SELECT role FROM club_memberships WHERE club_id = $1 AND user_id = $2 AND status = 'active'`,
    [clubId, actorId]
  );

  if (actorResult.rows.length === 0) {
    throw new ForbiddenError('You must be a club member to add venues');
  }

  const role = actorResult.rows[0].role;
  if (!['owner', 'admin'].includes(role)) {
    throw new ForbiddenError('Only club owners and admins can add venues');
  }

  // Verify venue exists
  const venueResult = await query(
    `SELECT id FROM venues WHERE id = $1`,
    [venueId]
  );

  if (venueResult.rows.length === 0) {
    throw new NotFoundError('Venue not found');
  }

  // If marking as primary, unmark other primary venues
  if (isPrimary) {
    await query(
      `UPDATE club_venues SET is_primary = false WHERE club_id = $1`,
      [clubId]
    );
  }

  // Insert the club-venue relationship
  const result = await query(
    `INSERT INTO club_venues (club_id, venue_id, is_primary)
     VALUES ($1, $2, $3)
     ON CONFLICT (club_id, venue_id) DO UPDATE
     SET is_primary = EXCLUDED.is_primary
     RETURNING *`,
    [clubId, venueId, isPrimary]
  );

  console.log(`[Club] Venue ${venueId} added to club ${clubId} by user ${actorId}`);
  return result.rows[0];
};

// Remove a venue from a club
export const removeClubVenue = async (
  clubId: number,
  venueId: number,
  actorId: number
): Promise<void> => {
  // Check actor has permission (owner or admin)
  const actorResult = await query(
    `SELECT role FROM club_memberships WHERE club_id = $1 AND user_id = $2 AND status = 'active'`,
    [clubId, actorId]
  );

  if (actorResult.rows.length === 0) {
    throw new ForbiddenError('You must be a club member to remove venues');
  }

  const role = actorResult.rows[0].role;
  if (!['owner', 'admin'].includes(role)) {
    throw new ForbiddenError('Only club owners and admins can remove venues');
  }

  const result = await query(
    `DELETE FROM club_venues WHERE club_id = $1 AND venue_id = $2 RETURNING *`,
    [clubId, venueId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Club-venue relationship not found');
  }

  console.log(`[Club] Venue ${venueId} removed from club ${clubId} by user ${actorId}`);
};

// Set a venue as primary for a club
export const setPrimaryClubVenue = async (
  clubId: number,
  venueId: number,
  actorId: number
): Promise<void> => {
  // Check actor has permission (owner or admin)
  const actorResult = await query(
    `SELECT role FROM club_memberships WHERE club_id = $1 AND user_id = $2 AND status = 'active'`,
    [clubId, actorId]
  );

  if (actorResult.rows.length === 0) {
    throw new ForbiddenError('You must be a club member to set primary venue');
  }

  const role = actorResult.rows[0].role;
  if (!['owner', 'admin'].includes(role)) {
    throw new ForbiddenError('Only club owners and admins can set primary venue');
  }

  // Verify the venue is associated with this club
  const venueResult = await query(
    `SELECT id FROM club_venues WHERE club_id = $1 AND venue_id = $2`,
    [clubId, venueId]
  );

  if (venueResult.rows.length === 0) {
    throw new NotFoundError('Venue is not associated with this club');
  }

  // Unmark all as primary, then mark the specified one
  await query(`UPDATE club_venues SET is_primary = false WHERE club_id = $1`, [clubId]);
  await query(
    `UPDATE club_venues SET is_primary = true WHERE club_id = $1 AND venue_id = $2`,
    [clubId, venueId]
  );

  console.log(`[Club] Venue ${venueId} set as primary for club ${clubId} by user ${actorId}`);
};
