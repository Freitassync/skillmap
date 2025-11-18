import { Request, Response, NextFunction } from 'express';
import logger from '../lib/logger';
import type { ApiResponse } from '../types';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error({
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: (req as any).userId,
  }, 'Request error');

  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;

  res.status(statusCode).json({
    success: false,
    error: statusCode === 500 ? 'Erro interno do servidor' : err.message,
  } as ApiResponse);
};
