import { Response } from 'express';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

/**
 * Send a successful response
 */
export const sendSuccess = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    data,
  };

  if (message) {
    response.message = message;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send a successful response with pagination meta
 */
export const sendPaginatedSuccess = <T>(
  res: Response,
  data: T,
  meta: { page: number; limit: number; total: number },
  message?: string
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    meta: {
      ...meta,
      totalPages: Math.ceil(meta.total / meta.limit),
    },
  };

  if (message) {
    response.message = message;
  }

  return res.status(200).json(response);
};

/**
 * Send a created response (201)
 */
export const sendCreated = <T>(
  res: Response,
  data: T,
  message: string = 'Resource created successfully'
): Response => {
  return sendSuccess(res, data, message, 201);
};

/**
 * Send a no content response (204)
 */
export const sendNoContent = (res: Response): Response => {
  return res.status(204).send();
};

/**
 * Send an error response
 */
export const sendError = (
  res: Response,
  error: string,
  statusCode: number = 500
): Response => {
  const response: ApiResponse = {
    success: false,
    error,
  };

  return res.status(statusCode).json(response);
};

/**
 * Send a validation error response
 */
export const sendValidationError = (
  res: Response,
  errors: Record<string, string> | string
): Response => {
  const response: ApiResponse = {
    success: false,
    error: typeof errors === 'string' ? errors : 'Validation failed',
  };

  if (typeof errors === 'object') {
    (response as any).validationErrors = errors;
  }

  return res.status(400).json(response);
};

/**
 * Create a success response object (useful for direct json response)
 */
export const successResponse = <T>(data: T, message?: string): ApiResponse<T> => {
  const response: ApiResponse<T> = {
    success: true,
    data,
  };

  if (message) {
    response.message = message;
  }

  return response;
};
