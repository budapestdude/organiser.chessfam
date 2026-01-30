import api from './client';

export interface ChessTitleVerificationSubmission {
  claimed_title: 'GM' | 'IM' | 'FM' | 'CM' | 'WGM' | 'WIM' | 'WFM' | 'WCM';
  fide_id?: string;
  certificate_image: string;
}

export interface ChessTitleVerification {
  id: number;
  user_id: number;
  status: 'pending' | 'approved' | 'rejected' | 'revoked';
  claimed_title: string;
  fide_id?: string;
  certificate_image: string;
  reviewed_by?: number;
  reviewed_at?: string;
  rejection_reason?: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ChessTitleVerificationStatus {
  chess_title_verified: boolean;
  chess_title_verified_at?: string;
  chess_title_verified_by?: number;
  latest_submission?: ChessTitleVerification;
}

export interface ChessTitleVerificationCheck {
  has_pending: boolean;
  is_verified: boolean;
  can_submit: boolean;
}

export const chessTitleVerificationApi = {
  // Submit chess title verification
  submitVerification: (data: ChessTitleVerificationSubmission) =>
    api.post('/chess-title-verification/submit', data),

  // Get user's chess title verification status
  getStatus: () =>
    api.get<{ data: ChessTitleVerificationStatus }>('/chess-title-verification/status'),

  // Check if chess title verification is required
  checkRequired: () =>
    api.get<{ data: ChessTitleVerificationCheck }>('/chess-title-verification/check'),
};

export default chessTitleVerificationApi;
