import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../lib/errors';
import { ApiResponse } from '../../types';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('Error:', err);

  if (err instanceof AppError) {
    const response: ApiResponse<never> = {
      success: false,
      error: {
        message: err.message,
        code: err.code,
        details: err.details,
      },
    };
    res.status(err.statusCode).json(response);
    return;
  }

  // Handle Zod validation errors
  if (err.name === 'ZodError') {
    const response: ApiResponse<never> = {
      success: false,
      error: {
        message: 'Validation error',
        code: 'VALIDATION_ERROR',
        details: err,
      },
    };
    res.status(400).json(response);
    return;
  }

  // Default error response
  const response: ApiResponse<never> = {
    success: false,
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
    },
  };
  res.status(500).json(response);
}
