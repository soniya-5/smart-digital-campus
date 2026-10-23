import { Response } from 'express';

export function sendSuccess<T = any>(
  res: Response,
  data?: T,
  message?: string,
  statusCode = 200,
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }
) {
  return res.status(statusCode).json({
    success: true,
    data,
    message,
    ...(pagination ? { pagination } : {}),
  });
}

export function sendError(res: Response, message: string, statusCode = 400) {
  return res.status(statusCode).json({
    success: false,
    error: message,
  });
}
