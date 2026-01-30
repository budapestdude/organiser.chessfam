import { query } from '../config/database';

export interface FAQ {
  id: number;
  question: string;
  answer: string;
  category: string;
  display_order: number;
  is_published: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateFAQInput {
  question: string;
  answer: string;
  category?: string;
  display_order?: number;
  is_published?: boolean;
}

export interface UpdateFAQInput {
  question?: string;
  answer?: string;
  category?: string;
  display_order?: number;
  is_published?: boolean;
}

/**
 * Get all FAQs (with optional filtering)
 */
export const getAllFAQs = async (filters?: {
  category?: string;
  is_published?: boolean;
  page?: number;
  limit?: number;
}) => {
  const page = filters?.page || 1;
  const limit = filters?.limit || 100;
  const offset = (page - 1) * limit;

  let queryText = `
    SELECT *
    FROM faqs
    WHERE 1=1
  `;
  const queryParams: any[] = [];
  let paramIndex = 1;

  if (filters?.category) {
    queryText += ` AND category = $${paramIndex++}`;
    queryParams.push(filters.category);
  }

  if (filters?.is_published !== undefined) {
    queryText += ` AND is_published = $${paramIndex++}`;
    queryParams.push(filters.is_published);
  }

  queryText += ` ORDER BY display_order ASC, id ASC`;
  queryText += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
  queryParams.push(limit, offset);

  const result = await query(queryText, queryParams);

  // Get total count
  let countQuery = 'SELECT COUNT(*) FROM faqs WHERE 1=1';
  const countParams: any[] = [];
  let countIndex = 1;

  if (filters?.category) {
    countQuery += ` AND category = $${countIndex++}`;
    countParams.push(filters.category);
  }

  if (filters?.is_published !== undefined) {
    countQuery += ` AND is_published = $${countIndex++}`;
    countParams.push(filters.is_published);
  }

  const countResult = await query(countQuery, countParams);
  const total = parseInt(countResult.rows[0].count);

  return {
    faqs: result.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get published FAQs for public viewing
 */
export const getPublishedFAQs = async (category?: string) => {
  let queryText = `
    SELECT id, question, answer, category, display_order
    FROM faqs
    WHERE is_published = true
  `;
  const queryParams: any[] = [];

  if (category) {
    queryText += ` AND category = $1`;
    queryParams.push(category);
  }

  queryText += ` ORDER BY display_order ASC, id ASC`;

  const result = await query(queryText, queryParams);
  return result.rows;
};

/**
 * Get all FAQ categories
 */
export const getFAQCategories = async () => {
  const result = await query(
    `SELECT DISTINCT category FROM faqs ORDER BY category`
  );
  return result.rows.map(row => row.category);
};

/**
 * Get FAQ by ID
 */
export const getFAQById = async (id: number) => {
  const result = await query(
    `SELECT * FROM faqs WHERE id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new Error('FAQ not found');
  }

  return result.rows[0];
};

/**
 * Create new FAQ
 */
export const createFAQ = async (input: CreateFAQInput) => {
  const {
    question,
    answer,
    category = 'General',
    display_order = 0,
    is_published = true,
  } = input;

  const result = await query(
    `INSERT INTO faqs (question, answer, category, display_order, is_published, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
     RETURNING *`,
    [question, answer, category, display_order, is_published]
  );

  return result.rows[0];
};

/**
 * Update FAQ
 */
export const updateFAQ = async (id: number, input: UpdateFAQInput) => {
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (input.question !== undefined) {
    updates.push(`question = $${paramIndex++}`);
    values.push(input.question);
  }

  if (input.answer !== undefined) {
    updates.push(`answer = $${paramIndex++}`);
    values.push(input.answer);
  }

  if (input.category !== undefined) {
    updates.push(`category = $${paramIndex++}`);
    values.push(input.category);
  }

  if (input.display_order !== undefined) {
    updates.push(`display_order = $${paramIndex++}`);
    values.push(input.display_order);
  }

  if (input.is_published !== undefined) {
    updates.push(`is_published = $${paramIndex++}`);
    values.push(input.is_published);
  }

  if (updates.length === 0) {
    throw new Error('No fields to update');
  }

  updates.push(`updated_at = NOW()`);
  values.push(id);

  const result = await query(
    `UPDATE faqs SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  if (result.rows.length === 0) {
    throw new Error('FAQ not found');
  }

  return result.rows[0];
};

/**
 * Delete FAQ
 */
export const deleteFAQ = async (id: number) => {
  const result = await query(
    `DELETE FROM faqs WHERE id = $1 RETURNING *`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new Error('FAQ not found');
  }

  return result.rows[0];
};

/**
 * Reorder FAQs
 */
export const reorderFAQs = async (faqOrders: { id: number; display_order: number }[]) => {
  // Update display orders in a transaction
  for (const { id, display_order } of faqOrders) {
    await query(
      `UPDATE faqs SET display_order = $1, updated_at = NOW() WHERE id = $2`,
      [display_order, id]
    );
  }

  return { success: true };
};
