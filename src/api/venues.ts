import apiClient from './client';

export interface CreateVenueSubmissionRequest {
  venue_name: string;
  venue_type: 'park' | 'cafe' | 'club' | 'community_center' | 'other';
  address: string;
  city: string;
  state?: string;
  country: string;
  postal_code?: string;
  phone?: string;
  email: string;
  website?: string;
  description?: string;
  amenities?: string[];
  opening_hours?: string;
  image_url?: string;
  images?: string[]; // Gallery images
  contact_person_name?: string;
  contact_person_phone?: string;
}

export const venuesApi = {
  // Public methods
  getApprovedVenues: async () => {
    const response = await apiClient.get('/venues/approved');
    return response.data;
  },

  submitVenue: async (data: CreateVenueSubmissionRequest) => {
    const response = await apiClient.post('/venues/submit', data);
    return response.data;
  },

  getUserVenueSubmissions: async () => {
    const response = await apiClient.get('/venues/user');
    return response.data;
  },

  getVenueSubmissionById: async (id: number) => {
    const response = await apiClient.get(`/venues/${id}`);
    return response.data;
  },

  getVenueById: async (id: number) => {
    const response = await apiClient.get(`/venues/${id}/details`);
    return response.data;
  },

  updateVenue: async (id: number, data: Partial<CreateVenueSubmissionRequest>) => {
    const response = await apiClient.put(`/venues/${id}`, data);
    return response.data;
  },

  // Admin methods
  getAllVenueSubmissions: async (status?: string) => {
    const params = status ? { status } : {};
    const response = await apiClient.get('/venues/admin/all', { params });
    return response.data;
  },

  updateVenueStatus: async (id: number, status: string, admin_notes?: string) => {
    const response = await apiClient.patch(`/venues/admin/${id}/status`, {
      status,
      admin_notes
    });
    return response.data;
  }
};
