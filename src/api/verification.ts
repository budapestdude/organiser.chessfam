import api from './client';

export interface VerificationSubmission {
  full_name: string;
  date_of_birth: string;
  country: string;
  id_type: 'passport' | 'drivers_license' | 'national_id';
  id_number?: string;
  id_front_image: string;
  id_back_image?: string;
  selfie_image: string;
}

export interface VerificationStatus {
  is_verified: boolean;
  verification?: {
    id: number;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    reviewed_at?: string;
    rejection_reason?: string;
  };
}

export interface VerificationCheck {
  is_verified: boolean;
  has_pending_verification: boolean;
  verification_required: boolean;
}

export const verificationApi = {
  // Submit identity verification
  submitVerification: (data: VerificationSubmission) =>
    api.post('/verification/submit', data),

  // Get user's verification status
  getStatus: () =>
    api.get<VerificationStatus>('/verification/status'),

  // Check if verification is required
  checkRequired: () =>
    api.get<VerificationCheck>('/verification/check'),
};

export default verificationApi;
