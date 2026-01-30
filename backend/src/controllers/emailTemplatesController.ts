import { Request, Response, NextFunction } from 'express';
import * as emailTemplatesService from '../services/emailTemplatesService';
import { sendSuccess, sendPaginatedSuccess } from '../utils/response';
import { sendEmail } from '../services/emailService';

/**
 * Get all email templates (admin only)
 */
export const getAllEmailTemplates = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { category, is_active, search, page, limit } = req.query;

    const result = await emailTemplatesService.getAllEmailTemplates({
      category: category as string,
      is_active: is_active === 'true' ? true : is_active === 'false' ? false : undefined,
      search: search as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    sendPaginatedSuccess(res, result.templates, result.pagination);
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single email template by ID (admin only)
 */
export const getEmailTemplateById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const template = await emailTemplatesService.getEmailTemplateById(parseInt(id));
    sendSuccess(res, { template });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all template categories (admin only)
 */
export const getEmailTemplateCategories = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const categories = await emailTemplatesService.getEmailTemplateCategories();
    sendSuccess(res, { categories });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new email template (admin only)
 */
export const createEmailTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      template_key,
      template_name,
      subject,
      html_content,
      text_content,
      variables,
      category,
      is_active,
    } = req.body;

    const template = await emailTemplatesService.createEmailTemplate({
      template_key,
      template_name,
      subject,
      html_content,
      text_content,
      variables,
      category,
      is_active,
    });

    sendSuccess(res, { template }, undefined, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Update an email template (admin only)
 */
export const updateEmailTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const {
      template_name,
      subject,
      html_content,
      text_content,
      variables,
      category,
      is_active,
    } = req.body;

    const template = await emailTemplatesService.updateEmailTemplate(parseInt(id), {
      template_name,
      subject,
      html_content,
      text_content,
      variables,
      category,
      is_active,
    });

    sendSuccess(res, { template });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete an email template (admin only)
 */
export const deleteEmailTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    await emailTemplatesService.deleteEmailTemplate(parseInt(id));
    sendSuccess(res, { message: 'Email template deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * Duplicate an email template (admin only)
 */
export const duplicateEmailTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const template = await emailTemplatesService.duplicateEmailTemplate(parseInt(id));
    sendSuccess(res, { template }, undefined, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Preview template with sample variables (admin only)
 */
export const previewEmailTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { sample_variables } = req.body;

    const template = await emailTemplatesService.getEmailTemplateById(parseInt(id));

    // Render the template with sample variables
    const renderedSubject = emailTemplatesService.renderTemplate(
      template.subject,
      sample_variables || {}
    );
    const renderedHtml = emailTemplatesService.renderTemplate(
      template.html_content,
      sample_variables || {}
    );
    const renderedText = emailTemplatesService.renderTemplate(
      template.text_content,
      sample_variables || {}
    );

    sendSuccess(res, {
      preview: {
        subject: renderedSubject,
        html_content: renderedHtml,
        text_content: renderedText,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Send a test email (admin only)
 */
export const sendTestEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { test_email, sample_variables } = req.body;

    if (!test_email) {
      return res.status(400).json({ error: 'test_email is required' });
    }

    const template = await emailTemplatesService.getEmailTemplateById(parseInt(id));

    // Render the template with sample variables
    const renderedSubject = emailTemplatesService.renderTemplate(
      template.subject,
      sample_variables || {}
    );
    const renderedHtml = emailTemplatesService.renderTemplate(
      template.html_content,
      sample_variables || {}
    );
    const renderedText = emailTemplatesService.renderTemplate(
      template.text_content,
      sample_variables || {}
    );

    // Send the test email
    await sendEmail(test_email, renderedSubject, renderedHtml, renderedText);

    sendSuccess(res, { message: 'Test email sent successfully' });
  } catch (error) {
    next(error);
  }
};
