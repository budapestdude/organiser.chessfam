import { query } from '../config/database';
import { NotFoundError, ValidationError, ConflictError, ForbiddenError } from '../utils/errors';
import { ProfessionalType } from './professionalsService';

export interface ProfessionalApplication {
  id: number;
  user_id: number;
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
  proposed_services?: any[];
  country?: string;
  city?: string;
  remote_available: boolean;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  admin_notes?: string;
  reviewed_by?: number;
  reviewed_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface ApplicationInput {
  professional_type: ProfessionalType;
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
}

const VALID_PROFESSIONAL_TYPES: ProfessionalType[] = [
  'coach', 'arbiter', 'photographer', 'videographer',
  'analyst', 'commentator', 'influencer', 'writer',
  'dgt_operator', 'programmer', 'editor', 'designer', 'producer'
];

/**
 * Validate professional type
 */
function validateProfessionalType(type: string): void {
  if (!VALID_PROFESSIONAL_TYPES.includes(type as ProfessionalType)) {
    throw new ValidationError(`Invalid professional type: ${type}. Must be one of: ${VALID_PROFESSIONAL_TYPES.join(', ')}`);
  }
}

/**
 * Validate type-specific data based on professional type
 */
function validateTypeSpecificData(type: ProfessionalType, data: any): void {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('type_specific_data must be an object');
  }

  // Type-specific validation
  switch (type) {
    case 'coach':
      if (!data.teaching_experience_years) {
        throw new ValidationError('Coaches must provide teaching_experience_years');
      }
      break;

    case 'arbiter':
      if (!data.fide_arbiter_license && !data.experience_years) {
        throw new ValidationError('Arbiters must provide either FIDE license or experience years');
      }
      break;

    case 'photographer':
    case 'videographer':
      if (!data.equipment || !Array.isArray(data.equipment) || data.equipment.length === 0) {
        throw new ValidationError('Photographers/videographers must list their equipment');
      }
      break;

    // Other types can have more flexible validation
    default:
      break;
  }
}

/**
 * Submit application to become a professional
 */
export async function applyAsProfessional(
  userId: number,
  input: ApplicationInput
): Promise<ProfessionalApplication> {
  // Validate professional type
  validateProfessionalType(input.professional_type);

  // Validate type-specific data
  validateTypeSpecificData(input.professional_type, input.type_specific_data);

  // Check if user already has a professional profile
  const existingPro = await query(
    'SELECT id FROM professionals WHERE user_id = $1',
    [userId]
  );

  if (existingPro.rows.length > 0) {
    throw new ConflictError('You already have a professional profile');
  }

  // Check for existing application (pending or rejected)
  const existingApp = await query(
    'SELECT * FROM professional_applications WHERE user_id = $1 AND professional_type = $2',
    [userId, input.professional_type]
  );

  // If there's a pending application, return it
  if (existingApp.rows.length > 0) {
    const existing = existingApp.rows[0];
    if (existing.status === 'pending') {
      throw new ConflictError('You already have a pending application for this professional type');
    }

    // If rejected, allow updating and resubmitting
    if (existing.status === 'rejected') {
      return updateMyApplication(userId, existing.id, input);
    }
  }

  // Create new application
  const result = await query(
    `INSERT INTO professional_applications (
      user_id, professional_type, name, bio, profile_image,
      type_specific_data, verification_documents, portfolio_urls,
      experience_years, specialties, languages, proposed_services,
      country, city, remote_available, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'pending')
    RETURNING *`,
    [
      userId,
      input.professional_type,
      input.name,
      input.bio || null,
      input.profile_image || null,
      JSON.stringify(input.type_specific_data),
      input.verification_documents || [],
      input.portfolio_urls || [],
      input.experience_years || null,
      input.specialties || [],
      input.languages || [],
      input.proposed_services ? JSON.stringify(input.proposed_services) : [],
      input.country || null,
      input.city || null,
      input.remote_available !== false
    ]
  );

  return result.rows[0];
}

/**
 * Get user's application (current user)
 */
export async function getMyApplication(
  userId: number,
  type?: ProfessionalType
): Promise<ProfessionalApplication | null> {
  let queryText = 'SELECT * FROM professional_applications WHERE user_id = $1';
  const values: any[] = [userId];

  if (type) {
    validateProfessionalType(type);
    queryText += ' AND professional_type = $2';
    values.push(type);
  }

  queryText += ' ORDER BY created_at DESC LIMIT 1';

  const result = await query(queryText, values);
  return result.rows.length > 0 ? result.rows[0] : null;
}

/**
 * Update user's application (only if pending or rejected)
 */
export async function updateMyApplication(
  userId: number,
  applicationId: number,
  data: Partial<ApplicationInput>
): Promise<ProfessionalApplication> {
  // Get existing application
  const existing = await query(
    'SELECT * FROM professional_applications WHERE id = $1 AND user_id = $2',
    [applicationId, userId]
  );

  if (existing.rows.length === 0) {
    throw new NotFoundError('Application not found');
  }

  const application = existing.rows[0];

  // Only allow updating pending or rejected applications
  if (application.status === 'approved') {
    throw new ForbiddenError('Cannot update approved application');
  }

  // If it was rejected, reset to pending
  const newStatus = application.status === 'rejected' ? 'pending' : application.status;

  // Build update query
  const updates: string[] = [];
  const values: any[] = [];
  let paramCounter = 1;

  if (data.name) {
    updates.push(`name = $${paramCounter++}`);
    values.push(data.name);
  }

  if (data.bio !== undefined) {
    updates.push(`bio = $${paramCounter++}`);
    values.push(data.bio);
  }

  if (data.profile_image !== undefined) {
    updates.push(`profile_image = $${paramCounter++}`);
    values.push(data.profile_image);
  }

  if (data.type_specific_data) {
    validateTypeSpecificData(application.professional_type, data.type_specific_data);
    updates.push(`type_specific_data = $${paramCounter++}`);
    values.push(JSON.stringify(data.type_specific_data));
  }

  if (data.verification_documents) {
    updates.push(`verification_documents = $${paramCounter++}`);
    values.push(data.verification_documents);
  }

  if (data.portfolio_urls) {
    updates.push(`portfolio_urls = $${paramCounter++}`);
    values.push(data.portfolio_urls);
  }

  if (data.experience_years !== undefined) {
    updates.push(`experience_years = $${paramCounter++}`);
    values.push(data.experience_years);
  }

  if (data.specialties) {
    updates.push(`specialties = $${paramCounter++}`);
    values.push(data.specialties);
  }

  if (data.languages) {
    updates.push(`languages = $${paramCounter++}`);
    values.push(data.languages);
  }

  if (data.proposed_services) {
    updates.push(`proposed_services = $${paramCounter++}`);
    values.push(JSON.stringify(data.proposed_services));
  }

  if (data.country !== undefined) {
    updates.push(`country = $${paramCounter++}`);
    values.push(data.country);
  }

  if (data.city !== undefined) {
    updates.push(`city = $${paramCounter++}`);
    values.push(data.city);
  }

  if (data.remote_available !== undefined) {
    updates.push(`remote_available = $${paramCounter++}`);
    values.push(data.remote_available);
  }

  if (updates.length === 0) {
    return application;
  }

  updates.push(`status = $${paramCounter++}`);
  values.push(newStatus);

  updates.push(`updated_at = NOW()`);

  if (newStatus === 'pending') {
    updates.push(`rejection_reason = NULL`);
  }

  values.push(applicationId);

  const updateQuery = `
    UPDATE professional_applications
    SET ${updates.join(', ')}
    WHERE id = $${paramCounter}
    RETURNING *
  `;

  const result = await query(updateQuery, values);
  return result.rows[0];
}

// ===== ADMIN FUNCTIONS =====

/**
 * Get pending applications (admin only)
 */
export async function getPendingApplications(filters: {
  professional_type?: ProfessionalType;
  status?: 'pending' | 'approved' | 'rejected';
  page?: number;
  limit?: number;
} = {}): Promise<{ applications: ProfessionalApplication[], total: number }> {
  const {
    professional_type,
    status = 'pending',
    page = 1,
    limit = 20
  } = filters;

  const conditions: string[] = [`status = $1`];
  const values: any[] = [status];
  let paramCounter = 2;

  if (professional_type) {
    validateProfessionalType(professional_type);
    conditions.push(`professional_type = $${paramCounter++}`);
    values.push(professional_type);
  }

  const whereClause = conditions.join(' AND ');

  // Get total count
  const countQuery = `SELECT COUNT(*) as count FROM professional_applications WHERE ${whereClause}`;
  const countResult = await query(countQuery, values);
  const total = parseInt(countResult.rows[0].count);

  // Get paginated results with user info
  const offset = (page - 1) * limit;
  const dataQuery = `
    SELECT
      pa.*,
      u.email as user_email,
      u.username
    FROM professional_applications pa
    LEFT JOIN users u ON pa.user_id = u.id
    WHERE ${whereClause}
    ORDER BY pa.created_at ASC
    LIMIT $${paramCounter++} OFFSET $${paramCounter}
  `;
  values.push(limit, offset);

  const result = await query(dataQuery, values);

  return {
    applications: result.rows,
    total
  };
}

/**
 * Get application by ID (admin only)
 */
export async function getApplicationById(id: number): Promise<ProfessionalApplication> {
  const result = await query(
    `SELECT
      pa.*,
      u.email as user_email,
      u.username
    FROM professional_applications pa
    LEFT JOIN users u ON pa.user_id = u.id
    WHERE pa.id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Application not found');
  }

  return result.rows[0];
}

/**
 * Approve application and create professional profile (admin only)
 */
export async function approveApplication(
  applicationId: number,
  adminId: number
): Promise<any> {
  // Get application
  const app = await getApplicationById(applicationId);

  if (app.status === 'approved') {
    throw new ConflictError('Application already approved');
  }

  // Create professional profile
  const professionalResult = await query(
    `INSERT INTO professionals (
      user_id, professional_type, name, bio, profile_image,
      credentials, verification_documents, experience_years,
      specialties, languages, country, city, remote_available,
      verified
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true)
    RETURNING *`,
    [
      app.user_id,
      app.professional_type,
      app.name,
      app.bio,
      app.profile_image,
      app.type_specific_data,
      app.verification_documents || [],
      app.experience_years,
      app.specialties || [],
      app.languages || [],
      app.country,
      app.city,
      app.remote_available
    ]
  );

  const professional = professionalResult.rows[0];

  // Create services from proposed_services
  if (app.proposed_services && app.proposed_services.length > 0) {
    for (const service of app.proposed_services) {
      await query(
        `INSERT INTO professional_services (
          professional_id, service_name, service_description,
          pricing_model, base_price, currency
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          professional.id,
          service.service_name,
          service.service_description || null,
          service.pricing_model,
          service.base_price || null,
          service.currency || 'USD'
        ]
      );
    }
  }

  // Update user record
  await query(
    'UPDATE users SET is_professional = true, professional_id = $1 WHERE id = $2',
    [professional.id, app.user_id]
  );

  // Update application status
  await query(
    `UPDATE professional_applications
    SET status = 'approved', reviewed_by = $1, reviewed_at = NOW()
    WHERE id = $2`,
    [adminId, applicationId]
  );

  return professional;
}

/**
 * Reject application (admin only)
 */
export async function rejectApplication(
  applicationId: number,
  adminId: number,
  reason: string
): Promise<void> {
  if (!reason || reason.trim().length === 0) {
    throw new ValidationError('Rejection reason is required');
  }

  // Check application exists
  const app = await getApplicationById(applicationId);

  if (app.status === 'approved') {
    throw new ConflictError('Cannot reject approved application');
  }

  await query(
    `UPDATE professional_applications
    SET status = 'rejected', rejection_reason = $1, reviewed_by = $2, reviewed_at = NOW()
    WHERE id = $3`,
    [reason, adminId, applicationId]
  );
}
