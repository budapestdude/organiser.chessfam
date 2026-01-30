import { query } from '../config/database';
import { NotFoundError, ValidationError, ForbiddenError, ConflictError } from '../utils/errors';

// Helper to check if masters table exists
let tableExists: boolean | null = null;

async function checkTableExists(): Promise<boolean> {
  if (tableExists !== null) return tableExists;

  try {
    await query(`SELECT 1 FROM masters LIMIT 1`);
    tableExists = true;
    return true;
  } catch (error: any) {
    if (error.code === '42P01') { // Table doesn't exist
      console.warn('Masters table not found. Run the appropriate migration.');
      tableExists = false;
      return false;
    }
    throw error;
  }
}

// Mock data when table doesn't exist
const mockMasters: Master[] = [
  {
    id: 1,
    name: 'GM Magnus Carlsen',
    title: 'GM',
    rating: 2830,
    price_bullet: 150,
    price_blitz: 200,
    price_rapid: 300,
    price_classical: 500,
    available: true,
    bio: 'World Chess Champion',
    specialties: ['endgame', 'positional play'],
    experience_years: 20,
    languages: ['English', 'Norwegian'],
    profile_image: 'https://images.unsplash.com/photo-1560174038-da43ac74f01b?w=400',
    created_at: new Date(),
  },
  {
    id: 2,
    name: 'IM Alexandra Botez',
    title: 'IM',
    rating: 2100,
    price_bullet: 75,
    price_blitz: 100,
    price_rapid: 150,
    price_classical: 250,
    available: true,
    bio: 'Twitch streamer and chess educator',
    specialties: ['tactics', 'opening preparation'],
    experience_years: 15,
    languages: ['English', 'Romanian'],
    profile_image: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=400',
    created_at: new Date(),
  },
];

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
  premium_discount_eligible?: boolean; // Staff-managed: true if 10% discount applies for premium members
  created_at: Date;
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
  status: string;
  rejection_reason?: string;
  reviewed_by?: number;
  reviewed_at?: Date;
  created_at: Date;
  updated_at: Date;
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

const validTitles = ['GM', 'IM', 'FM', 'NM', 'CM', 'WGM', 'WIM', 'WFM', 'WNM', 'WCM', 'Expert', 'Coach'];

export const getMasters = async (filters: {
  available?: boolean;
  title?: string;
  min_rating?: number;
  max_price?: number;
  page?: number;
  limit?: number;
}): Promise<{ masters: Master[]; total: number }> => {
  // Return mock data if table doesn't exist
  if (!(await checkTableExists())) {
    return { masters: mockMasters, total: mockMasters.length };
  }

  const { available = true, title, min_rating, max_price, page = 1, limit = 20 } = filters;
  const offset = (page - 1) * limit;

  let whereClause = 'WHERE 1=1';
  const params: any[] = [];
  let paramIndex = 1;

  if (available !== undefined) {
    whereClause += ` AND m.available = $${paramIndex++}`;
    params.push(available);
  }

  if (title) {
    whereClause += ` AND m.title = $${paramIndex++}`;
    params.push(title);
  }

  if (min_rating) {
    whereClause += ` AND m.rating >= $${paramIndex++}`;
    params.push(min_rating);
  }

  if (max_price) {
    whereClause += ` AND (m.price_rapid <= $${paramIndex} OR m.price_blitz <= $${paramIndex} OR m.price_bullet <= $${paramIndex} OR m.price_classical <= $${paramIndex++})`;
    params.push(max_price);
  }

  const countResult = await query(
    `SELECT COUNT(*) FROM masters m ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].count);

  const result = await query(
    `SELECT m.*, u.name as user_name, u.avatar as user_avatar
     FROM masters m
     LEFT JOIN users u ON m.user_id = u.id
     ${whereClause}
     ORDER BY m.rating DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    [...params, limit, offset]
  );

  return { masters: result.rows, total };
};

export const getMasterById = async (id: number): Promise<Master> => {
  const result = await query(
    `SELECT m.*, u.name as user_name, u.email as user_email, u.avatar as user_avatar
     FROM masters m
     LEFT JOIN users u ON m.user_id = u.id
     WHERE m.id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Master not found');
  }

  return result.rows[0];
};

export const applyToBeMaster = async (
  userId: number,
  input: CreateMasterApplicationInput
): Promise<MasterApplication> => {
  const {
    title,
    fide_id,
    lichess_username,
    chesscom_username,
    peak_rating,
    current_rating,
    price_bullet,
    price_blitz,
    price_rapid,
    price_classical,
    bio,
    specialties,
    experience_years,
    languages,
    verification_document,
    profile_image,
  } = input;

  // Validation
  if (!title || !validTitles.includes(title)) {
    throw new ValidationError(`Invalid title. Must be one of: ${validTitles.join(', ')}`);
  }

  if (!peak_rating || peak_rating < 1000) {
    throw new ValidationError('Peak rating must be at least 1000');
  }

  if (!current_rating || current_rating < 1000) {
    throw new ValidationError('Current rating must be at least 1000');
  }

  // At least one price must be set
  if (!price_bullet && !price_blitz && !price_rapid && !price_classical) {
    throw new ValidationError('At least one pricing option is required');
  }

  // Check if user is already a master
  const userResult = await query(
    `SELECT is_master FROM users WHERE id = $1`,
    [userId]
  );

  if (userResult.rows.length === 0) {
    throw new NotFoundError('User not found');
  }

  if (userResult.rows[0].is_master) {
    throw new ConflictError('You are already a master');
  }

  // Check if there's already a pending application
  const existing = await query(
    `SELECT id, status FROM master_applications WHERE user_id = $1`,
    [userId]
  );

  if (existing.rows.length > 0) {
    if (existing.rows[0].status === 'pending') {
      throw new ConflictError('You already have a pending application');
    }
    if (existing.rows[0].status === 'approved') {
      throw new ConflictError('Your application was already approved');
    }
    // If rejected, allow reapplication by updating
    const result = await query(
      `UPDATE master_applications SET
         title = $1, fide_id = $2, lichess_username = $3, chesscom_username = $4,
         peak_rating = $5, current_rating = $6, price_bullet = $7, price_blitz = $8,
         price_rapid = $9, price_classical = $10, bio = $11, specialties = $12,
         experience_years = $13, languages = $14, verification_document = $15,
         profile_image = $16, status = 'pending', rejection_reason = NULL,
         reviewed_by = NULL, reviewed_at = NULL, updated_at = NOW()
       WHERE user_id = $17
       RETURNING *`,
      [
        title, fide_id, lichess_username, chesscom_username,
        peak_rating, current_rating, price_bullet, price_blitz,
        price_rapid, price_classical, bio, specialties,
        experience_years, languages, verification_document,
        profile_image, userId
      ]
    );
    return result.rows[0];
  }

  // Create new application
  const result = await query(
    `INSERT INTO master_applications (
       user_id, title, fide_id, lichess_username, chesscom_username,
       peak_rating, current_rating, price_bullet, price_blitz,
       price_rapid, price_classical, bio, specialties,
       experience_years, languages, verification_document, profile_image
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
     RETURNING *`,
    [
      userId, title, fide_id, lichess_username, chesscom_username,
      peak_rating, current_rating, price_bullet, price_blitz,
      price_rapid, price_classical, bio, specialties,
      experience_years, languages, verification_document, profile_image
    ]
  );

  return result.rows[0];
};

export const getMyApplication = async (userId: number): Promise<MasterApplication | null> => {
  const result = await query(
    `SELECT * FROM master_applications WHERE user_id = $1`,
    [userId]
  );

  return result.rows[0] || null;
};

export const updateMyApplication = async (
  userId: number,
  input: Partial<CreateMasterApplicationInput>
): Promise<MasterApplication> => {
  const existing = await getMyApplication(userId);

  if (!existing) {
    throw new NotFoundError('No application found');
  }

  if (existing.status === 'approved') {
    throw new ValidationError('Cannot update an approved application. Update your master profile instead.');
  }

  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  const fields = [
    'title', 'fide_id', 'lichess_username', 'chesscom_username',
    'peak_rating', 'current_rating', 'price_bullet', 'price_blitz',
    'price_rapid', 'price_classical', 'bio', 'specialties',
    'experience_years', 'languages', 'verification_document', 'profile_image'
  ];

  for (const field of fields) {
    if (input[field as keyof CreateMasterApplicationInput] !== undefined) {
      if (field === 'title' && !validTitles.includes(input.title as string)) {
        throw new ValidationError(`Invalid title. Must be one of: ${validTitles.join(', ')}`);
      }
      updates.push(`${field} = $${paramIndex++}`);
      values.push(input[field as keyof CreateMasterApplicationInput]);
    }
  }

  if (updates.length === 0) {
    return existing;
  }

  // Reset to pending if it was rejected
  if (existing.status === 'rejected') {
    updates.push(`status = 'pending'`);
    updates.push(`rejection_reason = NULL`);
    updates.push(`reviewed_by = NULL`);
    updates.push(`reviewed_at = NULL`);
  }

  updates.push(`updated_at = NOW()`);
  values.push(userId);

  const result = await query(
    `UPDATE master_applications SET ${updates.join(', ')} WHERE user_id = $${paramIndex} RETURNING *`,
    values
  );

  return result.rows[0];
};

// Admin functions
export const getPendingApplications = async (
  page: number = 1,
  limit: number = 20
): Promise<{ applications: MasterApplication[]; total: number }> => {
  const offset = (page - 1) * limit;

  const countResult = await query(
    `SELECT COUNT(*) FROM master_applications WHERE status = 'pending'`
  );
  const total = parseInt(countResult.rows[0].count);

  const result = await query(
    `SELECT ma.*, u.name as user_name, u.email as user_email, u.avatar as user_avatar
     FROM master_applications ma
     JOIN users u ON ma.user_id = u.id
     WHERE ma.status = 'pending'
     ORDER BY ma.created_at ASC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  return { applications: result.rows, total };
};

export const approveApplication = async (
  applicationId: number,
  adminId: number
): Promise<Master> => {
  const appResult = await query(
    `SELECT ma.*, u.name as user_name
     FROM master_applications ma
     JOIN users u ON ma.user_id = u.id
     WHERE ma.id = $1`,
    [applicationId]
  );

  if (appResult.rows.length === 0) {
    throw new NotFoundError('Application not found');
  }

  const application = appResult.rows[0];

  if (application.status !== 'pending') {
    throw new ValidationError(`Application is already ${application.status}`);
  }

  // Create master profile
  const masterResult = await query(
    `INSERT INTO masters (
       user_id, name, title, rating, price_bullet, price_blitz,
       price_rapid, price_classical, available, bio, specialties,
       experience_years, languages, fide_id, profile_image
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, $9, $10, $11, $12, $13, $14)
     RETURNING *`,
    [
      application.user_id, application.user_name, application.title,
      application.current_rating, application.price_bullet, application.price_blitz,
      application.price_rapid, application.price_classical, application.bio,
      application.specialties, application.experience_years, application.languages,
      application.fide_id, application.profile_image
    ]
  );

  const master = masterResult.rows[0];

  // Update application status
  await query(
    `UPDATE master_applications SET status = 'approved', reviewed_by = $1, reviewed_at = NOW(), updated_at = NOW()
     WHERE id = $2`,
    [adminId, applicationId]
  );

  // Update user as master
  await query(
    `UPDATE users SET is_master = true, master_id = $1 WHERE id = $2`,
    [master.id, application.user_id]
  );

  return master;
};

export const rejectApplication = async (
  applicationId: number,
  adminId: number,
  reason: string
): Promise<void> => {
  if (!reason || reason.trim().length === 0) {
    throw new ValidationError('Rejection reason is required');
  }

  const result = await query(
    `UPDATE master_applications
     SET status = 'rejected', rejection_reason = $1, reviewed_by = $2, reviewed_at = NOW(), updated_at = NOW()
     WHERE id = $3 AND status = 'pending'
     RETURNING id`,
    [reason, adminId, applicationId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Application not found or already processed');
  }
};

// Master profile management (for approved masters)
export const updateMasterProfile = async (
  userId: number,
  input: {
    price_bullet?: number;
    price_blitz?: number;
    price_rapid?: number;
    price_classical?: number;
    available?: boolean;
    bio?: string;
    specialties?: string[];
    profile_image?: string;
  }
): Promise<Master> => {
  // Get user's master profile
  const userResult = await query(
    `SELECT master_id FROM users WHERE id = $1 AND is_master = true`,
    [userId]
  );

  if (userResult.rows.length === 0 || !userResult.rows[0].master_id) {
    throw new ForbiddenError('You are not a master');
  }

  const masterId = userResult.rows[0].master_id;

  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  const fields = ['price_bullet', 'price_blitz', 'price_rapid', 'price_classical', 'available', 'bio', 'specialties', 'profile_image'];

  for (const field of fields) {
    if (input[field as keyof typeof input] !== undefined) {
      updates.push(`${field} = $${paramIndex++}`);
      values.push(input[field as keyof typeof input]);
    }
  }

  if (updates.length === 0) {
    return getMasterById(masterId);
  }

  values.push(masterId);

  const result = await query(
    `UPDATE masters SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  return result.rows[0];
};

export const getMasterByUserId = async (userId: number): Promise<Master | null> => {
  const result = await query(
    `SELECT m.* FROM masters m
     JOIN users u ON m.id = u.master_id
     WHERE u.id = $1 AND u.is_master = true`,
    [userId]
  );

  return result.rows[0] || null;
};

/**
 * Update master's event availability settings
 */
export const updateMasterEventAvailability = async (
  userId: number,
  data: {
    available_for_events: boolean;
    event_types?: string[];
    event_rate_per_day?: number;
    event_currency?: string;
    event_notes?: string;
  }
): Promise<void> => {
  const tableCheck = await checkTableExists();
  if (!tableCheck) {
    throw new NotFoundError('Masters table not available');
  }

  // First check if user is a master
  const master = await getMasterByUserId(userId);
  if (!master) {
    throw new ForbiddenError('User is not a master');
  }

  // Validate event types if provided
  const validEventTypes = ['tournament', 'league', 'simul', 'exhibition'];
  if (data.event_types) {
    const invalidTypes = data.event_types.filter(type => !validEventTypes.includes(type));
    if (invalidTypes.length > 0) {
      throw new ValidationError(`Invalid event types: ${invalidTypes.join(', ')}`);
    }
  }

  // Update master event availability
  await query(
    `UPDATE masters
     SET available_for_events = $1,
         event_types = $2,
         event_rate_per_day = $3,
         event_currency = $4,
         event_notes = $5,
         updated_at = NOW()
     WHERE id = $6`,
    [
      data.available_for_events,
      data.event_types || [],
      data.event_rate_per_day || null,
      data.event_currency || 'USD',
      data.event_notes || null,
      master.id
    ]
  );
};

/**
 * Get masters available for events
 */
export const getMastersAvailableForEvents = async (filters: {
  event_type?: string;
  min_rating?: number;
  max_rate?: number;
  page?: number;
  limit?: number;
}): Promise<{ masters: Master[]; total: number }> => {
  const tableCheck = await checkTableExists();
  if (!tableCheck) {
    return { masters: [], total: 0 };
  }

  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const offset = (page - 1) * limit;

  const conditions = ['available_for_events = true'];
  const params: any[] = [];
  let paramCount = 0;

  if (filters.event_type) {
    paramCount++;
    conditions.push(`$${paramCount} = ANY(event_types)`);
    params.push(filters.event_type);
  }

  if (filters.min_rating) {
    paramCount++;
    conditions.push(`rating >= $${paramCount}`);
    params.push(filters.min_rating);
  }

  if (filters.max_rate) {
    paramCount++;
    conditions.push(`event_rate_per_day <= $${paramCount}`);
    params.push(filters.max_rate);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countQuery = `
    SELECT COUNT(*) as total
    FROM masters
    ${whereClause}
  `;

  const dataQuery = `
    SELECT *
    FROM masters
    ${whereClause}
    ORDER BY rating DESC
    LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
  `;

  const [countResult, dataResult] = await Promise.all([
    query(countQuery, params),
    query(dataQuery, [...params, limit, offset])
  ]);

  return {
    masters: dataResult.rows,
    total: parseInt(countResult.rows[0].total)
  };
};
