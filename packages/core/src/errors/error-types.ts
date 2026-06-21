/**
 * Base error class for all Luminescence errors.
 * All errors in the shared core extend this class.
 *
 * Security: Error messages surfaced to users are redacted (SB-04).
 * Internal logs may contain full details for debugging.
 */
export abstract class LuminescenceError extends Error {
  /** Whether this error can be retried automatically. */
  abstract readonly isRetryable: boolean;

  /** User-facing message — safe for display, never contains secrets. */
  abstract readonly userMessage: string;

  constructor(
    message: string,
    public readonly context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

/**
 * API error from the Firefly III server.
 * Contains HTTP status code and optional server response body.
 */
export class APIError extends LuminescenceError {
  readonly isRetryable: boolean;

  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly serverResponse?: unknown,
  ) {
    super(message, { statusCode, serverResponse });
    this.isRetryable = statusCode >= 500 || statusCode === 429;
  }

  get userMessage(): string {
    if (this.statusCode === 401 || this.statusCode === 403) {
      return 'Authentication failed. Please check your credentials.';
    }
    if (this.statusCode === 404) {
      return 'The requested resource was not found.';
    }
    if (this.statusCode === 422) {
      return 'The submitted data is invalid. Please check your input.';
    }
    if (this.statusCode >= 500) {
      return 'The server encountered an error. Please try again later.';
    }
    return 'An unexpected error occurred. Please try again.';
  }
}

/**
 * Network error — unable to reach the Firefly III server.
 * Covers DNS failures, connection refused, timeouts.
 */
export class NetworkError extends LuminescenceError {
  readonly isRetryable = true;

  constructor(
    message: string,
    public readonly originalError?: Error,
  ) {
    super(message, { originalError: originalError?.message });
  }

  get userMessage(): string {
    return 'Unable to connect to the server. Please check your network connection and server URL.';
  }
}

/**
 * Validation error — client-side input validation failure.
 * Contains field-level error details.
 */
export class ValidationError extends LuminescenceError {
  readonly isRetryable = false;

  constructor(
    message: string,
    public readonly fieldErrors: ReadonlyMap<string, string>,
  ) {
    super(message, { fieldErrors: Object.fromEntries(fieldErrors) });
  }

  get userMessage(): string {
    const fields = [...this.fieldErrors.keys()].join(', ');
    return `Please correct the following fields: ${fields}`;
  }
}

/**
 * Storage error — secure storage or local settings unavailable.
 * Fail-closed behavior: blocks authenticated operations (NFR-07).
 */
export class StorageError extends LuminescenceError {
  readonly isRetryable = false;

  constructor(
    message: string,
    public readonly operation: 'read' | 'write' | 'delete' | 'clear',
    public readonly storageType: 'secure' | 'local',
  ) {
    super(message, { operation, storageType });
  }

  get userMessage(): string {
    if (this.storageType === 'secure') {
      return 'Unable to access secure storage. Please check your device security settings and try again.';
    }
    return 'Unable to save settings. Please try again.';
  }
}

/**
 * Authentication error — token missing, invalid, or expired.
 */
export class AuthError extends LuminescenceError {
  readonly isRetryable = false;

  constructor(
    message: string,
    public readonly reason: 'missing' | 'invalid' | 'expired' | 'not_configured',
  ) {
    super(message, { reason });
  }

  get userMessage(): string {
    switch (this.reason) {
      case 'missing':
        return 'No access token found. Please configure your server connection.';
      case 'invalid':
        return 'Your access token is invalid. Please reconfigure your server connection.';
      case 'expired':
        return 'Your session has expired. Please reconfigure your server connection.';
      case 'not_configured':
        return 'Server not configured. Please set up your Firefly III connection.';
    }
  }
}
