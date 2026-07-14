import { AppError } from '../../shared/errors/AppError.js';

/** Placeholder: module chưa implement nghiệp vụ. */
export function notImplemented(feature) {
  return (_req, _res, next) => {
    next(
      new AppError(`${feature} is not implemented yet`, 501, {
        code: 'NOT_IMPLEMENTED',
      }),
    );
  };
}
