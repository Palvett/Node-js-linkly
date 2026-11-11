import { AppError } from '../utils/errors.js';

export function notFound(_req, _res, next) {
  next(new AppError(404, 'Route not found'));
}
