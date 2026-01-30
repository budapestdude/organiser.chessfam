import { query } from '../config/database';
import { NotFoundError, ValidationError, ForbiddenError } from '../utils/errors';

export type ProfessionalType =
  | 'coach' | 'arbiter' | 'photographer' | 'videographer'
  | 'analyst' | 'commentator' | 'influencer' | 'writer'
  | 'dgt_operator' | 'programmer' | 'editor' | 'designer' | 'producer';

export interface Professional {
  id: number;
  user_id: number;
  professional_type: ProfessionalType;
  name: string;
  bio?: string;
  profile_image?: string;
  credentials?: any;
  verification_documents?: string[];
  experience_years?: number;
  specialties?: string[];
  languages?: string[];
  country?: string;
  city?: string;
  remote_available: boolean;
  onsite_available: boolean;
  available: boolean;
  verified: boolean;
  featured: boolean;
  total_bookings: number;
  total_reviews: number;
  average_rating: number;
  created_at: Date;
  updated_at: Date;
}

export interface ProfessionalService {
  id: number;
  professional_id: number;
  service_name: string;
  service_description?: string;
  pricing_model: 'hourly' | 'per_event' | 'per_day' | 'custom_quote';
  base_price?: number;
  currency: string;
  available: boolean;
  created_at: Date;
}

export interface ProfessionalFilters {
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
}

const VALID_PROFESSIONAL_TYPES: ProfessionalType[] = [
  'coach', 'arbiter', 'photographer', 'videographer',
  'analyst', 'commentator', 'influencer', 'writer',
  'dgt_operator', 'programmer', 'editor', 'designer', 'producer'
];

// Helper to validate professional type
function validateProfessionalType(type: string): void {
  if (!VALID_PROFESSIONAL_TYPES.includes(type as ProfessionalType)) {
    throw new ValidationError(`Invalid professional type: ${type}`);
  }
}

/**
 * Get all professionals with optional filtering, pagination, and sorting
 */
export async function getProfessionals(filters: ProfessionalFilters = {}): Promise<{ professionals: Professional[], total: number }> {
  const {
    professional_type,
    country,
    city,
    remote_available,
    specialties,
    min_rating,
    verified,
    available = true,
    featured,
    page = 1,
    limit = 20,
    sort_by = 'rating',
    sort_order = 'desc'
  } = filters;

  // Build WHERE clause
  const conditions: string[] = [];
  const values: any[] = [];
  let paramCounter = 1;

  // Apply filters
  if (professional_type) {
    validateProfessionalType(professional_type);
    conditions.push(`professional_type = $${paramCounter++}`);
    values.push(professional_type);
  }

  if (country) {
    conditions.push(`country = $${paramCounter++}`);
    values.push(country);
  }

  if (city) {
    conditions.push(`city = $${paramCounter++}`);
    values.push(city);
  }

  if (remote_available !== undefined) {
    conditions.push(`remote_available = $${paramCounter++}`);
    values.push(remote_available);
  }

  if (specialties && specialties.length > 0) {
    conditions.push(`specialties && $${paramCounter++}`);
    values.push(specialties);
  }

  if (min_rating !== undefined) {
    conditions.push(`average_rating >= $${paramCounter++}`);
    values.push(min_rating);
  }

  if (verified !== undefined) {
    conditions.push(`verified = $${paramCounter++}`);
    values.push(verified);
  }

  if (available !== undefined) {
    conditions.push(`available = $${paramCounter++}`);
    values.push(available);
  }

  if (featured !== undefined) {
    conditions.push(`featured = $${paramCounter++}`);
    values.push(featured);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Build ORDER BY clause
  let orderByClause = '';
  switch (sort_by) {
    case 'rating':
      orderByClause = `ORDER BY average_rating ${sort_order.toUpperCase()}, total_reviews DESC`;
      break;
    case 'experience':
      orderByClause = `ORDER BY experience_years ${sort_order.toUpperCase()}, average_rating DESC`;
      break;
    case 'reviews':
      orderByClause = `ORDER BY total_reviews ${sort_order.toUpperCase()}, average_rating DESC`;
      break;
    case 'name':
      orderByClause = `ORDER BY name ${sort_order.toUpperCase()}`;
      break;
    default:
      orderByClause = 'ORDER BY average_rating DESC, total_reviews DESC';
  }

  // Get total count
  const countQuery = `SELECT COUNT(*) as count FROM professionals ${whereClause}`;
  const countResult = await query(countQuery, values);
  const total = parseInt(countResult.rows[0].count);

  // Get paginated results
  const offset = (page - 1) * limit;
  const dataQuery = `
    SELECT * FROM professionals
    ${whereClause}
    ${orderByClause}
    LIMIT $${paramCounter++} OFFSET $${paramCounter}
  `;
  values.push(limit, offset);

  const result = await query(dataQuery, values);

  return {
    professionals: result.rows,
    total
  };
}

/**
 * Get a professional by ID
 */
export async function getProfessionalById(id: number): Promise<Professional> {
  const result = await query(
    'SELECT * FROM professionals WHERE id = $1',
    [id]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError(`Professional with ID ${id} not found`);
  }

  return result.rows[0];
}

/**
 * Get a professional by user ID
 */
export async function getProfessionalByUserId(userId: number): Promise<Professional | null> {
  const result = await query(
    'SELECT * FROM professionals WHERE user_id = $1',
    [userId]
  );

  return result.rows.length > 0 ? result.rows[0] : null;
}

/**
 * Get professionals by type with filtering
 */
export async function getProfessionalsByType(
  type: ProfessionalType,
  filters: Omit<ProfessionalFilters, 'professional_type'> = {}
): Promise<Professional[]> {
  validateProfessionalType(type);

  const { professionals } = await getProfessionals({
    ...filters,
    professional_type: type
  });

  return professionals;
}

/**
 * Get services for a professional
 */
export async function getProfessionalServices(professionalId: number): Promise<ProfessionalService[]> {
  const result = await query(
    'SELECT * FROM professional_services WHERE professional_id = $1 AND available = true ORDER BY created_at DESC',
    [professionalId]
  );

  return result.rows;
}

/**
 * Update professional profile (for the professional themselves)
 */
export async function updateProfessionalProfile(
  userId: number,
  data: {
    bio?: string;
    profile_image?: string;
    specialties?: string[];
    languages?: string[];
    country?: string;
    city?: string;
    remote_available?: boolean;
    onsite_available?: boolean;
    available?: boolean;
  }
): Promise<Professional> {
  // Get existing professional
  const existing = await getProfessionalByUserId(userId);
  if (!existing) {
    throw new NotFoundError('Professional profile not found');
  }

  const updates: string[] = [];
  const values: any[] = [];
  let paramCounter = 1;

  // Build update query
  if (data.bio !== undefined) {
    updates.push(`bio = $${paramCounter++}`);
    values.push(data.bio);
  }

  if (data.profile_image !== undefined) {
    updates.push(`profile_image = $${paramCounter++}`);
    values.push(data.profile_image);
  }

  if (data.specialties !== undefined) {
    updates.push(`specialties = $${paramCounter++}`);
    values.push(data.specialties);
  }

  if (data.languages !== undefined) {
    updates.push(`languages = $${paramCounter++}`);
    values.push(data.languages);
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

  if (data.onsite_available !== undefined) {
    updates.push(`onsite_available = $${paramCounter++}`);
    values.push(data.onsite_available);
  }

  if (data.available !== undefined) {
    updates.push(`available = $${paramCounter++}`);
    values.push(data.available);
  }

  if (updates.length === 0) {
    return existing;
  }

  updates.push(`updated_at = NOW()`);
  values.push(existing.id);

  const updateQuery = `
    UPDATE professionals
    SET ${updates.join(', ')}
    WHERE id = $${paramCounter}
    RETURNING *
  `;

  const result = await query(updateQuery, values);
  return result.rows[0];
}

/**
 * Update professional services
 */
export async function updateProfessionalServices(
  userId: number,
  services: {
    service_name: string;
    service_description?: string;
    pricing_model: 'hourly' | 'per_event' | 'per_day' | 'custom_quote';
    base_price?: number;
    currency?: string;
  }[]
): Promise<ProfessionalService[]> {
  // Get existing professional
  const professional = await getProfessionalByUserId(userId);
  if (!professional) {
    throw new NotFoundError('Professional profile not found');
  }

  // Delete existing services
  await query('DELETE FROM professional_services WHERE professional_id = $1', [professional.id]);

  // Insert new services
  const insertedServices: ProfessionalService[] = [];

  for (const service of services) {
    const result = await query(
      `INSERT INTO professional_services (
        professional_id, service_name, service_description,
        pricing_model, base_price, currency
      ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        professional.id,
        service.service_name,
        service.service_description || null,
        service.pricing_model,
        service.base_price || null,
        service.currency || 'USD'
      ]
    );

    insertedServices.push(result.rows[0]);
  }

  return insertedServices;
}

/**
 * Get featured professionals (for homepage, etc.)
 */
export async function getFeaturedProfessionals(type?: ProfessionalType, limit: number = 10): Promise<Professional[]> {
  const filters: ProfessionalFilters = {
    featured: true,
    verified: true,
    available: true,
    limit,
    sort_by: 'rating'
  };

  if (type) {
    filters.professional_type = type;
  }

  const { professionals } = await getProfessionals(filters);
  return professionals;
}

/**
 * Search professionals by name or bio
 */
export async function searchProfessionals(
  searchQuery: string,
  filters: ProfessionalFilters = {}
): Promise<{ professionals: Professional[], total: number }> {
  const {
    professional_type,
    page = 1,
    limit = 20
  } = filters;

  const conditions: string[] = ['(name ILIKE $1 OR bio ILIKE $1)'];
  const values: any[] = [`%${searchQuery}%`];
  let paramCounter = 2;

  if (professional_type) {
    validateProfessionalType(professional_type);
    conditions.push(`professional_type = $${paramCounter++}`);
    values.push(professional_type);
  }

  conditions.push('verified = true');
  conditions.push('available = true');

  const whereClause = conditions.join(' AND ');

  // Get total count
  const countQuery = `SELECT COUNT(*) as count FROM professionals WHERE ${whereClause}`;
  const countResult = await query(countQuery, values);
  const total = parseInt(countResult.rows[0].count);

  // Get paginated results
  const offset = (page - 1) * limit;
  const dataQuery = `
    SELECT * FROM professionals
    WHERE ${whereClause}
    ORDER BY average_rating DESC, total_reviews DESC
    LIMIT $${paramCounter++} OFFSET $${paramCounter}
  `;
  values.push(limit, offset);

  const result = await query(dataQuery, values);

  return {
    professionals: result.rows,
    total
  };
}

/**
 * Get professional stats (for dashboard)
 */
export async function getProfessionalStats(userId: number): Promise<{
  total_bookings: number;
  completed_bookings: number;
  pending_bookings: number;
  total_reviews: number;
  average_rating: number;
}> {
  const professional = await getProfessionalByUserId(userId);
  if (!professional) {
    throw new NotFoundError('Professional profile not found');
  }

  // Get booking stats
  const bookingStats = await query(
    `SELECT
      COUNT(*) FILTER (WHERE status = 'completed') as completed_bookings,
      COUNT(*) FILTER (WHERE status = 'pending' OR status = 'confirmed') as pending_bookings,
      COUNT(*) as total_bookings
    FROM professional_bookings
    WHERE professional_id = $1`,
    [professional.id]
  );

  return {
    total_bookings: professional.total_bookings,
    completed_bookings: parseInt(bookingStats.rows[0].completed_bookings || '0'),
    pending_bookings: parseInt(bookingStats.rows[0].pending_bookings || '0'),
    total_reviews: professional.total_reviews,
    average_rating: professional.average_rating
  };
}
