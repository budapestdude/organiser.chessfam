import { Request, Response, NextFunction } from 'express';
import { query } from '../../config/database';
import { ValidationError, NotFoundError } from '../../utils/errors';
import { sendSuccess, sendPaginatedSuccess } from '../../utils/response';

// ============ VENUES ============

export const getAllVenues = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = req.query.search as string;
    const status = req.query.status as string;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (search) {
      whereClause += ` AND (LOWER(name) LIKE LOWER($${paramIndex}) OR LOWER(city) LIKE LOWER($${paramIndex}) OR LOWER(address) LIKE LOWER($${paramIndex}))`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (status) {
      whereClause += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    console.log('getAllVenues query:', whereClause, 'params:', params);

    const countResult = await query(`SELECT COUNT(*) FROM venue_submissions ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count);
    console.log('Total venues found:', total);

    const result = await query(
      `SELECT vs.*, u.name as submitter_name
       FROM venue_submissions vs
       LEFT JOIN users u ON vs.user_id = u.id
       ${whereClause}
       ORDER BY vs.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    sendPaginatedSuccess(res, { venues: result.rows, total }, { page, limit, total });
  } catch (error) {
    next(error);
  }
};

export const updateVenue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const venueId = parseInt(req.params.id);
    if (!venueId) throw new ValidationError('Invalid venue ID');

    console.log('Updating venue:', venueId, 'with data:', req.body);

    const { name, venue_name, description, address, city, country, venue_type, amenities, status, phone, email, website } = req.body;

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Handle both 'name' and 'venue_name' for backwards compatibility
    const venueName = venue_name || name;
    if (venueName !== undefined) {
      updates.push(`venue_name = $${paramIndex++}`);
      values.push(venueName);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(description);
    }
    if (address !== undefined) {
      updates.push(`address = $${paramIndex++}`);
      values.push(address);
    }
    if (city !== undefined) {
      updates.push(`city = $${paramIndex++}`);
      values.push(city);
    }
    if (country !== undefined) {
      updates.push(`country = $${paramIndex++}`);
      values.push(country);
    }
    if (venue_type !== undefined) {
      updates.push(`venue_type = $${paramIndex++}`);
      values.push(venue_type);
    }
    if (amenities !== undefined) {
      updates.push(`amenities = $${paramIndex++}`);
      values.push(amenities);
    }
    if (status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(status);
    }
    if (phone !== undefined) {
      updates.push(`phone = $${paramIndex++}`);
      values.push(phone);
    }
    if (email !== undefined) {
      updates.push(`email = $${paramIndex++}`);
      values.push(email);
    }
    if (website !== undefined) {
      updates.push(`website = $${paramIndex++}`);
      values.push(website);
    }

    if (updates.length === 0) {
      throw new ValidationError('No fields to update');
    }

    values.push(venueId);
    const result = await query(
      `UPDATE venue_submissions SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Venue not found');
    }

    sendSuccess(res, result.rows[0], 'Venue updated successfully');
  } catch (error: any) {
    console.error('Error updating venue:', error);
    console.error('Error details:', {
      message: error.message,
      detail: error.detail,
      code: error.code,
    });
    next(error);
  }
};

export const deleteVenue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const venueId = parseInt(req.params.id);
    if (!venueId) throw new ValidationError('Invalid venue ID');

    // Get venue name to find associated community
    const venueResult = await query('SELECT venue_name FROM venue_submissions WHERE id = $1', [venueId]);
    if (venueResult.rows.length === 0) {
      throw new NotFoundError('Venue not found');
    }

    const venueName = venueResult.rows[0].venue_name;
    const slug = venueName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    // Delete the venue
    await query('DELETE FROM venue_submissions WHERE id = $1', [venueId]);

    // Delete associated community (if exists)
    await query('DELETE FROM communities WHERE type = $1 AND slug = $2', ['venue', slug]);

    sendSuccess(res, null, 'Venue deleted successfully');
  } catch (error) {
    next(error);
  }
};

// ============ CLUBS ============

export const getAllClubs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = req.query.search as string;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (search) {
      whereClause += ` AND (LOWER(c.name) LIKE LOWER($${paramIndex}) OR LOWER(c.city) LIKE LOWER($${paramIndex}))`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    const countResult = await query(`SELECT COUNT(*) FROM clubs c ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count);

    const result = await query(
      `SELECT c.*, u.name as owner_name, u.email as owner_email, v.name as venue_name
       FROM clubs c
       LEFT JOIN users u ON c.owner_id = u.id
       LEFT JOIN venues v ON c.venue_id = v.id
       ${whereClause}
       ORDER BY c.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    sendPaginatedSuccess(res, { clubs: result.rows, total }, { page, limit, total });
  } catch (error) {
    next(error);
  }
};

export const updateClub = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const clubId = parseInt(req.params.id);
    if (!clubId) throw new ValidationError('Invalid club ID');

    console.log('Updating club:', clubId, 'with data:', req.body);

    const { name, description, address, city, country, founded_year, membership_fee, is_active, website, contact_email, premium_discount_eligible, image } = req.body;

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(description);
    }
    if (address !== undefined) {
      updates.push(`address = $${paramIndex++}`);
      values.push(address);
    }
    if (city !== undefined) {
      updates.push(`city = $${paramIndex++}`);
      values.push(city);
    }
    if (country !== undefined) {
      updates.push(`country = $${paramIndex++}`);
      values.push(country);
    }
    if (founded_year !== undefined) {
      updates.push(`founded_year = $${paramIndex++}`);
      // Convert empty string to null for integer field
      values.push(founded_year === '' ? null : founded_year);
    }
    if (membership_fee !== undefined) {
      updates.push(`membership_fee = $${paramIndex++}`);
      values.push(membership_fee);
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(is_active);
    }
    if (website !== undefined) {
      updates.push(`website = $${paramIndex++}`);
      values.push(website);
    }
    if (contact_email !== undefined) {
      updates.push(`contact_email = $${paramIndex++}`);
      values.push(contact_email);
    }
    if (premium_discount_eligible !== undefined) {
      updates.push(`premium_discount_eligible = $${paramIndex++}`);
      values.push(premium_discount_eligible);
    }
    if (image !== undefined) {
      updates.push(`image = $${paramIndex++}`);
      values.push(image);
    }

    if (updates.length === 0) {
      throw new ValidationError('No fields to update');
    }

    values.push(clubId);
    const result = await query(
      `UPDATE clubs SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Club not found');
    }

    sendSuccess(res, result.rows[0], 'Club updated successfully');
  } catch (error: any) {
    console.error('Error updating club:', error);
    console.error('Error details:', {
      message: error.message,
      detail: error.detail,
      code: error.code,
    });
    next(error);
  }
};

export const deleteClub = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const clubId = parseInt(req.params.id);
    if (!clubId) throw new ValidationError('Invalid club ID');

    // Get club name to find associated community
    const clubResult = await query('SELECT name FROM clubs WHERE id = $1', [clubId]);
    if (clubResult.rows.length === 0) {
      throw new NotFoundError('Club not found');
    }

    const clubName = clubResult.rows[0].name;
    const slug = clubName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    // Delete the club
    await query('DELETE FROM clubs WHERE id = $1', [clubId]);

    // Delete associated community (if exists)
    await query('DELETE FROM communities WHERE type = $1 AND slug = $2', ['club', slug]);

    sendSuccess(res, null, 'Club deleted successfully');
  } catch (error) {
    next(error);
  }
};

// ============ TOURNAMENTS ============

export const getAllTournaments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = req.query.search as string;
    const status = req.query.status as string;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (search) {
      whereClause += ` AND LOWER(t.name) LIKE LOWER($${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (status) {
      whereClause += ` AND t.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    const countResult = await query(`SELECT COUNT(*) FROM tournaments t ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count);

    const result = await query(
      `SELECT t.*, u.name as organizer_name, u.email as organizer_email, v.name as venue_name,
              (SELECT COUNT(*) FROM tournament_registrations WHERE tournament_id = t.id AND status = 'registered') as current_participants
       FROM tournaments t
       LEFT JOIN users u ON t.organizer_id = u.id
       LEFT JOIN venues v ON t.venue_id = v.id
       ${whereClause}
       ORDER BY t.start_date DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    // Debug: Log if any tournaments have external_registration_url
    const withExternalUrl = result.rows.filter((t: any) => t.external_registration_url);
    if (withExternalUrl.length > 0) {
      console.log('Tournaments with external_registration_url:', withExternalUrl.map((t: any) => ({
        id: t.id,
        name: t.name,
        external_registration_url: t.external_registration_url
      })));
    }

    sendPaginatedSuccess(res, { tournaments: result.rows, total }, { page, limit, total });
  } catch (error) {
    next(error);
  }
};

export const updateTournament = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tournamentId = parseInt(req.params.id);
    if (!tournamentId) throw new ValidationError('Invalid tournament ID');

    console.log('Updating tournament:', tournamentId, 'with data:', req.body);
    console.log('external_registration_url in request:', req.body.external_registration_url);

    const {
      name, description, tournament_type, start_date, end_date, registration_deadline,
      format, time_control, max_participants, entry_fee, prize_pool, currency,
      rating_min, rating_max, status, premium_discount_eligible,
      external_registration_url, image, images, rules,
      early_bird_pricing, junior_discount, senior_discount, women_discount,
      junior_age_max, senior_age_min, gm_wgm_discount, im_wim_discount, fm_wfm_discount
    } = req.body;

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(description);
    }
    if (tournament_type !== undefined) {
      updates.push(`tournament_type = $${paramIndex++}`);
      values.push(tournament_type);
    }
    if (start_date !== undefined) {
      updates.push(`start_date = $${paramIndex++}`);
      values.push(start_date === '' ? null : start_date);
    }
    if (end_date !== undefined) {
      updates.push(`end_date = $${paramIndex++}`);
      values.push(end_date === '' ? null : end_date);
    }
    if (registration_deadline !== undefined) {
      updates.push(`registration_deadline = $${paramIndex++}`);
      values.push(registration_deadline === '' ? null : registration_deadline);
    }
    if (format !== undefined) {
      updates.push(`format = $${paramIndex++}`);
      values.push(format);
    }
    if (time_control !== undefined) {
      updates.push(`time_control = $${paramIndex++}`);
      values.push(time_control);
    }
    if (max_participants !== undefined) {
      updates.push(`max_participants = $${paramIndex++}`);
      values.push(max_participants);
    }
    if (entry_fee !== undefined) {
      updates.push(`entry_fee = $${paramIndex++}`);
      values.push(entry_fee);
    }
    if (prize_pool !== undefined) {
      updates.push(`prize_pool = $${paramIndex++}`);
      values.push(prize_pool);
    }
    if (currency !== undefined) {
      updates.push(`currency = $${paramIndex++}`);
      values.push(currency);
    }
    if (rating_min !== undefined) {
      updates.push(`rating_min = $${paramIndex++}`);
      values.push(rating_min === '' ? null : rating_min);
    }
    if (rating_max !== undefined) {
      updates.push(`rating_max = $${paramIndex++}`);
      values.push(rating_max === '' ? null : rating_max);
    }
    if (status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(status);
    }
    if (premium_discount_eligible !== undefined) {
      updates.push(`premium_discount_eligible = $${paramIndex++}`);
      values.push(premium_discount_eligible);
    }
    if (external_registration_url !== undefined) {
      updates.push(`external_registration_url = $${paramIndex++}`);
      values.push(external_registration_url === '' ? null : external_registration_url);
    }
    if (image !== undefined) {
      updates.push(`image = $${paramIndex++}`);
      values.push(image === '' ? null : image);
    }
    if (images !== undefined) {
      updates.push(`images = $${paramIndex++}`);
      values.push(JSON.stringify(images));
    }
    if (rules !== undefined) {
      updates.push(`rules = $${paramIndex++}`);
      values.push(rules);
    }
    if (early_bird_pricing !== undefined) {
      updates.push(`early_bird_pricing = $${paramIndex++}`);
      values.push(JSON.stringify(early_bird_pricing));
    }
    if (junior_discount !== undefined) {
      updates.push(`junior_discount = $${paramIndex++}`);
      values.push(junior_discount);
    }
    if (senior_discount !== undefined) {
      updates.push(`senior_discount = $${paramIndex++}`);
      values.push(senior_discount);
    }
    if (women_discount !== undefined) {
      updates.push(`women_discount = $${paramIndex++}`);
      values.push(women_discount);
    }
    if (junior_age_max !== undefined) {
      updates.push(`junior_age_max = $${paramIndex++}`);
      values.push(junior_age_max === '' ? null : junior_age_max);
    }
    if (senior_age_min !== undefined) {
      updates.push(`senior_age_min = $${paramIndex++}`);
      values.push(senior_age_min === '' ? null : senior_age_min);
    }
    if (gm_wgm_discount !== undefined) {
      updates.push(`gm_wgm_discount = $${paramIndex++}`);
      values.push(gm_wgm_discount);
    }
    if (im_wim_discount !== undefined) {
      updates.push(`im_wim_discount = $${paramIndex++}`);
      values.push(im_wim_discount);
    }
    if (fm_wfm_discount !== undefined) {
      updates.push(`fm_wfm_discount = $${paramIndex++}`);
      values.push(fm_wfm_discount);
    }

    if (updates.length === 0) {
      throw new ValidationError('No fields to update');
    }

    values.push(tournamentId);
    const result = await query(
      `UPDATE tournaments SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Tournament not found');
    }

    sendSuccess(res, result.rows[0], 'Tournament updated successfully');
  } catch (error: any) {
    console.error('Error updating tournament:', error);
    console.error('Error details:', {
      message: error.message,
      detail: error.detail,
      code: error.code,
    });
    next(error);
  }
};

export const deleteTournament = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tournamentId = parseInt(req.params.id);
    if (!tournamentId) throw new ValidationError('Invalid tournament ID');

    // Get tournament name to find associated community
    const tournamentResult = await query('SELECT name FROM tournaments WHERE id = $1', [tournamentId]);
    if (tournamentResult.rows.length === 0) {
      throw new NotFoundError('Tournament not found');
    }

    const tournamentName = tournamentResult.rows[0].name;
    const slug = tournamentName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    // Delete the tournament
    await query('DELETE FROM tournaments WHERE id = $1', [tournamentId]);

    // Delete associated community (if exists)
    await query('DELETE FROM communities WHERE type = $1 AND slug = $2', ['tournament', slug]);

    sendSuccess(res, null, 'Tournament deleted successfully');
  } catch (error) {
    next(error);
  }
};

// ============ MASTERS ============

export const getAllMasters = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = req.query.search as string;
    const status = req.query.status as string;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (search) {
      whereClause += ` AND LOWER(m.name) LIKE LOWER($${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (status) {
      whereClause += ` AND m.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    const countResult = await query(`SELECT COUNT(*) FROM masters m ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count);

    const result = await query(
      `SELECT m.*, u.name as user_name, u.email as user_email
       FROM masters m
       LEFT JOIN users u ON m.user_id = u.id
       ${whereClause}
       ORDER BY m.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    sendPaginatedSuccess(res, { masters: result.rows, total }, { page, limit, total });
  } catch (error) {
    next(error);
  }
};

export const updateMaster = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const masterId = parseInt(req.params.id);
    if (!masterId) throw new ValidationError('Invalid master ID');

    console.log('Updating master:', masterId, 'with data:', req.body);

    const { name, title, rating, hourly_rate, bio, specialties, languages, is_active, status, premium_discount_eligible } = req.body;

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    if (title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      values.push(title);
    }
    if (rating !== undefined) {
      updates.push(`rating = $${paramIndex++}`);
      values.push(rating);
    }
    if (hourly_rate !== undefined) {
      updates.push(`hourly_rate = $${paramIndex++}`);
      values.push(hourly_rate);
    }
    if (bio !== undefined) {
      updates.push(`bio = $${paramIndex++}`);
      values.push(bio);
    }
    if (specialties !== undefined) {
      updates.push(`specialties = $${paramIndex++}`);
      values.push(specialties);
    }
    if (languages !== undefined) {
      updates.push(`languages = $${paramIndex++}`);
      values.push(languages);
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(is_active);
    }
    if (status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(status);
    }
    if (premium_discount_eligible !== undefined) {
      updates.push(`premium_discount_eligible = $${paramIndex++}`);
      values.push(premium_discount_eligible);
    }

    if (updates.length === 0) {
      throw new ValidationError('No fields to update');
    }

    values.push(masterId);
    const result = await query(
      `UPDATE masters SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Master not found');
    }

    sendSuccess(res, result.rows[0], 'Master updated successfully');
  } catch (error: any) {
    console.error('Error updating master:', error);
    console.error('Error details:', {
      message: error.message,
      detail: error.detail,
      code: error.code,
    });
    next(error);
  }
};

export const deleteMaster = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const masterId = parseInt(req.params.id);
    if (!masterId) throw new ValidationError('Invalid master ID');

    const result = await query('DELETE FROM masters WHERE id = $1 RETURNING id', [masterId]);

    if (result.rows.length === 0) {
      throw new NotFoundError('Master not found');
    }

    sendSuccess(res, null, 'Master deleted successfully');
  } catch (error) {
    next(error);
  }
};
