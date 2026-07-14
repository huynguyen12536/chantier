import { AppError } from '../errors/AppError.js';
import { env } from '../../config/env.js';
import { logger } from '../utils/logger.js';

export function errorHandler(err, req, res, _next) {
  const statusCode = err.statusCode && Number.isInteger(err.statusCode) ? err.statusCode : 500;
  const code = err.code ?? (statusCode === 500 ? 'INTERNAL_ERROR' : 'APP_ERROR');
  const message =
    statusCode === 500 && env.isProd
      ? 'Internal server error'
      : err.message || 'Internal server error';

  if (statusCode >= 500) {
    logger.error('request failed', {
      correlationId: req.correlationId,
      code,
      message: err.message,
      stack: env.isProd ? undefined : err.stack,
    });
  }

  res.status(statusCode).json({
    error: {
      code,
      message,
      correlationId: req.correlationId,
      ...(err.details !== undefined && !env.isProd ? { details: err.details } : {}),
    },
  });
}

export function notFoundHandler(req, _res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404, { code: 'NOT_FOUND' }));
}
