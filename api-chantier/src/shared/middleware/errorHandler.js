import { AppError } from '../errors/AppError.js';
import { env } from '../../config/env.js';

export function errorHandler(err, _req, res, _next) {
  const statusCode = err.statusCode && Number.isInteger(err.statusCode) ? err.statusCode : 500;
  const code = err.code ?? (statusCode === 500 ? 'INTERNAL_ERROR' : 'APP_ERROR');
  const message =
    statusCode === 500 && env.isProd
      ? 'Internal server error'
      : err.message || 'Internal server error';

  if (statusCode >= 500) {
    console.error('[error]', err);
  }

  res.status(statusCode).json({
    error: {
      code,
      message,
      ...(err.details !== undefined && !env.isProd ? { details: err.details } : {}),
    },
  });
}

export function notFoundHandler(req, _res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404, { code: 'NOT_FOUND' }));
}
