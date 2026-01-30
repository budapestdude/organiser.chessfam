export interface CreateClubMembershipRequest {
  club_id: number;
  member_name: string;
  member_rating?: number;
  member_email: string;
  member_phone?: string;
  membership_fee: number;
  membership_type: 'monthly' | 'yearly' | 'lifetime';
  notes?: string;
}

export interface ClubMembership {
  id: number;
  user_id: number;
  club_id: number;
  role: 'member' | 'officer' | 'admin' | 'owner';
  joined_at: Date;
  status: 'active' | 'inactive' | 'banned';
  membership_type?: 'monthly' | 'yearly' | 'lifetime';
  payment_status?: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_id?: number | null;
  updated_at?: Date;
}

export interface ClubMembershipWithDetails extends ClubMembership {
  club_name?: string;
  club_location?: string;
}
