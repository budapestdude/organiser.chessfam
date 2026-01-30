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
    const result = await pool.query(
      `INSERT INTO venue_submissions (
        user_id, venue_name, venue_type, address, city, state, country, postal_code,
        phone, email, website, description, amenities, opening_hours, image_url,
        contact_person_name, contact_person_phone, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 'pending')
      RETURNING *`,
      [
        userId, venue_name, venue_type, address, city, state, country, postal_code,
        phone, email, website, description, amenities, opening_hours, image_url,
        contact_person_name, contact_person_phone
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
      `SELECT * FROM venue_submissions
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
      `SELECT * FROM venue_submissions
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
  const { status } = req.query;

  try {
    let query = `
      SELECT vs.*, u.name as submitter_name, u.email as submitter_email
      FROM venue_submissions vs
      LEFT JOIN users u ON vs.user_id = u.id
    `;

    const params: any[] = [];
    if (status) {
      query += ' WHERE vs.status = $1';
      params.push(status);
    }

    query += ' ORDER BY vs.created_at DESC';

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

    res.status(200).json({
      message: 'Venue status updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating venue status:', error);
    res.status(500).json({ message: 'Failed to update venue status' });
  }
};
