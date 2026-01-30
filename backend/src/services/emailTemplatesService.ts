import { query } from '../config/database';
import { NotFoundError, ValidationError } from '../utils/errors';

export interface EmailTemplate {
  id: number;
  template_key: string;
  template_name: string;
  subject: string;
  html_content: string;
  text_content: string;
  variables: string[];
  category: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateEmailTemplateInput {
  template_key: string;
  template_name: string;
  subject: string;
  html_content: string;
  text_content: string;
  variables?: string[];
  category?: string;
  is_active?: boolean;
}

export interface UpdateEmailTemplateInput {
  template_name?: string;
  subject?: string;
  html_content?: string;
  text_content?: string;
  variables?: string[];
  category?: string;
  is_active?: boolean;
}

/**
 * Get all email templates with pagination and filtering
 */
export const getAllEmailTemplates = async (filters?: {
  category?: string;
  is_active?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}) => {
  const page = filters?.page || 1;
  const limit = filters?.limit || 100;
  const offset = (page - 1) * limit;

  let queryText = `SELECT * FROM email_templates WHERE 1=1`;
  const queryParams: any[] = [];
  let paramIndex = 1;

  // Filter by category
  if (filters?.category) {
    queryText += ` AND category = $${paramIndex++}`;
    queryParams.push(filters.category);
  }

  // Filter by active status
  if (filters?.is_active !== undefined) {
    queryText += ` AND is_active = $${paramIndex++}`;
    queryParams.push(filters.is_active);
  }

  // Search in template name, subject, or template key
  if (filters?.search) {
    queryText += ` AND (
      template_name ILIKE $${paramIndex} OR
      template_key ILIKE $${paramIndex} OR
      subject ILIKE $${paramIndex}
    )`;
    queryParams.push(`%${filters.search}%`);
    paramIndex++;
  }

  // Get total count
  const countQuery = queryText.replace('SELECT *', 'SELECT COUNT(*)');
  const countResult = await query(countQuery, queryParams);
  const total = parseInt(countResult.rows[0].count);

  // Add pagination
  queryText += ` ORDER BY category, template_name LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
  queryParams.push(limit, offset);

  const result = await query(queryText, queryParams);

  return {
    templates: result.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get a single email template by ID
 */
export const getEmailTemplateById = async (id: number): Promise<EmailTemplate> => {
  const result = await query(
    `SELECT * FROM email_templates WHERE id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Email template not found');
  }

  return result.rows[0];
};

/**
 * Get a single email template by key
 */
export const getEmailTemplateByKey = async (templateKey: string): Promise<EmailTemplate | null> => {
  const result = await query(
    `SELECT * FROM email_templates WHERE template_key = $1 AND is_active = true`,
    [templateKey]
  );

  return result.rows.length > 0 ? result.rows[0] : null;
};

/**
 * Get all unique categories
 */
export const getEmailTemplateCategories = async (): Promise<string[]> => {
  const result = await query(
    `SELECT DISTINCT category FROM email_templates ORDER BY category`
  );

  return result.rows.map(row => row.category);
};

/**
 * Create a new email template
 */
export const createEmailTemplate = async (
  data: CreateEmailTemplateInput
): Promise<EmailTemplate> => {
  const {
    template_key,
    template_name,
    subject,
    html_content,
    text_content,
    variables = [],
    category = 'General',
    is_active = true,
  } = data;

  // Validate required fields
  if (!template_key || !template_name || !subject || !html_content || !text_content) {
    throw new ValidationError('Missing required fields');
  }

  // Check if template_key already exists
  const existingTemplate = await query(
    `SELECT id FROM email_templates WHERE template_key = $1`,
    [template_key]
  );

  if (existingTemplate.rows.length > 0) {
    throw new ValidationError(`Template with key '${template_key}' already exists`);
  }

  const result = await query(
    `INSERT INTO email_templates
      (template_key, template_name, subject, html_content, text_content, variables, category, is_active, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
     RETURNING *`,
    [template_key, template_name, subject, html_content, text_content, JSON.stringify(variables), category, is_active]
  );

  return result.rows[0];
};

/**
 * Update an email template
 */
export const updateEmailTemplate = async (
  id: number,
  data: UpdateEmailTemplateInput
): Promise<EmailTemplate> => {
  // Check if template exists
  await getEmailTemplateById(id);

  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (data.template_name !== undefined) {
    updates.push(`template_name = $${paramIndex++}`);
    values.push(data.template_name);
  }

  if (data.subject !== undefined) {
    updates.push(`subject = $${paramIndex++}`);
    values.push(data.subject);
  }

  if (data.html_content !== undefined) {
    updates.push(`html_content = $${paramIndex++}`);
    values.push(data.html_content);
  }

  if (data.text_content !== undefined) {
    updates.push(`text_content = $${paramIndex++}`);
    values.push(data.text_content);
  }

  if (data.variables !== undefined) {
    updates.push(`variables = $${paramIndex++}`);
    values.push(JSON.stringify(data.variables));
  }

  if (data.category !== undefined) {
    updates.push(`category = $${paramIndex++}`);
    values.push(data.category);
  }

  if (data.is_active !== undefined) {
    updates.push(`is_active = $${paramIndex++}`);
    values.push(data.is_active);
  }

  if (updates.length === 0) {
    throw new ValidationError('No fields to update');
  }

  updates.push(`updated_at = NOW()`);
  values.push(id);

  const result = await query(
    `UPDATE email_templates SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  return result.rows[0];
};

/**
 * Delete an email template
 */
export const deleteEmailTemplate = async (id: number): Promise<void> => {
  const result = await query(
    `DELETE FROM email_templates WHERE id = $1 RETURNING id`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Email template not found');
  }
};

/**
 * Duplicate an email template
 */
export const duplicateEmailTemplate = async (id: number): Promise<EmailTemplate> => {
  const original = await getEmailTemplateById(id);

  // Create a unique template_key by appending _copy and timestamp
  const newTemplateKey = `${original.template_key}_copy_${Date.now()}`;
  const newTemplateName = `${original.template_name} (Copy)`;

  return createEmailTemplate({
    template_key: newTemplateKey,
    template_name: newTemplateName,
    subject: original.subject,
    html_content: original.html_content,
    text_content: original.text_content,
    variables: original.variables,
    category: original.category,
    is_active: false, // Duplicates start as inactive
  });
};

/**
 * Render template with variables
 */
export const renderTemplate = (template: string, variables: Record<string, any>): string => {
  let rendered = template;

  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = new RegExp(`{{${key}}}`, 'g');
    rendered = rendered.replace(placeholder, value || '');
  });

  return rendered;
};
