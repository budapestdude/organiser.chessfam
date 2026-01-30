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
  member_name: string;
  member_rating: number | null;
  member_email: string;
  member_phone: string | null;
  membership_fee: number;
  membership_type: string;
  status: string;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ClubMembershipWithDetails extends ClubMembership {
  club_name?: string;
  club_location?: string;
}
