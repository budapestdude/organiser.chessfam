import { query } from '../config/database';
import { NotFoundError, ValidationError, ForbiddenError, ConflictError } from '../utils/errors';
import * as emailService from './emailService';

// Helper to check if tournaments table exists (no caching to allow runtime fixes)
async function checkTableExists(): Promise<boolean> {
  try {
    await query(`SELECT 1 FROM tournaments LIMIT 1`);
    return true;
  } catch (error: any) {
    if (error.code === '42P01') { // Table doesn't exist
      console.warn('Tournaments table not found. Run migrations/005_create_tournaments_clubs_table.sql');
      return false;
    }
    throw error;
  }
}

// Mock data when table doesn't exist
const mockTournaments: TournamentWithOrganizer[] = [
  {
    id: 1,
    name: 'NYC Chess Championship',
    description: 'Annual city championship',
    tournament_type: 'Classical',
    time_control: '90+30',
    format: 'Swiss',
    start_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    current_participants: 42,
    max_participants: 64,
    entry_fee: 50,
    prize_pool: 2000,
    status: 'upcoming',
    image: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=400',
    created_at: new Date(),
    updated_at: new Date(),
    organizer_name: 'Marshall Chess Club',
    venue_name: 'Marshall Chess Club',
    venue_city: 'New York',
  },
  {
    id: 2,
    name: 'Blitz Battle',
    description: 'Weekly blitz tournament',
    tournament_type: 'Blitz',
    time_control: '3+2',
    format: 'Double Elimination',
    start_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    current_participants: 16,
    max_participants: 32,
    entry_fee: 20,
    prize_pool: 500,
    status: 'upcoming',
    image: 'https://images.unsplash.com/photo-1560174038-da43ac74f01b?w=400',
    created_at: new Date(),
    updated_at: new Date(),
    organizer_name: 'Chess Forum',
    venue_name: 'Chess Forum',
    venue_city: 'New York',
  },
];

export interface Tournament {
  id: number;
  organizer_id?: number;
  venue_id?: number;
  name: string;
  description?: string;
  tournament_type?: string;
  time_control?: string;
  format?: string;
  start_date: Date;
  end_date?: Date;
  registration_deadline?: Date;
  max_participants?: number;
  current_participants: number;
  entry_fee: number;
  prize_pool?: number;
  currency?: string; // ISO 4217 currency code (e.g., 'USD', 'EUR', 'GBP')
  rating_min?: number;
  rating_max?: number;
  status: string;
  image?: string;
  images?: string[]; // Gallery images
  rules?: string;
  external_registration_url?: string; // External registration URL (overrides internal flow)
  created_at: Date;
  updated_at: Date;
  // Tournament category fields
  tournament_category?: string;
  is_recurring?: boolean;
  recurrence_pattern?: string;
  recurrence_count?: number;
  parent_tournament_id?: number;
  is_festival?: boolean;
  festival_id?: number;
  is_festival_parent?: boolean;
  is_series_parent?: boolean;
  premium_discount_eligible?: boolean; // Staff-managed: true if 10% discount applies for premium members
  early_bird_pricing?: EarlyBirdTier[]; // Array of up to 3 early bird pricing tiers
  // Variable pricing discounts
  junior_discount?: number;
  senior_discount?: number;
  women_discount?: number;
  junior_age_max?: number;
  senior_age_min?: number;
  gm_wgm_discount?: number;
  im_wim_discount?: number;
  fm_wfm_discount?: number;
}

export interface EarlyBirdTier {
  deadline: string; // ISO date string
  discount: number; // Discount amount (percentage or fixed)
  discount_type: 'percentage' | 'fixed'; // Type of discount
  label: string; // Display label (e.g., "Super Early Bird", "Early Bird")
}

/**
 * Get the currently active early bird pricing tier based on current date
 * Returns the tier with the earliest deadline that hasn't passed yet
 */
export const getActiveEarlyBirdTier = (tiers: EarlyBirdTier[]): EarlyBirdTier | null => {
  if (!tiers || tiers.length === 0) return null;

  const now = new Date();

  // Filter tiers that haven't expired yet
  const activeTiers = tiers.filter(tier => new Date(tier.deadline) >= now);

  if (activeTiers.length === 0) return null;

  // Sort by deadline (earliest first) and return the first one
  activeTiers.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

  return activeTiers[0];
};

/**
 * Calculate the discounted price based on early bird tier
 */
export const calculateEarlyBirdPrice = (basePrice: number, tier: EarlyBirdTier | null): number => {
  if (!tier) return basePrice;

  if (tier.discount_type === 'percentage') {
    return basePrice * (1 - tier.discount / 100);
  } else {
    return Math.max(0, basePrice - tier.discount);
  }
};

export interface TournamentWithOrganizer extends Tournament {
  organizer_name?: string;
  venue_name?: string;
  venue_city?: string;
}

export interface CreateTournamentInput {
  name: string;
  description?: string;
  tournament_type?: string;
  time_control?: string;
  format?: string;
  start_date: string;
  end_date?: string;
  registration_deadline?: string;
  max_participants?: number;
  entry_fee?: number;
  prize_pool?: number;
  currency?: string; // ISO 4217 currency code
  rating_min?: number;
  rating_max?: number;
  venue_id?: number;
  image?: string;
  images?: string[]; // Gallery images
  rules?: string;
  external_registration_url?: string; // External registration URL (admin-only, overrides internal flow)
  // Location fields for OTB/hybrid tournaments
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  // Tournament category fields
  tournament_category?: string; // 'one-off', 'recurring', 'festival'
  is_recurring?: boolean;
  recurrence_pattern?: string; // 'weekly', 'biweekly', 'monthly'
  recurrence_count?: number;
  parent_tournament_id?: number;
  is_festival?: boolean;
  festival_id?: number;
  is_series_parent?: boolean;
  create_as_series?: boolean; // Flag to auto-create series parent
  early_bird_pricing?: EarlyBirdTier[]; // Array of up to 3 early bird pricing tiers
  // Variable pricing discounts
  junior_discount?: number; // Percentage discount for juniors (e.g., 20 for 20%)
  senior_discount?: number; // Percentage discount for seniors (e.g., 15 for 15%)
  women_discount?: number; // Percentage discount for women (e.g., 25 for 25%)
  junior_age_max?: number; // Max age for junior discount (default: 18)
  senior_age_min?: number; // Min age for senior discount (default: 65)
  // Titled player discounts
  gm_wgm_discount?: number; // Percentage discount for GM/WGM players (e.g., 30 for 30%)
  im_wim_discount?: number; // Percentage discount for IM/WIM players (e.g., 25 for 25%)
  fm_wfm_discount?: number; // Percentage discount for FM/WFM players (e.g., 20 for 20%)
}

export const getTournaments = async (filters: {
  status?: string;
  format?: string;
  city?: string;
  search?: string;
  upcoming?: boolean;
  page?: number;
  limit?: number;
  includeUnapproved?: boolean; // For admin panel
}): Promise<{ tournaments: TournamentWithOrganizer[]; total: number }> => {
  // Return mock data if table doesn't exist
  if (!(await checkTableExists())) {
    return { tournaments: mockTournaments, total: mockTournaments.length };
  }

  const { status, format, city, search, upcoming, page = 1, limit = 20, includeUnapproved = false } = filters;
  const offset = (page - 1) * limit;

  let whereClause = 'WHERE 1=1';
  const params: any[] = [];
  let paramIndex = 1;

  // Only show approved tournaments to regular users
  if (!includeUnapproved) {
    whereClause += ` AND t.approval_status = 'approved'`;
  }

  // Filter out series parents and festival parents (virtual containers, not real tournaments)
  whereClause += ` AND (t.is_series_parent = false OR t.is_series_parent IS NULL)`;
  whereClause += ` AND (t.is_festival_parent = false OR t.is_festival_parent IS NULL)`;

  if (status) {
    whereClause += ` AND t.status = $${paramIndex++}`;
    params.push(status);
  }

  if (format) {
    whereClause += ` AND t.format = $${paramIndex++}`;
    params.push(format);
  }

  if (city) {
    whereClause += ` AND LOWER(v.city) LIKE LOWER($${paramIndex++})`;
    params.push(`%${city}%`);
  }

  if (search) {
    // Fuzzy search using pg_trgm similarity (handles typos and partial matches)
    // Very generous threshold (0.1) and space-insensitive matching
    whereClause += ` AND (
      similarity(t.name, $${paramIndex}) > 0.1 OR
      similarity(COALESCE(t.description, ''), $${paramIndex}) > 0.1 OR
      word_similarity($${paramIndex}, t.name) > 0.2 OR
      similarity(REPLACE(LOWER(t.name), ' ', ''), REPLACE(LOWER($${paramIndex}), ' ', '')) > 0.3 OR
      t.name ILIKE $${paramIndex + 1} OR
      COALESCE(t.description, '') ILIKE $${paramIndex + 1}
    )`;
    params.push(search, `%${search}%`);
    paramIndex += 2;
  }

  if (upcoming) {
    whereClause += ` AND t.start_date >= CURRENT_DATE AND t.status = 'upcoming'`;
  }

  const countResult = await query(
    `SELECT COUNT(*) FROM tournaments t
     LEFT JOIN venues v ON t.venue_id = v.id
     ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].count);

  const result = await query(
    `SELECT t.*,
            u.name as organizer_name,
            v.name as venue_name,
            v.city as venue_city,
            (SELECT COUNT(*) FROM tournament_registrations WHERE tournament_id = t.id AND status = 'registered') as current_participants
            ${search ? `,
            GREATEST(
              similarity(t.name, $${paramIndex - 2}),
              similarity(COALESCE(t.description, ''), $${paramIndex - 2}),
              word_similarity($${paramIndex - 2}, t.name),
              similarity(REPLACE(LOWER(t.name), ' ', ''), REPLACE(LOWER($${paramIndex - 2}), ' ', ''))
            ) as search_rank` : ''}
     FROM tournaments t
     LEFT JOIN users u ON t.organizer_id = u.id
     LEFT JOIN venues v ON t.venue_id = v.id
     ${whereClause}
     ORDER BY ${search ? 'search_rank DESC,' : ''} t.start_date ASC
     LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    [...params, limit, offset]
  );

  // Parse JSON fields if they're strings
  const tournaments = result.rows.map((row: any) => {
    if (row.images && typeof row.images === 'string') {
      try {
        row.images = JSON.parse(row.images);
      } catch {
        row.images = [];
      }
    }
    if (row.early_bird_pricing && typeof row.early_bird_pricing === 'string') {
      try {
        row.early_bird_pricing = JSON.parse(row.early_bird_pricing);
      } catch {
        row.early_bird_pricing = [];
      }
    }
    return row;
  });

  return { tournaments, total };
};

export const getTournamentById = async (id: number): Promise<TournamentWithOrganizer> => {
  const result = await query(
    `SELECT t.*,
            u.name as organizer_name,
            v.name as venue_name,
            v.city as venue_city,
            v.address as venue_address,
            (SELECT COUNT(*) FROM tournament_registrations WHERE tournament_id = t.id AND status = 'registered') as current_participants
     FROM tournaments t
     LEFT JOIN users u ON t.organizer_id = u.id
     LEFT JOIN venues v ON t.venue_id = v.id
     WHERE t.id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Tournament not found');
  }

  const tournament = result.rows[0];

  // Parse JSON fields if they're strings
  if (tournament.images && typeof tournament.images === 'string') {
    try {
      tournament.images = JSON.parse(tournament.images);
    } catch {
      tournament.images = [];
    }
  }
  if (tournament.early_bird_pricing && typeof tournament.early_bird_pricing === 'string') {
    try {
      tournament.early_bird_pricing = JSON.parse(tournament.early_bird_pricing);
    } catch {
      tournament.early_bird_pricing = [];
    }
  }

  console.log('[getTournamentById] Tournament data:', {
    id: tournament.id,
    name: tournament.name,
    external_registration_url: tournament.external_registration_url
  });

  return tournament;
};

export const createTournament = async (
  organizerId: number,
  input: CreateTournamentInput
): Promise<Tournament> => {
  // Check if table exists first
  if (!(await checkTableExists())) {
    throw new ValidationError('Tournaments table not initialized. Please run database migrations.');
  }

  const {
    name,
    description,
    tournament_type,
    time_control,
    format,
    start_date,
    end_date,
    registration_deadline,
    max_participants,
    entry_fee = 0,
    prize_pool,
    rating_min,
    rating_max,
    venue_id,
    image,
    images,
    rules,
    address,
    city: inputCity,
    state,
    country: inputCountry,
    tournament_category = 'one-off',
    is_recurring = false,
    recurrence_pattern,
    recurrence_count,
    parent_tournament_id,
    is_festival = false,
    early_bird_pricing = [],
    junior_discount = 0,
    senior_discount = 0,
    women_discount = 0,
    junior_age_max,
    senior_age_min,
    gm_wgm_discount = 0,
    im_wim_discount = 0,
    fm_wfm_discount = 0,
    currency = 'USD',
  } = input;

  if (!name || !start_date) {
    throw new ValidationError('Name and start date are required');
  }

  // Convert empty strings to null for optional timestamp fields
  const normalizedEndDate = end_date === '' ? null : end_date;
  const normalizedDeadline = registration_deadline === '' ? null : registration_deadline;

  console.log('[Tournament Create] Creating tournament:', { name, organizerId, city: inputCity });

  const result = await query(
    `INSERT INTO tournaments (
       organizer_id, venue_id, name, description, tournament_type, time_control,
       format, start_date, end_date, registration_deadline, max_participants,
       entry_fee, prize_pool, rating_min, rating_max, image, images, rules, approval_status,
       tournament_category, is_recurring, recurrence_pattern, recurrence_count, parent_tournament_id, is_festival,
       early_bird_pricing, junior_discount, senior_discount, women_discount, junior_age_max, senior_age_min,
       gm_wgm_discount, im_wim_discount, fm_wfm_discount, currency
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35)
     RETURNING *`,
    [
      organizerId, venue_id, name, description, tournament_type, time_control,
      format, start_date, normalizedEndDate, normalizedDeadline, max_participants,
      entry_fee, prize_pool, rating_min, rating_max, image, JSON.stringify(images || []), rules, 'pending',
      tournament_category, is_recurring, recurrence_pattern, recurrence_count, parent_tournament_id, is_festival,
      JSON.stringify(early_bird_pricing || []), junior_discount, senior_discount, women_discount, junior_age_max, senior_age_min,
      gm_wgm_discount, im_wim_discount, fm_wfm_discount, currency
    ]
  );

  // Get location for community - either from venue or from direct input
  let city: string | undefined = inputCity;
  let country: string | undefined = inputCountry;
  let latitude: number | undefined;
  let longitude: number | undefined;

  if (venue_id) {
    // Get location from venue
    const venueResult = await query(`SELECT city, country, latitude, longitude FROM venues WHERE id = $1`, [venue_id]);
    if (venueResult.rows.length > 0) {
      city = venueResult.rows[0].city;
      country = venueResult.rows[0].country;
      latitude = venueResult.rows[0].latitude;
      longitude = venueResult.rows[0].longitude;
    }
  } else if (city) {
    // Geocode the provided address for accurate bubble assignment
    try {
      const { geocodeAddress } = await import('./geocodingService');
      const geoResult = await geocodeAddress({ address, city, state, country });
      if (geoResult) {
        latitude = geoResult.latitude;
        longitude = geoResult.longitude;
        console.log(`[Tournament] Geocoded "${city}" to coordinates: ${latitude}, ${longitude}`);
      }
    } catch (err) {
      console.error('[Tournament] Geocoding failed:', err);
    }
  }

  // Create associated community for the tournament (for city bubbles)
  const tags: string[] = ['tournament'];
  if (time_control) tags.push(time_control.toLowerCase());
  if (format) tags.push(format.toLowerCase());

  try {
    const communitiesService = await import('./communitiesService');
    await communitiesService.createCommunity(organizerId, {
      name,
      description,
      type: 'tournament',
      city,
      country,
      latitude,
      longitude,
      image,
      tags,
    });
  } catch (err) {
    // Log but don't fail tournament creation if community creation fails
    console.error('Failed to create community for tournament:', err);
  }

  return result.rows[0];
};

export const updateTournament = async (
  id: number,
  organizerId: number,
  input: Partial<CreateTournamentInput>,
  isAdmin: boolean = false
): Promise<Tournament> => {
  const tournament = await getTournamentById(id);

  if (tournament.organizer_id !== organizerId) {
    throw new ForbiddenError('Only the organizer can update this tournament');
  }

  if (tournament.status !== 'upcoming') {
    throw new ValidationError('Cannot update a tournament that has already started');
  }

  // Admin-only fields
  const adminOnlyFields = ['external_registration_url'];

  // If external_registration_url is being set and user is not admin, throw error
  if (!isAdmin && input.external_registration_url !== undefined) {
    throw new ForbiddenError('Only admins can set external registration URLs');
  }

  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  const fields = [
    'name', 'description', 'tournament_type', 'time_control', 'format',
    'start_date', 'end_date', 'registration_deadline', 'max_participants',
    'entry_fee', 'prize_pool', 'rating_min', 'rating_max', 'venue_id', 'image', 'images', 'rules',
    'external_registration_url', 'early_bird_pricing',
    'junior_discount', 'senior_discount', 'women_discount', 'junior_age_max', 'senior_age_min',
    'gm_wgm_discount', 'im_wim_discount', 'fm_wfm_discount', 'currency'
  ];

  for (const field of fields) {
    if (input[field as keyof CreateTournamentInput] !== undefined) {
      let value = input[field as keyof CreateTournamentInput];

      // Convert empty strings to null for timestamp fields
      if ((field === 'end_date' || field === 'registration_deadline') && value === '') {
        value = null;
      }

      // Serialize arrays to JSON
      if (field === 'images' || field === 'early_bird_pricing') {
        value = JSON.stringify(value || []);
      }

      updates.push(`${field} = $${paramIndex++}`);
      values.push(value);
    }
  }

  if (updates.length === 0) {
    return tournament;
  }

  updates.push(`updated_at = NOW()`);
  values.push(id);

  const result = await query(
    `UPDATE tournaments SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  return result.rows[0];
};

export const registerForTournament = async (
  tournamentId: number,
  userId: number
): Promise<any> => {
  const tournament = await getTournamentById(tournamentId);

  if (tournament.status !== 'upcoming') {
    throw new ValidationError('Registration is closed for this tournament');
  }

  if (tournament.registration_deadline && new Date(tournament.registration_deadline) < new Date()) {
    throw new ValidationError('Registration deadline has passed');
  }

  if (tournament.max_participants && tournament.current_participants >= tournament.max_participants) {
    throw new ValidationError('Tournament is full');
  }

  // Check if already registered
  const existing = await query(
    `SELECT id FROM tournament_registrations WHERE tournament_id = $1 AND user_id = $2`,
    [tournamentId, userId]
  );

  if (existing.rows.length > 0) {
    throw new ConflictError('You are already registered for this tournament');
  }

  // Check rating requirements
  if (tournament.rating_min || tournament.rating_max) {
    const userResult = await query(`SELECT rating FROM users WHERE id = $1`, [userId]);
    const userRating = userResult.rows[0]?.rating || 1500;

    if (tournament.rating_min && userRating < tournament.rating_min) {
      throw new ValidationError(`Your rating is below the minimum requirement (${tournament.rating_min})`);
    }
    if (tournament.rating_max && userRating > tournament.rating_max) {
      throw new ValidationError(`Your rating is above the maximum requirement (${tournament.rating_max})`);
    }
  }

  // Calculate entry fee with premium discount if applicable
  const originalEntryFee = tournament.entry_fee || 0;
  let finalEntryFee = originalEntryFee;
  let discountApplied = 0;
  let discountType: string | null = null;

  if (originalEntryFee > 0 && tournament.premium_discount_eligible) {
    // Check if user has premium subscription
    try {
      const { getSubscriptionStatus } = await import('./subscriptionService');
      const subscription = await getSubscriptionStatus(userId);

      // Apply 10% discount for premium members (including those in trial)
      if (subscription.tier === 'premium' || subscription.inTrial) {
        discountApplied = Math.round(originalEntryFee * 0.1 * 100) / 100; // 10% discount, rounded to 2 decimals
        finalEntryFee = originalEntryFee - discountApplied;
        discountType = 'premium_member';
      }
    } catch (error) {
      // If subscription check fails, continue without discount
      console.error('Failed to check subscription status for discount:', error);
    }
  }

  // Fetch user details for registration
  const userResult = await query(
    'SELECT name, email, rating FROM users WHERE id = $1',
    [userId]
  );

  if (userResult.rows.length === 0) {
    throw new NotFoundError('User not found');
  }

  const user = userResult.rows[0];

  // Register
  const paymentStatus = finalEntryFee > 0 ? 'pending' : 'paid';

  const result = await query(
    `INSERT INTO tournament_registrations (
      tournament_id, user_id, player_name, player_email, player_rating,
      payment_status, entry_fee, original_entry_fee, discount_applied, discount_type
    )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      tournamentId, userId, user.name, user.email, user.rating,
      paymentStatus, finalEntryFee, originalEntryFee, discountApplied, discountType
    ]
  );

  // Update participant count
  await query(
    `UPDATE tournaments SET current_participants = current_participants + 1, updated_at = NOW()
     WHERE id = $1`,
    [tournamentId]
  );

  // Send email notification to organizer
  try {
    if (tournament.organizer_id) {
      const organizerResult = await query(
        'SELECT name, email FROM users WHERE id = $1',
        [tournament.organizer_id]
      );

      if (organizerResult.rows.length > 0) {
        const organizer = organizerResult.rows[0];

        await emailService.sendTournamentNewRegistrationToOrganizer(
          organizer.email,
          {
            organizerName: organizer.name,
            tournamentName: tournament.name,
            tournamentId: tournament.id,
            playerName: user.name,
            playerEmail: user.email,
            playerRating: user.rating || undefined,
            totalParticipants: tournament.current_participants + 1,
            maxParticipants: tournament.max_participants || 999,
            entryFee: Math.round(finalEntryFee * 100), // Convert to cents
          }
        );
      }
    }
  } catch (emailError) {
    // Log but don't fail registration if email fails
    console.error('Failed to send organizer notification email:', emailError);
  }

  return result.rows[0];
};

export const withdrawFromTournament = async (
  tournamentId: number,
  userId: number
): Promise<void> => {
  const tournament = await getTournamentById(tournamentId);

  if (tournament.status !== 'upcoming') {
    throw new ValidationError('Cannot withdraw from a tournament that has already started');
  }

  const result = await query(
    `DELETE FROM tournament_registrations WHERE tournament_id = $1 AND user_id = $2 RETURNING id`,
    [tournamentId, userId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('You are not registered for this tournament');
  }

  // Send email notification to organizer
  try {
    if (tournament.organizer_id) {
      // Fetch organizer details
      const organizerResult = await query(
        'SELECT name, email FROM users WHERE id = $1',
        [tournament.organizer_id]
      );

      // Fetch user details
      const userResult = await query(
        'SELECT name, email FROM users WHERE id = $1',
        [userId]
      );

      // Check if refund was processed
      const refundResult = await query(
        `SELECT refund_amount, refund_percentage
         FROM tournament_refunds
         WHERE tournament_registration_id = $1 AND status = 'completed'`,
        [result.rows[0].id]
      );

      if (organizerResult.rows.length > 0 && userResult.rows.length > 0) {
        const organizer = organizerResult.rows[0];
        const user = userResult.rows[0];
        const refund = refundResult.rows[0];

        await emailService.sendTournamentWithdrawalToOrganizer(
          organizer.email,
          {
            organizerName: organizer.name,
            tournamentName: tournament.name,
            tournamentId: tournament.id,
            playerName: user.name,
            playerEmail: user.email,
            totalParticipants: tournament.current_participants - 1,
            maxParticipants: tournament.max_participants || 999,
            refundProcessed: !!refund,
            refundAmount: refund ? Math.round(refund.refund_amount * 100) : undefined, // Convert to cents
          }
        );
      }
    }
  } catch (emailError) {
    // Log but don't fail withdrawal if email fails
    console.error('Failed to send organizer withdrawal notification email:', emailError);
  }

  await query(
    `UPDATE tournaments SET current_participants = current_participants - 1, updated_at = NOW()
     WHERE id = $1`,
    [tournamentId]
  );
};

export const getTournamentParticipants = async (
  tournamentId: number,
  page: number = 1,
  limit: number = 50
): Promise<{ participants: any[]; total: number }> => {
  const offset = (page - 1) * limit;

  const countResult = await query(
    `SELECT COUNT(*) FROM tournament_registrations WHERE tournament_id = $1`,
    [tournamentId]
  );
  const total = parseInt(countResult.rows[0].count);

  const result = await query(
    `SELECT tr.*, u.name, u.rating, u.avatar
     FROM tournament_registrations tr
     JOIN users u ON tr.user_id = u.id
     WHERE tr.tournament_id = $1
     ORDER BY tr.created_at ASC
     LIMIT $2 OFFSET $3`,
    [tournamentId, limit, offset]
  );

  return { participants: result.rows, total };
};

export const getUserTournaments = async (userId: number): Promise<TournamentWithOrganizer[]> => {
  const result = await query(
    `SELECT t.*,
            u.name as organizer_name,
            tr.status as registration_status,
            tr.payment_status
     FROM tournaments t
     JOIN tournament_registrations tr ON t.id = tr.tournament_id
     LEFT JOIN users u ON t.organizer_id = u.id
     WHERE tr.user_id = $1
     ORDER BY t.start_date ASC`,
    [userId]
  );

  // Parse JSON fields if they're strings
  const tournaments = result.rows.map((row: any) => {
    if (row.images && typeof row.images === 'string') {
      try {
        row.images = JSON.parse(row.images);
      } catch {
        row.images = [];
      }
    }
    if (row.early_bird_pricing && typeof row.early_bird_pricing === 'string') {
      try {
        row.early_bird_pricing = JSON.parse(row.early_bird_pricing);
      } catch {
        row.early_bird_pricing = [];
      }
    }
    return row;
  });

  return tournaments;
};

export const isUserRegistered = async (
  tournamentId: number,
  userId: number
): Promise<boolean> => {
  const result = await query(
    `SELECT id FROM tournament_registrations WHERE tournament_id = $1 AND user_id = $2`,
    [tournamentId, userId]
  );

  return result.rows.length > 0;
};

export const getMyTournaments = async (userId: number): Promise<TournamentWithOrganizer[]> => {
  const result = await query(
    `SELECT t.*,
            u.name as organizer_name,
            v.name as venue_name,
            v.city as venue_city,
            (SELECT COUNT(*) FROM tournament_registrations WHERE tournament_id = t.id AND status = 'registered') as current_participants
     FROM tournaments t
     LEFT JOIN users u ON t.organizer_id = u.id
     LEFT JOIN venues v ON t.venue_id = v.id
     WHERE t.organizer_id = $1
     ORDER BY t.start_date DESC`,
    [userId]
  );

  // Parse JSON fields if they're strings
  const tournaments = result.rows.map((row: any) => {
    if (row.images && typeof row.images === 'string') {
      try {
        row.images = JSON.parse(row.images);
      } catch {
        row.images = [];
      }
    }
    if (row.early_bird_pricing && typeof row.early_bird_pricing === 'string') {
      try {
        row.early_bird_pricing = JSON.parse(row.early_bird_pricing);
      } catch {
        row.early_bird_pricing = [];
      }
    }
    return row;
  });

  return tournaments;
};

export const deleteTournament = async (
  id: number,
  organizerId: number
): Promise<void> => {
  const tournament = await getTournamentById(id);

  if (tournament.organizer_id !== organizerId) {
    throw new ForbiddenError('Only the organizer can delete this tournament');
  }

  if (tournament.status !== 'upcoming') {
    throw new ValidationError('Cannot delete a tournament that has already started');
  }

  // Check if there are any registrations
  const registrationsResult = await query(
    `SELECT COUNT(*) FROM tournament_registrations WHERE tournament_id = $1`,
    [id]
  );
  const registrationCount = parseInt(registrationsResult.rows[0].count);

  if (registrationCount > 0) {
    throw new ValidationError('Cannot delete tournament with existing registrations. Please contact participants first.');
  }

  // Delete the tournament
  await query(`DELETE FROM tournaments WHERE id = $1`, [id]);

  // Try to delete associated community (don't fail if it doesn't exist)
  try {
    await query(`DELETE FROM communities WHERE name = $1 AND type = 'tournament'`, [tournament.name]);
  } catch (err) {
    console.error('Failed to delete associated community:', err);
  }
};

/**
 * Get all tournament series (series parents only)
 */
export const getAllTournamentSeries = async () => {
  const tableExists = await checkTableExists();
  if (!tableExists) {
    throw new ValidationError('Tournaments table not available');
  }

  // Check if organizer_name_override column exists
  const columnCheck = await query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_name = 'tournaments'
     AND column_name = 'organizer_name_override'`
  );

  const hasOrganizerOverride = columnCheck.rows.length > 0;

  // Use organizer_name_override if it exists, otherwise just use u.name
  const organizerNameSelect = hasOrganizerOverride
    ? 'COALESCE(t.organizer_name_override, u.name) as organizer_name'
    : 'u.name as organizer_name';

  const result = await query(
    `SELECT t.id, t.name, t.description, t.image, t.images, t.created_at, t.updated_at,
            t.organizer_id, t.status, t.is_series_parent, t.tournament_category,
            ${hasOrganizerOverride ? 't.organizer_name_override,' : ''}
            ${organizerNameSelect},
            COUNT(editions.id) as edition_count
     FROM tournaments t
     LEFT JOIN users u ON t.organizer_id = u.id
     LEFT JOIN tournaments editions ON editions.parent_tournament_id = t.id AND editions.is_series_parent = false
     WHERE t.is_series_parent = true
     GROUP BY t.id, u.name ${hasOrganizerOverride ? ', t.organizer_name_override' : ''}
     ORDER BY t.created_at DESC`
  );

  // Parse JSON fields if they're strings
  const series = result.rows.map((row: any) => {
    if (row.images && typeof row.images === 'string') {
      try {
        row.images = JSON.parse(row.images);
      } catch {
        row.images = [];
      }
    }
    return row;
  });

  return series;
};

/**
 * Update tournament series parent information
 */
export const updateTournamentSeries = async (
  seriesId: number,
  userId: number,
  updateData: {
    name?: string;
    description?: string;
    image?: string;
    images?: string[];
    organizer_name_override?: string;
  }
) => {
  try {
    console.log('[updateTournamentSeries] Starting update:', { seriesId, userId, updateData });

    const tableExists = await checkTableExists();
    if (!tableExists) {
      throw new ValidationError('Tournaments table not available');
    }

    // Check if organizer_name_override column exists
    const columnCheck = await query(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_name = 'tournaments'
       AND column_name = 'organizer_name_override'`
    );
    const hasOrganizerOverride = columnCheck.rows.length > 0;
    console.log('[updateTournamentSeries] Has organizer_name_override column:', hasOrganizerOverride);

    // Get series parent
    console.log('[updateTournamentSeries] Fetching series:', seriesId);
    const seriesResult = await query(
      `SELECT * FROM tournaments WHERE id = $1 AND is_series_parent = true`,
      [seriesId]
    );

    if (seriesResult.rows.length === 0) {
      console.log('[updateTournamentSeries] Series not found:', seriesId);
      throw new NotFoundError('Tournament series not found');
    }

    const series = seriesResult.rows[0];
    console.log('[updateTournamentSeries] Found series:', { id: series.id, organizer_id: series.organizer_id });

    // Check if user is admin or organizer
    console.log('[updateTournamentSeries] Checking user permissions:', userId);
    const userResult = await query(`SELECT is_admin FROM users WHERE id = $1`, [userId]);
    console.log('[updateTournamentSeries] User query result:', userResult.rows[0]);

    const isAdmin = userResult.rows[0]?.is_admin === true;
    const isOrganizer = series.organizer_id === userId;

    console.log('[updateTournamentSeries] Permission check:', { isAdmin, isOrganizer, seriesOrganizerID: series.organizer_id, userId });

    if (!isAdmin && !isOrganizer) {
      throw new ForbiddenError('You do not have permission to edit this series');
    }

    // Build update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updateData.name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(updateData.name);
    }
    if (updateData.description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(updateData.description);
    }
    if (updateData.image !== undefined) {
      updates.push(`image = $${paramCount++}`);
      values.push(updateData.image);
    }
    if (updateData.images !== undefined) {
      updates.push(`images = $${paramCount++}`);
      values.push(JSON.stringify(updateData.images));
    }
    // Only update organizer_name_override if the column exists
    if (updateData.organizer_name_override !== undefined && hasOrganizerOverride) {
      updates.push(`organizer_name_override = $${paramCount++}`);
      values.push(updateData.organizer_name_override || null);
    }

    if (updates.length === 0) {
      console.log('[updateTournamentSeries] No updates to apply');
      return series; // Nothing to update
    }

    updates.push(`updated_at = NOW()`);
    values.push(seriesId);

    const sqlQuery = `UPDATE tournaments SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    console.log('[updateTournamentSeries] Executing query:', { sqlQuery, values });

    const updateResult = await query(sqlQuery, values);

    console.log('[updateTournamentSeries] Update successful:', updateResult.rows[0]);
    return updateResult.rows[0];
  } catch (error) {
    console.error('[updateTournamentSeries] Error:', error);
    throw error;
  }
};

/**
 * Get tournament series data (parent + all editions + stats)
 */
export const getTournamentSeries = async (tournamentId: number) => {
  // 1. Get the requested tournament
  const tournamentResult = await query(
    `SELECT * FROM tournaments WHERE id = $1`,
    [tournamentId]
  );

  if (tournamentResult.rows.length === 0) {
    throw new NotFoundError('Tournament not found');
  }

  const tournament = tournamentResult.rows[0];

  // 2. Determine parent ID
  let parentId: number;
  if (tournament.is_series_parent) {
    // This IS the series parent
    parentId = tournamentId;
  } else if (tournament.parent_tournament_id) {
    // This is an edition, use its parent
    parentId = tournament.parent_tournament_id;
  } else {
    // Standalone tournament, no series
    throw new ValidationError('This tournament is not part of a series');
  }

  // 3. Fetch parent
  const parentResult = await query(
    `SELECT * FROM tournaments WHERE id = $1 AND is_series_parent = true`,
    [parentId]
  );

  if (parentResult.rows.length === 0) {
    throw new NotFoundError('Series parent not found');
  }

  const parent = parentResult.rows[0];

  // Parse JSON fields if they're strings
  if (parent.images && typeof parent.images === 'string') {
    try {
      parent.images = JSON.parse(parent.images);
    } catch {
      parent.images = [];
    }
  }
  if (parent.early_bird_pricing && typeof parent.early_bird_pricing === 'string') {
    try {
      parent.early_bird_pricing = JSON.parse(parent.early_bird_pricing);
    } catch {
      parent.early_bird_pricing = [];
    }
  }

  // 4. Fetch all editions
  const editionsResult = await query(
    `SELECT t.*,
            u.name as organizer_name,
            v.name as venue_name,
            v.city as venue_city
     FROM tournaments t
     LEFT JOIN users u ON t.organizer_id = u.id
     LEFT JOIN venues v ON t.venue_id = v.id
     WHERE t.parent_tournament_id = $1
       AND (t.is_series_parent = false OR t.is_series_parent IS NULL)
     ORDER BY t.start_date DESC`,
    [parentId]
  );

  // Parse JSON fields if they're strings
  const editions = editionsResult.rows.map((row: any) => {
    if (row.images && typeof row.images === 'string') {
      try {
        row.images = JSON.parse(row.images);
      } catch {
        row.images = [];
      }
    }
    if (row.early_bird_pricing && typeof row.early_bird_pricing === 'string') {
      try {
        row.early_bird_pricing = JSON.parse(row.early_bird_pricing);
      } catch {
        row.early_bird_pricing = [];
      }
    }
    return row;
  });

  // 5. Calculate stats
  const totalParticipants = editions.reduce(
    (sum: number, ed: any) => sum + (ed.current_participants || 0),
    0
  );

  const now = new Date();
  const upcomingEditions = editions.filter((ed: any) =>
    new Date(ed.start_date) >= now && ed.status === 'upcoming'
  ).sort((a: any, b: any) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

  const pastEditions = editions.filter((ed: any) =>
    new Date(ed.start_date) < now || ed.status === 'completed'
  );

  return {
    parent,
    editions,
    stats: {
      totalEditions: editions.length,
      totalParticipants,
      nextEdition: upcomingEditions[0] || null,
      pastEditions,
      upcomingEditions
    }
  };
};

/**
 * Get all images across all editions of a series
 */
export const getTournamentSeriesImages = async (tournamentId: number) => {
  const { parent } = await getTournamentSeries(tournamentId);

  const result = await query(
    `SELECT images, image FROM tournaments
     WHERE (parent_tournament_id = $1 OR id = $1)
     AND (is_series_parent = false OR is_series_parent IS NULL)`,
    [parent.id]
  );

  const allImages: string[] = [];

  // Add series parent cover image if exists
  if (parent.image) {
    allImages.push(parent.image);
  }

  // Add all gallery images from editions
  result.rows.forEach((row: any) => {
    if (row.image) allImages.push(row.image);
    if (row.images) {
      const images = typeof row.images === 'string'
        ? JSON.parse(row.images)
        : row.images;
      allImages.push(...images);
    }
  });

  return allImages;
};

/**
 * Get all reviews across all editions of a series
 */
export const getTournamentSeriesReviews = async (
  tournamentId: number,
  page: number = 1,
  limit: number = 20
) => {
  const { parent } = await getTournamentSeries(tournamentId);
  const offset = (page - 1) * limit;

  // Get all edition IDs
  const editionsResult = await query(
    `SELECT id FROM tournaments
     WHERE parent_tournament_id = $1 AND (is_series_parent = false OR is_series_parent IS NULL)`,
    [parent.id]
  );
  const tournamentIds = editionsResult.rows.map((r: any) => r.id);

  if (tournamentIds.length === 0) {
    return { reviews: [], total: 0, averageRating: 0 };
  }

  // Get review stats
  const countResult = await query(
    `SELECT COUNT(*) as total, AVG(rating) as avg_rating
     FROM tournament_reviews
     WHERE tournament_id = ANY($1)`,
    [tournamentIds]
  );

  // Get paginated reviews
  const reviewsResult = await query(
    `SELECT tr.*,
            u.name as reviewer_name,
            u.avatar as reviewer_avatar,
            t.name as tournament_name,
            t.start_date as tournament_date
     FROM tournament_reviews tr
     JOIN users u ON tr.reviewer_id = u.id
     JOIN tournaments t ON tr.tournament_id = t.id
     WHERE tr.tournament_id = ANY($1)
     ORDER BY tr.created_at DESC
     LIMIT $2 OFFSET $3`,
    [tournamentIds, limit, offset]
  );

  return {
    reviews: reviewsResult.rows,
    total: parseInt(countResult.rows[0]?.total || '0'),
    averageRating: parseFloat(countResult.rows[0]?.avg_rating || '0')
  };
};

/**
 * Create a tournament series (parent + first edition)
 */
export const createTournamentSeries = async (
  seriesData: {
    seriesName: string;
    seriesDescription?: string;
    seriesImage?: string;
  },
  firstEditionData: any,
  organizerId: number
) => {
  // 1. Create series parent
  const parentResult = await query(
    `INSERT INTO tournaments (
      name, description, image, organizer_id,
      is_series_parent, tournament_category,
      status, current_participants, entry_fee,
      created_at, updated_at
    ) VALUES ($1, $2, $3, $4, true, 'series', 'upcoming', 0, 0, NOW(), NOW())
    RETURNING *`,
    [seriesData.seriesName, seriesData.seriesDescription, seriesData.seriesImage, organizerId]
  );

  const parent = parentResult.rows[0];

  // 2. Create first edition linked to parent
  const edition = await createTournament(organizerId, {
    ...firstEditionData,
    parent_tournament_id: parent.id,
    tournament_category: 'recurring'
  });

  return { parent, firstEdition: edition };
};

// ============ FESTIVAL MANAGEMENT ============

/**
 * Convert an existing tournament to a festival parent
 * This creates a festival container and keeps the original as the first event
 */
export const convertToFestival = async (
  tournamentId: number,
  organizerId: number
): Promise<{ parent: Tournament; originalEvent: Tournament }> => {
  // Get the original tournament
  const tournament = await getTournamentById(tournamentId);

  if (tournament.organizer_id !== organizerId) {
    throw new ForbiddenError('Only the organizer can convert this tournament to a festival');
  }

  if (tournament.is_festival_parent) {
    throw new ValidationError('This tournament is already a festival parent');
  }

  if (tournament.festival_id) {
    throw new ValidationError('This tournament is already part of a festival');
  }

  // 1. Create festival parent with same basic info
  const parentResult = await query(
    `INSERT INTO tournaments (
      name, description, image, images, organizer_id,
      venue_id, start_date, end_date, status,
      is_festival_parent, tournament_category,
      current_participants, entry_fee,
      created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, 'festival', 0, 0, NOW(), NOW())
    RETURNING *`,
    [
      tournament.name,
      tournament.description,
      tournament.image,
      JSON.stringify(tournament.images || []),
      organizerId,
      tournament.venue_id,
      tournament.start_date,
      tournament.end_date,
      tournament.status
    ]
  );

  const parent = parentResult.rows[0];

  // 2. Update original tournament to be an event of this festival
  const eventResult = await query(
    `UPDATE tournaments
     SET festival_id = $1,
         is_festival = true,
         name = $2,
         updated_at = NOW()
     WHERE id = $3
     RETURNING *`,
    [parent.id, `${tournament.name} - Main Event`, tournamentId]
  );

  return { parent: parentResult.rows[0], originalEvent: eventResult.rows[0] };
};

/**
 * Create a new event within an existing festival
 */
export const createFestivalEvent = async (
  festivalId: number,
  organizerId: number,
  eventData: CreateTournamentInput
): Promise<Tournament> => {
  // Verify festival exists and user is organizer
  const festival = await getTournamentById(festivalId);

  if (!festival.is_festival_parent) {
    throw new ValidationError('This tournament is not a festival parent');
  }

  if (festival.organizer_id !== organizerId) {
    throw new ForbiddenError('Only the festival organizer can add events');
  }

  // Check event limit (10 events max)
  const countResult = await query(
    `SELECT COUNT(*) FROM tournaments WHERE festival_id = $1`,
    [festivalId]
  );
  const eventCount = parseInt(countResult.rows[0].count);

  if (eventCount >= 10) {
    throw new ValidationError('Maximum 10 events allowed per festival');
  }

  // Create the event as a regular tournament linked to the festival
  const event = await createTournament(organizerId, {
    ...eventData,
    is_festival: true,
    festival_id: festivalId,
    tournament_category: 'festival',
    venue_id: eventData.venue_id || festival.venue_id // Inherit venue from festival if not specified
  });

  return event;
};

/**
 * Get all events for a festival
 */
export const getFestivalEvents = async (festivalId: number): Promise<TournamentWithOrganizer[]> => {
  const result = await query(
    `SELECT t.*,
            u.name as organizer_name,
            v.name as venue_name,
            v.city as venue_city,
            (SELECT COUNT(*) FROM tournament_registrations WHERE tournament_id = t.id AND status = 'registered') as current_participants
     FROM tournaments t
     LEFT JOIN users u ON t.organizer_id = u.id
     LEFT JOIN venues v ON t.venue_id = v.id
     WHERE t.festival_id = $1
     ORDER BY t.start_date ASC, t.created_at ASC`,
    [festivalId]
  );

  // Parse JSON fields if they're strings
  const tournaments = result.rows.map((row: any) => {
    if (row.images && typeof row.images === 'string') {
      try {
        row.images = JSON.parse(row.images);
      } catch {
        row.images = [];
      }
    }
    if (row.early_bird_pricing && typeof row.early_bird_pricing === 'string') {
      try {
        row.early_bird_pricing = JSON.parse(row.early_bird_pricing);
      } catch {
        row.early_bird_pricing = [];
      }
    }
    return row;
  });

  return tournaments;
};

/**
 * Remove an event from a festival (converts it back to a standalone tournament)
 */
export const removeFestivalEvent = async (
  eventId: number,
  organizerId: number
): Promise<Tournament> => {
  const event = await getTournamentById(eventId);

  if (!event.festival_id) {
    throw new ValidationError('This tournament is not part of a festival');
  }

  // Verify organizer
  const festival = await getTournamentById(event.festival_id);
  if (festival.organizer_id !== organizerId) {
    throw new ForbiddenError('Only the festival organizer can remove events');
  }

  // Remove festival link
  const result = await query(
    `UPDATE tournaments
     SET festival_id = NULL,
         is_festival = false,
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [eventId]
  );

  return result.rows[0];
};

/**
 * Delete a festival and all its events
 */
export const deleteFestival = async (
  festivalId: number,
  organizerId: number
): Promise<void> => {
  const festival = await getTournamentById(festivalId);

  if (!festival.is_festival_parent) {
    throw new ValidationError('This tournament is not a festival parent');
  }

  if (festival.organizer_id !== organizerId) {
    throw new ForbiddenError('Only the festival organizer can delete the festival');
  }

  // Delete all festival events
  await query(
    `DELETE FROM tournaments WHERE festival_id = $1`,
    [festivalId]
  );

  // Delete the festival parent
  await query(
    `DELETE FROM tournaments WHERE id = $1`,
    [festivalId]
  );
};

// ===== REFUND POLICY FUNCTIONS =====

/**
 * Check if user is eligible for refund
 */
export const checkRefundEligibility = async (registrationId: number, userId: number) => {
  const result = await query(
    `SELECT * FROM refund_eligibility WHERE registration_id = $1 AND user_id = $2`,
    [registrationId, userId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Registration not found');
  }

  const registration = result.rows[0];

  // Calculate refund amount if eligible
  if (registration.eligibility_status === 'eligible') {
    const refundCalc = await query(
      `SELECT * FROM calculate_refund_amount($1, $2, CURRENT_DATE)`,
      [registration.tournament_id, registration.payment_amount]
    );

    return {
      ...registration,
      refund_calculation: refundCalc.rows[0]
    };
  }

  return registration;
};

/**
 * Request a refund
 */
export const requestRefund = async (registrationId: number, userId: number, reason?: string) => {
  // Check eligibility
  const eligibility = await checkRefundEligibility(registrationId, userId);

  if (eligibility.eligibility_status !== 'eligible') {
    throw new ValidationError(`Refund not available: ${eligibility.eligibility_status}`);
  }

  // Get registration details
  const registration = await query(
    `SELECT * FROM tournament_registrations WHERE id = $1 AND user_id = $2`,
    [registrationId, userId]
  );

  if (registration.rows.length === 0) {
    throw new NotFoundError('Registration not found');
  }

  const reg = registration.rows[0];

  // Calculate refund amount
  const refundCalc = await query(
    `SELECT * FROM calculate_refund_amount($1, $2, CURRENT_DATE)`,
    [reg.tournament_id, reg.payment_amount]
  );

  const calc = refundCalc.rows[0];

  // Create refund request
  const refund = await query(
    `INSERT INTO tournament_refunds (
      tournament_registration_id,
      tournament_id,
      user_id,
      original_payment_id,
      original_amount,
      refund_percentage,
      stripe_fee_amount,
      refund_amount,
      reason,
      status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')
    RETURNING *`,
    [
      registrationId,
      reg.tournament_id,
      userId,
      reg.payment_intent_id,
      reg.payment_amount,
      calc.refund_percentage,
      calc.stripe_fee_amount,
      calc.refund_amount,
      reason
    ]
  );

  // Update registration
  await query(
    `UPDATE tournament_registrations
     SET refund_requested = true, refund_status = 'pending'
     WHERE id = $1`,
    [registrationId]
  );

  return refund.rows[0];
};

/**
 * Process a refund (called automatically or by admin)
 */
export const processRefund = async (refundId: number) => {
  const refund = await query(
    `SELECT * FROM tournament_refunds WHERE id = $1`,
    [refundId]
  );

  if (refund.rows.length === 0) {
    throw new NotFoundError('Refund not found');
  }

  const refundData = refund.rows[0];

  if (refundData.status !== 'pending') {
    throw new ValidationError(`Refund already processed: ${refundData.status}`);
  }

  try {
    // Update status to processing
    await query(
      `UPDATE tournament_refunds SET status = 'processing', updated_at = NOW() WHERE id = $1`,
      [refundId]
    );

    // Here you would integrate with Stripe to process the actual refund
    // For now, we'll simulate it
    // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    // const stripeRefund = await stripe.refunds.create({
    //   payment_intent: refundData.original_payment_id,
    //   amount: Math.round(refundData.refund_amount * 100), // Stripe uses cents
    // });

    // Simulate successful refund
    const stripeRefundId = `re_simulated_${Date.now()}`;

    // Update refund as completed
    await query(
      `UPDATE tournament_refunds
       SET status = 'completed',
           stripe_refund_id = $1,
           processed_at = NOW(),
           updated_at = NOW()
       WHERE id = $2`,
      [stripeRefundId, refundId]
    );

    // Update registration
    await query(
      `UPDATE tournament_registrations
       SET refund_status = 'completed',
           refunded_at = NOW()
       WHERE id = $1`,
      [refundData.tournament_registration_id]
    );

    // Decrement participant count
    await query(
      `UPDATE tournaments
       SET current_participants = GREATEST(current_participants - 1, 0)
       WHERE id = $1`,
      [refundData.tournament_id]
    );

    return {
      success: true,
      refund_amount: refundData.refund_amount,
      stripe_refund_id: stripeRefundId
    };
  } catch (error: any) {
    // Update refund as failed
    await query(
      `UPDATE tournament_refunds
       SET status = 'failed',
           error_message = $1,
           updated_at = NOW()
       WHERE id = $2`,
      [error.message, refundId]
    );

    throw error;
  }
};

/**
 * Get refund history for a user
 */
export const getUserRefunds = async (userId: number) => {
  const result = await query(
    `SELECT
      r.*,
      t.name as tournament_name,
      t.start_date as tournament_start_date
     FROM tournament_refunds r
     JOIN tournaments t ON r.tournament_id = t.id
     WHERE r.user_id = $1
     ORDER BY r.requested_at DESC`,
    [userId]
  );

  return result.rows;
};

/**
 * Get refund history for a tournament (organizer view)
 */
export const getTournamentRefunds = async (tournamentId: number, organizerId: number) => {
  // Verify organizer
  const tournament = await query(
    `SELECT organizer_id FROM tournaments WHERE id = $1`,
    [tournamentId]
  );

  if (tournament.rows.length === 0) {
    throw new NotFoundError('Tournament not found');
  }

  if (tournament.rows[0].organizer_id !== organizerId) {
    throw new ForbiddenError('Only the organizer can view refunds');
  }

  const result = await query(
    `SELECT
      r.*,
      u.name as user_name,
      u.email as user_email,
      tr.player_name
     FROM tournament_refunds r
     JOIN users u ON r.user_id = u.id
     JOIN tournament_registrations tr ON r.tournament_registration_id = tr.id
     WHERE r.tournament_id = $1
     ORDER BY r.requested_at DESC`,
    [tournamentId]
  );

  return result.rows;
};
