import { query } from '../config/database';
import { ForbiddenError, NotFoundError, ValidationError, ConflictError } from '../utils/errors';
import crypto from 'crypto';

export type EntityType = 'venue' | 'club' | 'tournament' | 'community';

export interface OwnershipTransfer {
  id: number;
  entity_type: EntityType;
  entity_id: number;
  from_user_id: number | null;
  to_user_id: number;
  transfer_type: 'transfer' | 'claim' | 'admin_assign';
  reason?: string;
  transferred_by: number | null;
  created_at: string;
}

export interface OwnershipClaim {
  id: number;
  entity_type: EntityType;
  entity_id: number;
  claimer_id: number;
  status: 'pending' | 'approved' | 'rejected';
  claim_reason?: string;
  verification_info?: Record<string, any>;
  reviewed_by?: number;
  reviewed_at?: string;
  review_notes?: string;
  created_at: string;
  updated_at: string;
}

// Entity table configurations
const entityConfig: Record<EntityType, {
  table: string;
  ownerColumn: string;
  nameColumn: string;
  membershipTable?: string;
  membershipEntityColumn?: string;
}> = {
  venue: {
    table: 'venue_submissions',
    ownerColumn: 'submitted_by', // venue_submissions uses submitted_by as owner
    nameColumn: 'venue_name'
  },
  club: {
    table: 'clubs',
    ownerColumn: 'owner_id',
    nameColumn: 'name',
    membershipTable: 'club_memberships',
    membershipEntityColumn: 'club_id'
  },
  tournament: {
    table: 'tournaments',
    ownerColumn: 'organizer_id',
    nameColumn: 'name'
  },
  community: {
    table: 'communities',
    ownerColumn: 'owner_id',
    nameColumn: 'name',
    membershipTable: 'community_members',
    membershipEntityColumn: 'community_id'
  }
};

// Generate a unique claim code
export const generateClaimCode = (): string => {
  return crypto.randomBytes(16).toString('hex').toUpperCase();
};

// Get entity details including ownership info
export const getEntityOwnership = async (
  entityType: EntityType,
  entityId: number
): Promise<{
  id: number;
  name: string;
  owner_id: number | null;
  owner_name?: string;
  claim_code?: string;
  is_claimable: boolean;
  claimed_at?: string;
}> => {
  const config = entityConfig[entityType];

  const result = await query(
    `SELECT e.id, e.${config.nameColumn} as name, e.${config.ownerColumn} as owner_id,
            e.claim_code, e.is_claimable, e.claimed_at,
            u.name as owner_name
     FROM ${config.table} e
     LEFT JOIN users u ON e.${config.ownerColumn} = u.id
     WHERE e.id = $1`,
    [entityId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError(`${entityType} not found`);
  }

  return result.rows[0];
};

// Check if user is owner or admin of entity
export const checkOwnership = async (
  entityType: EntityType,
  entityId: number,
  userId: number
): Promise<{ isOwner: boolean; isAdmin: boolean; role?: string }> => {
  const config = entityConfig[entityType];

  // Check direct ownership
  const entityResult = await query(
    `SELECT ${config.ownerColumn} as owner_id FROM ${config.table} WHERE id = $1`,
    [entityId]
  );

  if (entityResult.rows.length === 0) {
    throw new NotFoundError(`${entityType} not found`);
  }

  const isOwner = entityResult.rows[0].owner_id === userId;

  // Check membership-based roles if applicable
  if (config.membershipTable) {
    const memberResult = await query(
      `SELECT role FROM ${config.membershipTable}
       WHERE ${config.membershipEntityColumn} = $1 AND user_id = $2 AND status = 'active'`,
      [entityId, userId]
    );

    if (memberResult.rows.length > 0) {
      const role = memberResult.rows[0].role;
      return {
        isOwner: role === 'owner',
        isAdmin: ['owner', 'admin'].includes(role),
        role
      };
    }
  }

  // Check if user is system admin
  const userResult = await query(
    `SELECT role FROM users WHERE id = $1`,
    [userId]
  );
  const isSystemAdmin = userResult.rows[0]?.role === 'admin';

  return { isOwner, isAdmin: isOwner || isSystemAdmin };
};

// Transfer ownership from current owner to new owner
export const transferOwnership = async (
  entityType: EntityType,
  entityId: number,
  currentUserId: number,
  newOwnerId: number,
  reason?: string
): Promise<OwnershipTransfer> => {
  const config = entityConfig[entityType];

  // Check current ownership
  const ownership = await checkOwnership(entityType, entityId, currentUserId);
  if (!ownership.isOwner) {
    // Check if system admin
    const userResult = await query(`SELECT role FROM users WHERE id = $1`, [currentUserId]);
    if (userResult.rows[0]?.role !== 'admin') {
      throw new ForbiddenError('Only the owner can transfer ownership');
    }
  }

  // Verify new owner exists
  const newOwnerResult = await query(`SELECT id, name FROM users WHERE id = $1`, [newOwnerId]);
  if (newOwnerResult.rows.length === 0) {
    throw new NotFoundError('New owner not found');
  }

  // Get current owner
  const entityResult = await query(
    `SELECT ${config.ownerColumn} as owner_id FROM ${config.table} WHERE id = $1`,
    [entityId]
  );
  const currentOwnerId = entityResult.rows[0].owner_id;

  // Can't transfer to same person
  if (currentOwnerId === newOwnerId) {
    throw new ValidationError('Cannot transfer ownership to the current owner');
  }

  // Start transaction
  await query('BEGIN');

  try {
    // Update entity owner
    await query(
      `UPDATE ${config.table} SET ${config.ownerColumn} = $1, claimed_at = NOW() WHERE id = $2`,
      [newOwnerId, entityId]
    );

    // Update membership table if exists
    if (config.membershipTable) {
      // Demote current owner to admin (if exists in membership)
      if (currentOwnerId) {
        await query(
          `UPDATE ${config.membershipTable} SET role = 'admin'
           WHERE ${config.membershipEntityColumn} = $1 AND user_id = $2`,
          [entityId, currentOwnerId]
        );
      }

      // Check if new owner is already a member
      const existingMember = await query(
        `SELECT id FROM ${config.membershipTable}
         WHERE ${config.membershipEntityColumn} = $1 AND user_id = $2`,
        [entityId, newOwnerId]
      );

      if (existingMember.rows.length > 0) {
        // Promote to owner
        await query(
          `UPDATE ${config.membershipTable} SET role = 'owner', status = 'active'
           WHERE ${config.membershipEntityColumn} = $1 AND user_id = $2`,
          [entityId, newOwnerId]
        );
      } else {
        // Add as owner
        await query(
          `INSERT INTO ${config.membershipTable} (${config.membershipEntityColumn}, user_id, role, status)
           VALUES ($1, $2, 'owner', 'active')`,
          [entityId, newOwnerId]
        );
      }
    }

    // Record the transfer
    const transferResult = await query(
      `INSERT INTO ownership_transfers
       (entity_type, entity_id, from_user_id, to_user_id, transfer_type, reason, transferred_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [entityType, entityId, currentOwnerId, newOwnerId, 'transfer', reason, currentUserId]
    );

    await query('COMMIT');

    return transferResult.rows[0];
  } catch (error) {
    await query('ROLLBACK');
    throw error;
  }
};

// Create entity without owner (for admin-created content)
export const createUnclaimedEntity = async (
  entityType: EntityType,
  entityId: number,
  createdByAdminId: number
): Promise<string> => {
  const config = entityConfig[entityType];
  const claimCode = generateClaimCode();

  // Set entity as claimable with null owner
  await query(
    `UPDATE ${config.table}
     SET ${config.ownerColumn} = NULL, claim_code = $1, is_claimable = true
     WHERE id = $2`,
    [claimCode, entityId]
  );

  // Record the creation
  await query(
    `INSERT INTO ownership_transfers
     (entity_type, entity_id, from_user_id, to_user_id, transfer_type, reason, transferred_by)
     VALUES ($1, $2, NULL, $3, 'admin_assign', 'Admin created unclaimed entity', $3)`,
    [entityType, entityId, createdByAdminId]
  );

  return claimCode;
};

// Claim ownership with claim code
export const claimWithCode = async (
  entityType: EntityType,
  entityId: number,
  claimCode: string,
  userId: number
): Promise<OwnershipTransfer> => {
  const config = entityConfig[entityType];

  // Verify claim code
  const entityResult = await query(
    `SELECT id, ${config.ownerColumn} as owner_id, claim_code, is_claimable
     FROM ${config.table} WHERE id = $1`,
    [entityId]
  );

  if (entityResult.rows.length === 0) {
    throw new NotFoundError(`${entityType} not found`);
  }

  const entity = entityResult.rows[0];

  if (!entity.is_claimable) {
    throw new ValidationError('This entity is not available for claiming');
  }

  if (entity.owner_id) {
    throw new ConflictError('This entity already has an owner');
  }

  if (entity.claim_code !== claimCode) {
    throw new ValidationError('Invalid claim code');
  }

  // Start transaction
  await query('BEGIN');

  try {
    // Update ownership
    await query(
      `UPDATE ${config.table}
       SET ${config.ownerColumn} = $1, claimed_at = NOW(), is_claimable = false
       WHERE id = $2`,
      [userId, entityId]
    );

    // Add to membership table if exists
    if (config.membershipTable) {
      await query(
        `INSERT INTO ${config.membershipTable} (${config.membershipEntityColumn}, user_id, role, status)
         VALUES ($1, $2, 'owner', 'active')
         ON CONFLICT (${config.membershipEntityColumn}, user_id)
         DO UPDATE SET role = 'owner', status = 'active'`,
        [entityId, userId]
      );
    }

    // Record the claim
    const transferResult = await query(
      `INSERT INTO ownership_transfers
       (entity_type, entity_id, from_user_id, to_user_id, transfer_type, reason, transferred_by)
       VALUES ($1, $2, NULL, $3, 'claim', 'Claimed with code', $3)
       RETURNING *`,
      [entityType, entityId, userId]
    );

    await query('COMMIT');

    return transferResult.rows[0];
  } catch (error) {
    await query('ROLLBACK');
    throw error;
  }
};

// Submit a claim request (for entities without claim code)
export const submitClaimRequest = async (
  entityType: EntityType,
  entityId: number,
  claimerId: number,
  claimReason: string,
  verificationInfo?: Record<string, any>
): Promise<OwnershipClaim> => {
  const config = entityConfig[entityType];

  // Verify entity exists and is claimable
  const entityResult = await query(
    `SELECT id, ${config.ownerColumn} as owner_id, is_claimable
     FROM ${config.table} WHERE id = $1`,
    [entityId]
  );

  if (entityResult.rows.length === 0) {
    throw new NotFoundError(`${entityType} not found`);
  }

  const entity = entityResult.rows[0];

  if (entity.owner_id) {
    throw new ConflictError('This entity already has an owner. Contact them to request a transfer.');
  }

  // Check for existing pending claim
  const existingClaim = await query(
    `SELECT id FROM ownership_claims
     WHERE entity_type = $1 AND entity_id = $2 AND claimer_id = $3 AND status = 'pending'`,
    [entityType, entityId, claimerId]
  );

  if (existingClaim.rows.length > 0) {
    throw new ConflictError('You already have a pending claim for this entity');
  }

  // Create claim request
  const result = await query(
    `INSERT INTO ownership_claims
     (entity_type, entity_id, claimer_id, claim_reason, verification_info)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [entityType, entityId, claimerId, claimReason, verificationInfo ? JSON.stringify(verificationInfo) : null]
  );

  return result.rows[0];
};

// Review a claim request (admin only)
export const reviewClaimRequest = async (
  claimId: number,
  reviewerId: number,
  approved: boolean,
  reviewNotes?: string
): Promise<OwnershipClaim> => {
  // Verify reviewer is admin
  const adminCheck = await query(`SELECT role FROM users WHERE id = $1`, [reviewerId]);
  if (adminCheck.rows[0]?.role !== 'admin') {
    throw new ForbiddenError('Only admins can review claims');
  }

  // Get claim
  const claimResult = await query(
    `SELECT * FROM ownership_claims WHERE id = $1`,
    [claimId]
  );

  if (claimResult.rows.length === 0) {
    throw new NotFoundError('Claim not found');
  }

  const claim = claimResult.rows[0];

  if (claim.status !== 'pending') {
    throw new ValidationError('Claim has already been reviewed');
  }

  await query('BEGIN');

  try {
    // Update claim status
    const updateResult = await query(
      `UPDATE ownership_claims
       SET status = $1, reviewed_by = $2, reviewed_at = NOW(), review_notes = $3, updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [approved ? 'approved' : 'rejected', reviewerId, reviewNotes, claimId]
    );

    // If approved, transfer ownership
    if (approved) {
      const config = entityConfig[claim.entity_type as EntityType];

      await query(
        `UPDATE ${config.table}
         SET ${config.ownerColumn} = $1, claimed_at = NOW(), is_claimable = false
         WHERE id = $2`,
        [claim.claimer_id, claim.entity_id]
      );

      // Add to membership table if exists
      if (config.membershipTable) {
        await query(
          `INSERT INTO ${config.membershipTable} (${config.membershipEntityColumn}, user_id, role, status)
           VALUES ($1, $2, 'owner', 'active')
           ON CONFLICT (${config.membershipEntityColumn}, user_id)
           DO UPDATE SET role = 'owner', status = 'active'`,
          [claim.entity_id, claim.claimer_id]
        );
      }

      // Record the transfer
      await query(
        `INSERT INTO ownership_transfers
         (entity_type, entity_id, from_user_id, to_user_id, transfer_type, reason, transferred_by)
         VALUES ($1, $2, NULL, $3, 'claim', $4, $5)`,
        [claim.entity_type, claim.entity_id, claim.claimer_id, `Claim approved: ${reviewNotes || ''}`, reviewerId]
      );
    }

    await query('COMMIT');

    return updateResult.rows[0];
  } catch (error) {
    await query('ROLLBACK');
    throw error;
  }
};

// Get pending claims (admin)
export const getPendingClaims = async (
  entityType?: EntityType
): Promise<(OwnershipClaim & { entity_name: string; claimer_name: string })[]> => {
  let queryStr = `
    SELECT oc.*, u.name as claimer_name
    FROM ownership_claims oc
    JOIN users u ON oc.claimer_id = u.id
    WHERE oc.status = 'pending'
  `;
  const params: any[] = [];

  if (entityType) {
    params.push(entityType);
    queryStr += ` AND oc.entity_type = $${params.length}`;
  }

  queryStr += ` ORDER BY oc.created_at ASC`;

  const result = await query(queryStr, params);

  // Fetch entity names
  const claims = await Promise.all(
    result.rows.map(async (claim) => {
      const config = entityConfig[claim.entity_type as EntityType];
      const entityResult = await query(
        `SELECT ${config.nameColumn} as name FROM ${config.table} WHERE id = $1`,
        [claim.entity_id]
      );
      return {
        ...claim,
        entity_name: entityResult.rows[0]?.name || 'Unknown'
      };
    })
  );

  return claims;
};

// Get transfer history for an entity
export const getTransferHistory = async (
  entityType: EntityType,
  entityId: number
): Promise<(OwnershipTransfer & { from_user_name?: string; to_user_name: string })[]> => {
  const result = await query(
    `SELECT ot.*,
            fu.name as from_user_name,
            tu.name as to_user_name,
            tb.name as transferred_by_name
     FROM ownership_transfers ot
     LEFT JOIN users fu ON ot.from_user_id = fu.id
     JOIN users tu ON ot.to_user_id = tu.id
     LEFT JOIN users tb ON ot.transferred_by = tb.id
     WHERE ot.entity_type = $1 AND ot.entity_id = $2
     ORDER BY ot.created_at DESC`,
    [entityType, entityId]
  );

  return result.rows;
};

// Generate new claim code for entity (admin or owner)
export const regenerateClaimCode = async (
  entityType: EntityType,
  entityId: number,
  userId: number
): Promise<string> => {
  const ownership = await checkOwnership(entityType, entityId, userId);

  if (!ownership.isAdmin) {
    throw new ForbiddenError('Only owners or admins can generate claim codes');
  }

  const config = entityConfig[entityType];
  const newCode = generateClaimCode();

  await query(
    `UPDATE ${config.table} SET claim_code = $1, is_claimable = true WHERE id = $2`,
    [newCode, entityId]
  );

  return newCode;
};

// Get entities owned by user
export const getOwnedEntities = async (
  userId: number,
  entityType?: EntityType
): Promise<{ type: EntityType; id: number; name: string; claimed_at?: string }[]> => {
  const results: { type: EntityType; id: number; name: string; claimed_at?: string }[] = [];

  const types = entityType ? [entityType] : Object.keys(entityConfig) as EntityType[];

  for (const type of types) {
    const config = entityConfig[type];
    const result = await query(
      `SELECT id, ${config.nameColumn} as name, claimed_at
       FROM ${config.table}
       WHERE ${config.ownerColumn} = $1`,
      [userId]
    );

    results.push(...result.rows.map(row => ({
      type,
      id: row.id,
      name: row.name,
      claimed_at: row.claimed_at
    })));
  }

  return results;
};

// Get unclaimed entities (for admin view)
export const getUnclaimedEntities = async (
  entityType?: EntityType
): Promise<{ type: EntityType; id: number; name: string; claim_code?: string; created_at: string }[]> => {
  const results: { type: EntityType; id: number; name: string; claim_code?: string; created_at: string }[] = [];

  const types = entityType ? [entityType] : Object.keys(entityConfig) as EntityType[];

  for (const type of types) {
    const config = entityConfig[type];
    const result = await query(
      `SELECT id, ${config.nameColumn} as name, claim_code, created_at
       FROM ${config.table}
       WHERE ${config.ownerColumn} IS NULL AND is_claimable = true`,
      []
    );

    results.push(...result.rows.map(row => ({
      type,
      id: row.id,
      name: row.name,
      claim_code: row.claim_code,
      created_at: row.created_at
    })));
  }

  return results;
};
