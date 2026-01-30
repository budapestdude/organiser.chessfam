import apiClient from './client';

export interface Master {
  id: number;
  user_id?: number;
  name: string;
  title: string;
  rating: number;
  price_bullet?: number;
  price_blitz?: number;
  price_rapid?: number;
  price_classical?: number;
  available: boolean;
  bio?: string;
  specialties?: string[];
  experience_years?: number;
  languages?: string[];
  fide_id?: string;
  profile_image?: string;
  user_name?: string;
  user_avatar?: string;
}

export interface MasterApplication {
  id: number;
  user_id: number;
  title: string;
  fide_id?: string;
  lichess_username?: string;
  chesscom_username?: string;
  peak_rating: number;
  current_rating: number;
  price_bullet?: number;
  price_blitz?: number;
  price_rapid?: number;
  price_classical?: number;
  bio?: string;
  specialties?: string[];
  experience_years?: number;
  languages?: string[];
  verification_document?: string;
  profile_image?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateMasterApplicationInput {
  title: string;
  fide_id?: string;
  lichess_username?: string;
  chesscom_username?: string;
  peak_rating: number;
  current_rating: number;
  price_bullet?: number;
  price_blitz?: number;
  price_rapid?: number;
  price_classical?: number;
  bio?: string;
  specialties?: string[];
  experience_years?: number;
  languages?: string[];
  verification_document?: string;
  profile_image?: string;
}

export interface UpdateMasterProfileInput {
  price_bullet?: number;
  price_blitz?: number;
  price_rapid?: number;
  price_classical?: number;
  available?: boolean;
  bio?: string;
  specialties?: string[];
  profile_image?: string;
}

export const mastersApi = {
  // Get all masters with optional filters
  getMasters: async (params?: {
    available?: boolean;
    title?: string;
    min_rating?: number;
    max_price?: number;
    page?: number;
    limit?: number;
  }) => {
    const response = await apiClient.get('/masters', { params });
    return response.data;
  },

  // Get master by ID
  getMasterById: async (id: number) => {
    const response = await apiClient.get(`/masters/${id}`);
    return response.data;
  },

  // Apply to become a master
  applyToBeMaster: async (data: CreateMasterApplicationInput) => {
    const response = await apiClient.post('/masters/apply', data);
    return response.data;
  },

  // Get my application status
  getMyApplication: async () => {
    const response = await apiClient.get('/masters/application/me');
    return response.data;
  },

  // Update my application (if pending or rejected)
  updateMyApplication: async (data: Partial<CreateMasterApplicationInput>) => {
    const response = await apiClient.put('/masters/application/me', data);
    return response.data;
  },

  // Get my master profile (if approved)
  getMyMasterProfile: async () => {
    const response = await apiClient.get('/masters/profile/me');
    return response.data;
  },

  // Update my master profile (if approved)
  updateMyMasterProfile: async (data: UpdateMasterProfileInput) => {
    const response = await apiClient.put('/masters/profile/me', data);
    return response.data;
  },

  // Admin: Get pending applications
  getPendingApplications: async (page: number = 1, limit: number = 20) => {
    const response = await apiClient.get('/masters/admin/applications', {
      params: { page, limit }
    });
    return response.data;
  },

  // Admin: Approve application
  approveApplication: async (applicationId: number) => {
    const response = await apiClient.post(`/masters/admin/applications/${applicationId}/approve`);
    return response.data;
  },

  // Admin: Reject application
  rejectApplication: async (applicationId: number, reason: string) => {
    const response = await apiClient.post(`/masters/admin/applications/${applicationId}/reject`, { reason });
    return response.data;
  },
};
