import { query } from '../config/database';
import { NotFoundError, ValidationError, ForbiddenError } from '../utils/errors';

export interface Venue {
  id: number;
  owner_id?: number;
  name: string;
  description?: string;
  address: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  coordinates?: { lat: number; lng: number };
  phone?: string;
  email?: string;
  website?: string;
  images?: string[];
  amenities?: string[];
  hours?: Record<string, string>;
  capacity?: number;
  price_range?: string;
  status: string;
  verified: boolean;
  rating_avg: number;
  review_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateVenueInput {
  name: string;
  description?: string;
  address: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  coordinates?: { lat: number; lng: number };
  phone?: string;
  email?: string;
  website?: string;
  images?: string[];
  amenities?: string[];
  hours?: Record<string, string>;
  capacity?: number;
  price_range?: string;
}

export const getVenues = async (filters: {
  city?: string;
  country?: string;
  status?: string;
  search?: string;
  verified?: boolean;
  page?: number;
  limit?: number;
}): Promise<{ venues: Venue[]; total: number }> => {
  const { city, country, status = 'approved', search, verified, page = 1, limit = 20 } = filters;
  const offset = (page - 1) * limit;

  let whereClause = 'WHERE 1=1';
  const params: any[] = [];
  let paramIndex = 1;

  if (status) {
    whereClause += ` AND status = $${paramIndex++}`;
    params.push(status);
  }

  if (city) {
    whereClause += ` AND LOWER(city) LIKE LOWER($${paramIndex++})`;
    params.push(`%${city}%`);
  }

  if (country) {
    whereClause += ` AND LOWER(country) LIKE LOWER($${paramIndex++})`;
    params.push(`%${country}%`);
  }

  if (search) {
    // Fuzzy search using pg_trgm similarity (handles typos and partial matches)
    // Very generous threshold (0.1) and space-insensitive matching
    whereClause += ` AND (
      similarity(name, $${paramIndex}) > 0.1 OR
      similarity(COALESCE(description, ''), $${paramIndex}) > 0.1 OR
      word_similarity($${paramIndex}, name) > 0.2 OR
      similarity(REPLACE(LOWER(name), ' ', ''), REPLACE(LOWER($${paramIndex}), ' ', '')) > 0.3 OR
      name ILIKE $${paramIndex + 1} OR
      COALESCE(description, '') ILIKE $${paramIndex + 1}
    )`;
    params.push(search, `%${search}%`);
    paramIndex += 2;
  }

  if (verified !== undefined) {
    whereClause += ` AND verified = $${paramIndex++}`;
    params.push(verified);
  }

  const countResult = await query(
    `SELECT COUNT(*) FROM venues ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].count);

  const result = await query(
    `SELECT id, owner_id, name, description, address, city, state, country, postal_code, coordinates, phone, email, website, images, amenities, hours, capacity, price_range, status, verified, rating_avg, review_count, created_at, updated_at
            ${search ? `,
            GREATEST(
              similarity(name, $${paramIndex - 2}),
              similarity(COALESCE(description, ''), $${paramIndex - 2}),
              word_similarity($${paramIndex - 2}, name),
              similarity(REPLACE(LOWER(name), ' ', ''), REPLACE(LOWER($${paramIndex - 2}), ' ', ''))
            ) as search_rank` : ''}
     FROM venues ${whereClause}
     ORDER BY ${search ? 'search_rank DESC,' : ''} rating_avg DESC, review_count DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    [...params, limit, offset]
  );

  return { venues: result.rows, total };
};

export const getVenueById = async (id: number): Promise<Venue> => {
  const result = await query(
    `SELECT id, owner_id, name, description, address, city, state, country, postal_code, coordinates, phone, email, website, images, amenities, hours, capacity, price_range, status, verified, rating_avg, review_count, created_at, updated_at FROM venues WHERE id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Venue not found');
  }

  return result.rows[0];
};

export const createVenue = async (
  ownerId: number,
  input: CreateVenueInput
): Promise<Venue> => {
  const {
    name,
    description,
    address,
    city,
    state,
    country,
    postal_code,
    coordinates: inputCoordinates,
    phone,
    email,
    website,
    images,
    amenities,
    hours,
    capacity,
    price_range,
  } = input;

  if (!name || !address) {
    throw new ValidationError('Name and address are required');
  }

  // Auto-geocode if coordinates aren't provided
  let coordinates = inputCoordinates;
  if (!coordinates && (address || city)) {
    try {
      const { geocodeAddress } = await import('./geocodingService');
      const geoResult = await geocodeAddress({ address, city, state, country });
      if (geoResult) {
        coordinates = { lat: geoResult.latitude, lng: geoResult.longitude };
        console.log(`[Venue] Geocoded "${name}" to coordinates: ${coordinates.lat}, ${coordinates.lng}`);
      }
    } catch (err) {
      console.error('[Venue] Geocoding failed:', err);
    }
  }

  const result = await query(
    `INSERT INTO venues (owner_id, name, description, address, city, state, country, postal_code, coordinates, phone, email, website, images, amenities, hours, capacity, price_range, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 'pending')
     RETURNING *`,
    [ownerId, name, description, address, city, state, country, postal_code,
     coordinates ? JSON.stringify(coordinates) : null,
     phone, email, website, images, amenities,
     hours ? JSON.stringify(hours) : null,
     capacity, price_range]
  );

  // Create associated community for the venue (for city bubbles)
  try {
    const communitiesService = await import('./communitiesService');
    await communitiesService.createCommunity(ownerId, {
      name,
      description,
      type: 'venue',
      city,
      country,
      latitude: coordinates?.lat,
      longitude: coordinates?.lng,
      image: images?.[0],
      tags: ['venue'],
    });
  } catch (err) {
    // Log but don't fail venue creation if community creation fails
    console.error('Failed to create community for venue:', err);
  }

  return result.rows[0];
};

export const updateVenue = async (
  id: number,
  ownerId: number,
  input: Partial<CreateVenueInput>
): Promise<Venue> => {
  const venue = await getVenueById(id);

  if (venue.owner_id !== ownerId) {
    throw new ForbiddenError('You do not own this venue');
  }

  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  const fields = [
    'name', 'description', 'address', 'city', 'state', 'country',
    'postal_code', 'phone', 'email', 'website', 'images', 'amenities',
    'capacity', 'price_range'
  ];

  for (const field of fields) {
    if (input[field as keyof CreateVenueInput] !== undefined) {
      updates.push(`${field} = $${paramIndex++}`);
      values.push(input[field as keyof CreateVenueInput]);
    }
  }

  if (input.coordinates !== undefined) {
    updates.push(`coordinates = $${paramIndex++}`);
    values.push(JSON.stringify(input.coordinates));
  }

  if (input.hours !== undefined) {
    updates.push(`hours = $${paramIndex++}`);
    values.push(JSON.stringify(input.hours));
  }

  if (updates.length === 0) {
    return venue;
  }

  updates.push(`updated_at = NOW()`);
  values.push(id);

  const result = await query(
    `UPDATE venues SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  return result.rows[0];
};

export const getVenueReviews = async (
  venueId: number,
  page: number = 1,
  limit: number = 20
): Promise<{ reviews: any[]; total: number }> => {
  const offset = (page - 1) * limit;

  const countResult = await query(
    `SELECT COUNT(*) FROM venue_reviews WHERE venue_id = $1`,
    [venueId]
  );
  const total = parseInt(countResult.rows[0].count);

  const result = await query(
    `SELECT vr.*, u.name as reviewer_name, u.avatar as reviewer_avatar
     FROM venue_reviews vr
     JOIN users u ON vr.user_id = u.id
     WHERE vr.venue_id = $1
     ORDER BY vr.created_at DESC
     LIMIT $2 OFFSET $3`,
    [venueId, limit, offset]
  );

  return { reviews: result.rows, total };
};

export const createVenueReview = async (
  venueId: number,
  userId: number,
  input: { rating: number; title?: string; content?: string; visit_date?: string }
): Promise<any> => {
  const { rating, title, content, visit_date } = input;

  if (rating < 1 || rating > 5) {
    throw new ValidationError('Rating must be between 1 and 5');
  }

  // Check if user already reviewed this venue
  const existingReview = await query(
    `SELECT id FROM venue_reviews WHERE venue_id = $1 AND user_id = $2`,
    [venueId, userId]
  );

  if (existingReview.rows.length > 0) {
    throw new ValidationError('You have already reviewed this venue');
  }

  const result = await query(
    `INSERT INTO venue_reviews (venue_id, user_id, rating, title, content, visit_date)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [venueId, userId, rating, title, content, visit_date]
  );

  // Update venue rating
  await query(
    `UPDATE venues
     SET rating_avg = (SELECT AVG(rating) FROM venue_reviews WHERE venue_id = $1),
         review_count = (SELECT COUNT(*) FROM venue_reviews WHERE venue_id = $1),
         updated_at = NOW()
     WHERE id = $1`,
    [venueId]
  );

  return result.rows[0];
};

export const checkIn = async (venueId: number, userId: number): Promise<any> => {
  // Check for active check-in
  const activeCheckin = await query(
    `SELECT id FROM checkins WHERE user_id = $1 AND status = 'active'`,
    [userId]
  );

  if (activeCheckin.rows.length > 0) {
    throw new ValidationError('You are already checked in at another venue');
  }

  const result = await query(
    `INSERT INTO checkins (venue_id, user_id)
     VALUES ($1, $2)
     RETURNING *`,
    [venueId, userId]
  );

  return result.rows[0];
};

export const checkOut = async (userId: number): Promise<any> => {
  const result = await query(
    `UPDATE checkins
     SET status = 'completed', checked_out_at = NOW()
     WHERE user_id = $1 AND status = 'active'
     RETURNING *`,
    [userId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('No active check-in found');
  }

  return result.rows[0];
};

export const getActiveCheckin = async (userId: number): Promise<any | null> => {
  const result = await query(
    `SELECT c.*, v.name as venue_name, v.address as venue_address
     FROM checkins c
     JOIN venues v ON c.venue_id = v.id
     WHERE c.user_id = $1 AND c.status = 'active'`,
    [userId]
  );

  return result.rows[0] || null;
};
