import { Request, Response, NextFunction } from 'express';
import * as faqService from '../services/faqService';
import { sendSuccess, sendPaginatedSuccess } from '../utils/response';

/**
 * Get all FAQs (admin endpoint with filtering)
 */
export const getAllFAQs = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { category, is_published, page, limit } = req.query;

    const result = await faqService.getAllFAQs({
      category: category as string,
      is_published: is_published === 'true' ? true : is_published === 'false' ? false : undefined,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    sendPaginatedSuccess(res, result.faqs, result.pagination);
  } catch (error) {
    next(error);
  }
};

/**
 * Get published FAQs (public endpoint)
 */
export const getPublishedFAQs = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { category } = req.query;
    const faqs = await faqService.getPublishedFAQs(category as string);
    sendSuccess(res, { faqs });
  } catch (error) {
    next(error);
  }
};

/**
 * Get FAQ categories
 */
export const getFAQCategories = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const categories = await faqService.getFAQCategories();
    sendSuccess(res, { categories });
  } catch (error) {
    next(error);
  }
};

/**
 * Get FAQ by ID
 */
export const getFAQById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const faq = await faqService.getFAQById(parseInt(id));
    sendSuccess(res, { faq });
  } catch (error) {
    next(error);
  }
};

/**
 * Create FAQ (admin only)
 */
export const createFAQ = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { question, answer, category, display_order, is_published } = req.body;

    const faq = await faqService.createFAQ({
      question,
      answer,
      category,
      display_order,
      is_published,
    });

    sendSuccess(res, { faq }, undefined, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Update FAQ (admin only)
 */
export const updateFAQ = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { question, answer, category, display_order, is_published } = req.body;

    const faq = await faqService.updateFAQ(parseInt(id), {
      question,
      answer,
      category,
      display_order,
      is_published,
    });

    sendSuccess(res, { faq });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete FAQ (admin only)
 */
export const deleteFAQ = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    await faqService.deleteFAQ(parseInt(id));
    sendSuccess(res, { message: 'FAQ deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * Reorder FAQs (admin only)
 */
export const reorderFAQs = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { faqOrders } = req.body;
    await faqService.reorderFAQs(faqOrders);
    sendSuccess(res, { message: 'FAQs reordered successfully' });
  } catch (error) {
    next(error);
  }
};
