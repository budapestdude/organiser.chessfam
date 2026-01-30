import api from './client';

export const professionalsApi = {
  // ===== PUBLIC ENDPOINTS =====

  /**
   * Get all professionals with filtering and pagination
   */
  getProfessionals: (params?: {
    professional_type?: string;
    country?: string;
    city?: string;
    remote_available?: boolean;
    specialties?: string[];
    min_rating?: number;
    verified?: boolean;
    available?: boolean;
    featured?: boolean;
    page?: number;
    limit?: number;
    sort_by?: 'rating' | 'experience' | 'reviews' | 'name';
    sort_order?: 'asc' | 'desc';
  }) => api.get('/professionals', { params }),

  /**
   * Get all professional types
   */
  getProfessionalTypes: () => api.get('/professionals/types'),

  /**
   * Get professional by ID
   */
  getProfessionalById: (id: number) => api.get(`/professionals/${id}`),

  /**
   * Get services for a professional
   */
  getProfessionalServices: (id: number) => api.get(`/professionals/${id}/services`),

  /**
   * Get reviews for a professional
   */
  getProfessionalReviews: (id: number, params?: { page?: number; limit?: number }) =>
    api.get(`/professionals/${id}/reviews`, { params }),

  /**
   * Search professionals by name or bio
   */
  searchProfessionals: (query: string, params?: {
    professional_type?: string;
    page?: number;
    limit?: number;
  }) => api.get('/professionals/search', { params: { q: query, ...params } }),

  /**
   * Get featured professionals
   */
  getFeaturedProfessionals: (params?: { type?: string; limit?: number }) =>
    api.get('/professionals/featured', { params }),

  // ===== AUTHENTICATED USER ENDPOINTS =====

  /**
   * Apply to become a professional
   */
  applyAsProfessional: (data: {
    professional_type: string;
    name: string;
    bio?: string;
    profile_image?: string;
    type_specific_data: any;
    verification_documents?: string[];
    portfolio_urls?: string[];
    experience_years?: number;
    specialties?: string[];
    languages?: string[];
    proposed_services?: {
      service_name: string;
      service_description?: string;
      pricing_model: 'hourly' | 'per_event' | 'per_day' | 'custom_quote';
      base_price?: number;
    }[];
    country?: string;
    city?: string;
    remote_available?: boolean;
  }) => api.post('/professionals/apply', data),

  /**
   * Get my application status
   */
  getMyApplication: (type?: string) =>
    api.get('/professionals/application/me', { params: type ? { type } : {} }),

  /**
   * Update my application
   */
  updateMyApplication: (data: {
    application_id: number;
    [key: string]: any;
  }) => api.put('/professionals/application/me', data),

  /**
   * Get my professional profile
   */
  getMyProfessionalProfile: () => api.get('/professionals/profile/me'),

  /**
   * Update my professional profile
   */
  updateMyProfessionalProfile: (data: {
    bio?: string;
    profile_image?: string;
    specialties?: string[];
    languages?: string[];
    country?: string;
    city?: string;
    remote_available?: boolean;
    onsite_available?: boolean;
    available?: boolean;
  }) => api.put('/professionals/profile/me', data),

  /**
   * Update my services
   */
  updateMyServices: (services: {
    service_name: string;
    service_description?: string;
    pricing_model: 'hourly' | 'per_event' | 'per_day' | 'custom_quote';
    base_price?: number;
    currency?: string;
  }[]) => api.put('/professionals/services/me', { services }),

  /**
   * Get my professional stats
   */
  getMyProfessionalStats: () => api.get('/professionals/stats/me'),

  // ===== ADMIN ENDPOINTS =====

  /**
   * Get pending applications (admin only)
   */
  getPendingApplications: (params?: {
    professional_type?: string;
    status?: 'pending' | 'approved' | 'rejected';
    page?: number;
    limit?: number;
  }) => api.get('/professionals/admin/applications', { params }),

  /**
   * Get application by ID (admin only)
   */
  getApplicationById: (id: number) => api.get(`/professionals/admin/applications/${id}`),

  /**
   * Approve application (admin only)
   */
  approveApplication: (id: number) =>
    api.post(`/professionals/admin/applications/${id}/approve`),

  /**
   * Reject application (admin only)
   */
  rejectApplication: (id: number, reason: string) =>
    api.post(`/professionals/admin/applications/${id}/reject`, { reason }),

  // ===== BOOKING ENDPOINTS =====

  /**
   * Create a new booking
   */
  createBooking: (data: {
    professional_id: number;
    service_id?: number;
    service_name: string;
    pricing_model: string;
    booking_date?: string;
    booking_time?: string;
    duration_hours?: number;
    location_type?: 'online' | 'onsite';
    quantity?: number;
    unit_price?: number;
    total_price: number;
    notes?: string;
  }) => api.post('/professionals/bookings', data),

  /**
   * Get my bookings
   */
  getMyBookings: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get('/professionals/bookings/me', { params }),

  /**
   * Get booking by ID
   */
  getBookingById: (id: number) => api.get(`/professionals/bookings/${id}`),

  /**
   * Update booking status
   */
  updateBookingStatus: (id: number, status: string) =>
    api.put(`/professionals/bookings/${id}/status`, { status }),

  /**
   * Complete booking
   */
  completeBooking: (id: number) => api.post(`/professionals/bookings/${id}/complete`),

  /**
   * Cancel booking
   */
  cancelBooking: (id: number) => api.post(`/professionals/bookings/${id}/cancel`),

  /**
   * Get professional's bookings (professional owner only)
   */
  getProfessionalBookings: (id: number, params?: { status?: string; page?: number; limit?: number }) =>
    api.get(`/professionals/${id}/bookings`, { params }),

  // ===== REVIEW ENDPOINTS =====

  /**
   * Create a review
   */
  createReview: (data: {
    professional_id: number;
    booking_id?: number;
    rating: number;
    comment?: string;
  }) => api.post('/professionals/reviews', data),

  /**
   * Get reviews for a professional (already exists but keeping for consistency)
   */
  // getProfessionalReviews already defined above

  /**
   * Get rating breakdown for a professional
   */
  getRatingBreakdown: (id: number) => api.get(`/professionals/${id}/reviews/breakdown`),

  /**
   * Check if user can review a professional
   */
  canUserReview: (id: number) => api.get(`/professionals/${id}/can-review`),

  /**
   * Delete a review (admin only)
   */
  deleteReview: (id: number) => api.delete(`/professionals/reviews/${id}`),
};

export default professionalsApi;
