import api from './client';

// Dashboard
export const getDashboardStats = () => api.get('/admin/dashboard/stats');
export const getRecentActivity = (limit?: number) =>
  api.get('/admin/dashboard/activity', { params: { limit } });

// Users
export const getUsers = (params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: string;
}) => api.get('/admin/users', { params });

export const getUser = (id: number) => api.get(`/admin/users/${id}`);
export const updateUser = (id: number, data: { name?: string; rating?: number; is_admin?: boolean; is_master?: boolean }) =>
  api.put(`/admin/users/${id}`, data);
export const banUser = (id: number, reason: string) =>
  api.post(`/admin/users/${id}/ban`, { reason });
export const unbanUser = (id: number) =>
  api.post(`/admin/users/${id}/unban`);
export const deleteUser = (id: number) =>
  api.delete(`/admin/users/${id}`);

// Reviews
export const getReviews = (params?: { type?: string; page?: number; limit?: number }) =>
  api.get('/admin/reviews', { params });
export const deleteReview = (type: string, id: number) =>
  api.delete(`/admin/reviews/${type}/${id}`);

// Venues
export const getPendingVenues = (params?: { page?: number; limit?: number }) =>
  api.get('/admin/venues/pending', { params });
export const approveVenue = (id: number) =>
  api.post(`/admin/venues/${id}/approve`);
export const rejectVenue = (id: number, reason?: string) =>
  api.post(`/admin/venues/${id}/reject`, { reason });

// Master Applications
export const getPendingMasters = (params?: { page?: number; limit?: number }) =>
  api.get('/admin/masters/pending', { params });
export const approveMaster = (id: number) =>
  api.post(`/admin/masters/${id}/approve`);
export const rejectMaster = (id: number, reason?: string) =>
  api.post(`/admin/masters/${id}/reject`, { reason });

// Ownership Claims
export const getPendingClaims = (params?: { page?: number; limit?: number }) =>
  api.get('/admin/claims/pending', { params });
export const approveClaim = (id: number) =>
  api.post(`/admin/claims/${id}/approve`);
export const rejectClaim = (id: number, reason?: string) =>
  api.post(`/admin/claims/${id}/reject`, { reason });

// Tournament Approvals
export const getPendingTournaments = (params?: { page?: number; limit?: number }) =>
  api.get('/admin/tournaments/pending', { params });
export const approveTournament = (id: number) =>
  api.post(`/admin/tournaments/${id}/approve`);
export const rejectTournament = (id: number, reason?: string) =>
  api.post(`/admin/tournaments/${id}/reject`, { reason });

// Club Approvals
export const getPendingClubs = (params?: { page?: number; limit?: number }) =>
  api.get('/admin/clubs/pending', { params });
export const approveClub = (id: number) =>
  api.post(`/admin/clubs/${id}/approve`);
export const rejectClub = (id: number, reason?: string) =>
  api.post(`/admin/clubs/${id}/reject`, { reason });

// Payments
export const getPayments = (params?: { page?: number; limit?: number; status?: string }) =>
  api.get('/payments/admin', { params });
export const refundPayment = (id: number, amount?: number, reason?: string) =>
  api.post(`/payments/admin/${id}/refund`, { amount, reason });

// Venues Management
export const getAllVenues = (params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}) => api.get('/admin/venues/all', { params });
export const updateVenue = (id: number, data: any) =>
  api.put(`/admin/venues/${id}`, data);
export const deleteVenue = (id: number) =>
  api.delete(`/admin/venues/${id}`);

// Clubs Management
export const getAllClubs = (params?: {
  page?: number;
  limit?: number;
  search?: string;
}) => api.get('/admin/clubs', { params });
export const updateClub = (id: number, data: any) =>
  api.put(`/admin/clubs/${id}`, data);
export const deleteClub = (id: number) =>
  api.delete(`/admin/clubs/${id}`);

// Tournaments Management
export const getAllTournaments = (params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}) => api.get('/admin/tournaments', { params });
export const updateTournament = (id: number, data: any) =>
  api.put(`/admin/tournaments/${id}`, data);
export const deleteTournament = (id: number) =>
  api.delete(`/admin/tournaments/${id}`);

// Festival Management
export const convertToFestival = (tournamentId: number) =>
  api.post(`/tournaments/${tournamentId}/convert-to-festival`);
export const createFestivalEvent = (festivalId: number, data: any) =>
  api.post(`/tournaments/${festivalId}/events`, data);
export const getFestivalEvents = (festivalId: number) =>
  api.get(`/tournaments/${festivalId}/events`);
export const removeFestivalEvent = (eventId: number) =>
  api.delete(`/tournaments/events/${eventId}`);
export const deleteFestival = (festivalId: number) =>
  api.delete(`/tournaments/festivals/${festivalId}`);

// Masters Management
export const getAllMastersAdmin = (params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}) => api.get('/admin/masters/all', { params });
export const updateMasterAdmin = (id: number, data: any) =>
  api.put(`/admin/masters/${id}`, data);
export const deleteMasterAdmin = (id: number) =>
  api.delete(`/admin/masters/${id}`);

// Get all users who are masters
export const getAllMasters = (params?: {
  page?: number;
  limit?: number;
  search?: string;
}) => api.get('/admin/users', { params: { ...params, is_master: true } });

// Identity Verification
export const getPendingVerifications = (params?: { page?: number; limit?: number }) =>
  api.get('/admin/verifications/pending', { params });
export const getVerificationDetails = (id: number) =>
  api.get(`/admin/verifications/${id}`);
export const approveVerification = (id: number, admin_notes?: string) =>
  api.post(`/admin/verifications/${id}/approve`, { admin_notes });
export const rejectVerification = (id: number, reason: string, admin_notes?: string) =>
  api.post(`/admin/verifications/${id}/reject`, { reason, admin_notes });

// Direct user verification (without application)
export const verifyUser = (userId: number, reason?: string) =>
  api.post(`/admin/users/${userId}/verify`, { reason });
export const revokeUserVerification = (userId: number, reason: string) =>
  api.post(`/admin/users/${userId}/revoke-verification`, { reason });

// Chess Title Verification
export const getPendingChessTitleVerifications = (params?: { page?: number; limit?: number }) =>
  api.get('/admin/chess-title-verifications/pending', { params });
export const getChessTitleVerificationDetails = (id: number) =>
  api.get(`/admin/chess-title-verifications/${id}`);
export const approveChessTitleVerification = (id: number, admin_notes?: string) =>
  api.post(`/admin/chess-title-verifications/${id}/approve`, { admin_notes });
export const rejectChessTitleVerification = (id: number, reason: string, admin_notes?: string) =>
  api.post(`/admin/chess-title-verifications/${id}/reject`, { reason, admin_notes });

// Direct chess title verification (without application)
export const verifyUserChessTitle = (userId: number, title: string, reason?: string) =>
  api.post(`/admin/users/${userId}/verify-chess-title`, { title, reason });
export const revokeUserChessTitleVerification = (userId: number, reason?: string) =>
  api.post(`/admin/users/${userId}/revoke-chess-title`, { reason });

// FAQ Management
export const getAllFAQs = (params?: {
  category?: string;
  is_published?: boolean;
  page?: number;
  limit?: number;
}) => api.get('/faq', { params });

export const getFAQ = (id: number) => api.get(`/faq/${id}`);

export const createFAQ = (data: {
  question: string;
  answer: string;
  category?: string;
  display_order?: number;
  is_published?: boolean;
}) => api.post('/faq', data);

export const updateFAQ = (id: number, data: {
  question?: string;
  answer?: string;
  category?: string;
  display_order?: number;
  is_published?: boolean;
}) => api.put(`/faq/${id}`, data);

export const deleteFAQ = (id: number) => api.delete(`/faq/${id}`);

export const reorderFAQs = (faqOrders: { id: number; display_order: number }[]) =>
  api.post('/faq/reorder', { faqOrders });

// Email Templates Management
export const getAllEmailTemplates = (params?: {
  category?: string;
  is_active?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}) => api.get('/email-templates', { params });

export const getEmailTemplate = (id: number) => api.get(`/email-templates/${id}`);

export const getEmailTemplateCategories = () => api.get('/email-templates/categories');

export const createEmailTemplate = (data: {
  template_key: string;
  template_name: string;
  subject: string;
  html_content: string;
  text_content: string;
  variables?: string[];
  category?: string;
  is_active?: boolean;
}) => api.post('/email-templates', data);

export const updateEmailTemplate = (id: number, data: {
  template_name?: string;
  subject?: string;
  html_content?: string;
  text_content?: string;
  variables?: string[];
  category?: string;
  is_active?: boolean;
}) => api.put(`/email-templates/${id}`, data);

export const deleteEmailTemplate = (id: number) => api.delete(`/email-templates/${id}`);

export const duplicateEmailTemplate = (id: number) => api.post(`/email-templates/${id}/duplicate`);

export const previewEmailTemplate = (id: number, sample_variables: Record<string, any>) =>
  api.post(`/email-templates/${id}/preview`, { sample_variables });

// Blog Management
export const getAllBlogs = (params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'draft' | 'published' | 'archived';
  author_id?: number;
}) => api.get('/admin/blogs', { params });

export const updateBlogAdmin = (id: number, data: any) =>
  api.put(`/admin/blogs/${id}`, data);

export const deleteBlogAdmin = (id: number) =>
  api.delete(`/admin/blogs/${id}`);

export const publishBlog = (id: number) =>
  api.post(`/admin/blogs/${id}/publish`);

export const unpublishBlog = (id: number) =>
  api.post(`/admin/blogs/${id}/unpublish`);

export const archiveBlog = (id: number) =>
  api.post(`/admin/blogs/${id}/archive`);

export const approveAuthorApplication = (id: number) =>
  api.post(`/admin/blogs/${id}/approve-author`);

export const rejectAuthorApplication = (id: number, reason?: string) =>
  api.post(`/admin/blogs/${id}/reject-author`, { reason });

export const sendTestEmail = (id: number, test_email: string, sample_variables: Record<string, any>) =>
  api.post(`/email-templates/${id}/test`, { test_email, sample_variables });

// Platform Settings
export const getAllPlatformSettings = () =>
  api.get('/admin/settings');

export const getPremiumDiscountSettings = () =>
  api.get('/admin/settings/premium-discount');

export const updatePremiumDiscountSettings = (discountPercent: number, enabled: boolean) =>
  api.put('/admin/settings/premium-discount', { discountPercent, enabled });
