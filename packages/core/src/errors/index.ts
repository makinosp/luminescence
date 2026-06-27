// Errors — barrel exports
export {
  LuminescenceError,
  APIError,
  NetworkError,
  ValidationError,
  StorageError,
  AuthError,
} from './error-types.js';

export type { ErrorCategory, RedactedError } from './error-categorization.js';
export { ErrorHandlingService, errorHandlingService } from './error-categorization.js';
