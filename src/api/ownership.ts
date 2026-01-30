import apiClient from './client';

export type EntityType = 'venue' | 'club' | 'tournament' | 'community';

export interface OwnershipInfo {
  id: number;
  name: string;
  owner_id: number | null;
  owner_name?: string;
  claim_code?: string;
  is_claimable: boolean;
  claimed_at?: string;
}

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
  from_user_name?: string;
  to_user_name?: string;
}

export interface OwnershipClaim {
  id: number;
  entity_type: EntityType;
  entity_id: number;
  claimer_id: number;
  claimer_name?: string;
  entity_name?: string;
  status: 'pending' | 'approved' | 'rejected';
  claim_reason?: string;
  verification_info?: Record<string, any>;
  reviewed_by?: number;
  reviewed_at?: string;
  review_notes?: string;
  created_at: string;
}

export interface OwnedEntity {
  type: EntityType;
  id: number;
  name: string;
  claimed_at?: string;
}

export interface UnclaimedEntity {
  type: EntityType;
  id: number;
  name: string;
  claim_code?: string;
  created_at: string;
}

export const ownershipApi = {
  // Get ownership info for an entity
  getOwnership: async (entityType: EntityType, entityId: number): Promise<OwnershipInfo> => {
    const response = await apiClient.get(`/ownership/${entityType}/${entityId}`);
    return response.data.data;
  },

  // Transfer ownership to another user
  transferOwnership: async (
    entityType: EntityType,
    entityId: number,
    newOwnerId: number,
    reason?: string
  ): Promise<OwnershipTransfer> => {
    const response = await apiClient.post(`/ownership/${entityType}/${entityId}/transfer`, {
      newOwnerId,
      reason
    });
    return response.data.data;
  },

  // Claim ownership with a claim code
  claimWithCode: async (
    entityType: EntityType,
    entityId: number,
    claimCode: string
  ): Promise<OwnershipTransfer> => {
    const response = await apiClient.post(`/ownership/${entityType}/${entityId}/claim`, {
      claimCode
    });
    return response.data.data;
  },

  // Submit a claim request (for admin review)
  submitClaimRequest: async (
    entityType: EntityType,
    entityId: number,
    claimReason: string,
    verificationInfo?: Record<string, any>
  ): Promise<OwnershipClaim> => {
    const response = await apiClient.post(`/ownership/${entityType}/${entityId}/claim-request`, {
      claimReason,
      verificationInfo
    });
    return response.data.data;
  },

  // Get transfer history for an entity
  getTransferHistory: async (
    entityType: EntityType,
    entityId: number
  ): Promise<OwnershipTransfer[]> => {
    const response = await apiClient.get(`/ownership/${entityType}/${entityId}/history`);
    return response.data.data;
  },

  // Get entities owned by current user
  getMyEntities: async (entityType?: EntityType): Promise<OwnedEntity[]> => {
    const params = entityType ? `?entityType=${entityType}` : '';
    const response = await apiClient.get(`/ownership/my-entities${params}`);
    return response.data.data;
  },

  // Regenerate claim code (owner or admin)
  regenerateClaimCode: async (
    entityType: EntityType,
    entityId: number
  ): Promise<{ claimCode: string }> => {
    const response = await apiClient.post(`/ownership/${entityType}/${entityId}/regenerate-code`);
    return response.data.data;
  },

  // ============ ADMIN ENDPOINTS ============

  // Get all pending claims (admin)
  getPendingClaims: async (entityType?: EntityType): Promise<OwnershipClaim[]> => {
    const params = entityType ? `?entityType=${entityType}` : '';
    const response = await apiClient.get(`/ownership/admin/pending-claims${params}`);
    return response.data.data;
  },

  // Get all unclaimed entities (admin)
  getUnclaimedEntities: async (entityType?: EntityType): Promise<UnclaimedEntity[]> => {
    const params = entityType ? `?entityType=${entityType}` : '';
    const response = await apiClient.get(`/ownership/admin/unclaimed${params}`);
    return response.data.data;
  },

  // Review a claim request (admin)
  reviewClaimRequest: async (
    claimId: number,
    approved: boolean,
    reviewNotes?: string
  ): Promise<OwnershipClaim> => {
    const response = await apiClient.post(`/ownership/admin/claims/${claimId}/review`, {
      approved,
      reviewNotes
    });
    return response.data.data;
  },

  // Mark entity as unclaimed (admin)
  markAsUnclaimed: async (
    entityType: EntityType,
    entityId: number
  ): Promise<{ claimCode: string }> => {
    const response = await apiClient.post(`/ownership/admin/${entityType}/${entityId}/mark-unclaimed`);
    return response.data.data;
  }
};

export default ownershipApi;
