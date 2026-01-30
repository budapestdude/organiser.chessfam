import { Request, Response } from 'express';
import pool from '../config/database';
import { CreateVenueSubmissionRequest } from '../types/venue';

export const submitVenue = async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;

  if (!userId) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  const {
    venue_name,
    venue_type,
    address,
    city,
    state,
    country,
    postal_code,
    phone,
    email,
    website,
    description,
    amenities,
    opening_hours,
    image_url,
    contact_person_name,
    contact_person_phone
  } = req.body as CreateVenueSubmissionRequest;

  // Validate required fields
  if (!venue_name || !venue_type || !address || !city || !country || !email) {
    return res.status(400).json({
      message: 'Missing required fields: venue_name, venue_type, address, city, country, email'
    });
  }

  try {
    // Auto-geocode the address to get coordinates
    let latitude = null;
    let longitude = null;

    if (address || city) {
      try {
        const { geocodeAddress } = await import('../services/geocodingService');
        const geoResult = await geocodeAddress({ address, city, state, country });
        if (geoResult) {
          latitude = geoResult.latitude;
          longitude = geoResult.longitude;
          console.log(`[Venue Submission] Geocoded "${venue_name}" to coordinates: ${latitude}, ${longitude}`);
        }
      } catch (err) {
        console.error('[Venue Submission] Geocoding failed:', err);
        // Continue without coordinates - they're optional
      }
    }

    const result = await pool.query(
      `INSERT INTO venue_submissions (
        user_id, venue_name, venue_type, address, city, state, country, postal_code,
        phone, email, website, description, amenities, opening_hours, image_url,
        contact_person_name, contact_person_phone, latitude, longitude, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, 'pending')
      RETURNING *`,
      [
        userId, venue_name, venue_type, address, city, state, country, postal_code,
        phone, email, website, description, amenities, opening_hours, image_url,
        contact_person_name, contact_person_phone, latitude, longitude
      ]
    );

    res.status(201).json({
      message: 'Venue submitted successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error submitting venue:', error);
    res.status(500).json({ message: 'Failed to submit venue' });
  }
};

export const getUserVenueSubmissions = async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;

  if (!userId) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  try {
    const result = await pool.query(
      `SELECT id, user_id, venue_name, venue_type, address, city, state, country, postal_code, phone, email, website, description, amenities, opening_hours, image_url, latitude, longitude, contact_person_name, contact_person_phone, status, admin_notes, created_at, updated_at
       FROM venue_submissions
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    res.status(200).json({
      message: 'Venue submissions retrieved successfully',
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching venue submissions:', error);
    res.status(500).json({ message: 'Failed to fetch venue submissions' });
  }
};

export const getVenueSubmissionById = async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const { id } = req.params;

  if (!userId) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  try {
    const result = await pool.query(
      `SELECT id, user_id, venue_name, venue_type, address, city, state, country, postal_code, phone, email, website, description, amenities, opening_hours, image_url, latitude, longitude, contact_person_name, contact_person_phone, status, admin_notes, created_at, updated_at
       FROM venue_submissions
       WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Venue submission not found' });
    }

    res.status(200).json({
      message: 'Venue submission retrieved successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching venue submission:', error);
    res.status(500).json({ message: 'Failed to fetch venue submission' });
  }
};

// Admin endpoints
export const getAllVenueSubmissions = async (req: Request, res: Response) => {
  const { status, search } = req.query;

  try {
    let query = `
      SELECT vs.id, vs.user_id, vs.venue_name, vs.venue_type, vs.address, vs.city, vs.state, vs.country, vs.postal_code,
             vs.phone, vs.email, vs.website, vs.description, vs.amenities, vs.opening_hours, vs.image_url,
             vs.latitude, vs.longitude, vs.contact_person_name, vs.contact_person_phone,
             vs.status, vs.admin_notes, vs.created_at, vs.updated_at,
             u.name as submitter_name, u.email as submitter_email
      ${search ? `,
      GREATEST(
        similarity(vs.venue_name, $${status ? 2 : 1}),
        similarity(COALESCE(vs.description, ''), $${status ? 2 : 1}),
        word_similarity($${status ? 2 : 1}, vs.venue_name),
        similarity(REPLACE(LOWER(vs.venue_name), ' ', ''), REPLACE(LOWER($${status ? 2 : 1}), ' ', ''))
      ) as search_rank` : ''}
      FROM venue_submissions vs
      LEFT JOIN users u ON vs.user_id = u.id
    `;

    const params: any[] = [];
    const conditions: string[] = [];

    if (status) {
      conditions.push('vs.status = $1');
      params.push(status);
    }

    if (search) {
      // Fuzzy search using pg_trgm similarity (handles typos and partial matches)
      // Very generous threshold (0.1) and space-insensitive matching
      const searchParam = status ? '$2' : '$1';
      conditions.push(`(
        similarity(vs.venue_name, ${searchParam}) > 0.1 OR
        similarity(COALESCE(vs.description, ''), ${searchParam}) > 0.1 OR
        word_similarity(${searchParam}, vs.venue_name) > 0.2 OR
        similarity(REPLACE(LOWER(vs.venue_name), ' ', ''), REPLACE(LOWER(${searchParam}), ' ', '')) > 0.3 OR
        vs.venue_name ILIKE ${status ? '$3' : '$2'} OR
        COALESCE(vs.description, '') ILIKE ${status ? '$3' : '$2'}
      )`);
      params.push(search, `%${search}%`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ` ORDER BY ${search ? 'search_rank DESC,' : ''} vs.created_at DESC`;

    const result = await pool.query(query, params);

    res.status(200).json({
      message: 'Venue submissions retrieved successfully',
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching all venue submissions:', error);
    res.status(500).json({ message: 'Failed to fetch venue submissions' });
  }
};

export const updateVenueStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, admin_notes } = req.body;

  if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
    return res.status(400).json({
      message: 'Invalid status. Must be: pending, approved, or rejected'
    });
  }

  try {
    const result = await pool.query(
      `UPDATE venue_submissions
       SET status = $1, admin_notes = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [status, admin_notes || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Venue submission not found' });
    }

    const venueSubmission = result.rows[0];

    // If approved, geocode and create a community for the venue (for city bubbles)
    if (status === 'approved') {
      try {
        // Geocode the address for accurate bubble assignment
        let latitude: number | undefined;
        let longitude: number | undefined;

        try {
          const { geocodeAddress } = await import('../services/geocodingService');
          const geoResult = await geocodeAddress({
            address: venueSubmission.address,
            city: venueSubmission.city,
            state: venueSubmission.state,
            country: venueSubmission.country,
          });
          if (geoResult) {
            latitude = geoResult.latitude;
            longitude = geoResult.longitude;
            console.log(`[Venue Approval] Geocoded "${venueSubmission.venue_name}" to: ${latitude}, ${longitude}`);
          }
        } catch (geoErr) {
          console.error('[Venue Approval] Geocoding failed:', geoErr);
        }

        const communitiesService = await import('../services/communitiesService');
        await communitiesService.createCommunity(venueSubmission.user_id, {
          name: venueSubmission.venue_name,
          description: venueSubmission.description,
          type: 'venue',
          city: venueSubmission.city,
          country: venueSubmission.country,
          latitude,
          longitude,
          image: venueSubmission.image_url,
          tags: ['venue', venueSubmission.venue_type?.toLowerCase()].filter(Boolean),
        });
        console.log(`[Venue Approval] Community created for "${venueSubmission.venue_name}"`);
      } catch (err) {
        // Log but don't fail venue approval if community creation fails
        console.error('Failed to create community for approved venue:', err);
      }
    }

    res.status(200).json({
      message: 'Venue status updated successfully',
      data: venueSubmission
    });
  } catch (error) {
    console.error('Error updating venue status:', error);
    res.status(500).json({ message: 'Failed to update venue status' });
  }
};

// Update venue (owner only)
export const updateVenueHandler = async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const { id } = req.params;

  if (!userId) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  try {
    const { updateVenue } = await import('../services/venuesService');
    const venue = await updateVenue(parseInt(id), userId, req.body);

    res.status(200).json({
      message: 'Venue updated successfully',
      data: venue
    });
  } catch (error: any) {
    console.error('Error updating venue:', error);
    if (error.message === 'Venue not found') {
      return res.status(404).json({ message: 'Venue not found' });
    }
    if (error.message === 'You do not own this venue') {
      return res.status(403).json({ message: 'You do not own this venue' });
    }
    res.status(500).json({ message: 'Failed to update venue' });
  }
};

// Get venue by ID for editing
export const getVenueByIdHandler = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const { getVenueById } = await import('../services/venuesService');
    const venue = await getVenueById(parseInt(id));

    res.status(200).json({
      message: 'Venue retrieved successfully',
      data: venue
    });
  } catch (error: any) {
    console.error('Error fetching venue:', error);
    if (error.message === 'Venue not found') {
      return res.status(404).json({ message: 'Venue not found' });
    }
    res.status(500).json({ message: 'Failed to fetch venue' });
  }
};

// Get approved venues (public endpoint)
// Note: Approved venues are stored in venue_submissions with status='approved'
export const getApprovedVenues = async (req: Request, res: Response) => {
  console.log('[getApprovedVenues] Route hit! Query params:', req.query);

  try {
    const result = await pool.query(
      `SELECT
        vs.id, vs.user_id, vs.venue_name, vs.venue_type, vs.address, vs.city, vs.state,
        vs.country, vs.postal_code, vs.phone, vs.email, vs.website, vs.description,
        vs.opening_hours, vs.image_url,
        vs.contact_person_name, vs.contact_person_phone, vs.status,
        vs.created_at, vs.updated_at,
        COALESCE(AVG(vr.rating), 0) as average_rating,
        COUNT(vr.id) as review_count
      FROM venue_submissions vs
      LEFT JOIN venue_reviews vr ON vr.venue_id = vs.id
      WHERE vs.status = 'approved'
      GROUP BY vs.id
      ORDER BY vs.created_at DESC
      LIMIT 100`
    );

    console.log('[getApprovedVenues] Found', result.rows.length, 'approved venues');
    if (result.rows.length > 0) {
      console.log('[getApprovedVenues] Sample venue with rating:', result.rows[0]);
    }

    res.status(200).json({
      message: 'Approved venues retrieved successfully',
      data: result.rows,
      meta: {
        total: result.rows.length
      }
    });
  } catch (error: any) {
    console.error('[getApprovedVenues] Database error:', error);
    res.status(500).json({
      message: 'Error fetching approved venues',
      error: error.message
    });
  }
};
