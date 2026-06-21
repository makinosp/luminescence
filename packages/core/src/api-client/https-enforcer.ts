import { ValidationError } from '../errors/error-types.js';

/**
 * HTTPS Enforcer.
 * Validates that the base URL uses HTTPS before any network request is made.
 *
 * NFR Security §1.5: TLS 1.2+ required for all API communication.
 * Non-HTTPS URLs throw ValidationError immediately.
 */
export class HTTPSEnforcer {
  private baseURL: string | null = null;

  /**
   * Set and validate the base URL.
   * @throws ValidationError if URL is not HTTPS
   */
  setBaseURL(url: string): void {
    const trimmed = url.trim();

    if (!trimmed.startsWith('https://')) {
      throw new ValidationError(
        'Server URL must use HTTPS',
        new Map([['baseURL', 'The server URL must start with https://']]),
      );
    }

    try {
      new URL(trimmed);
    } catch {
      throw new ValidationError(
        'Invalid server URL',
        new Map([['baseURL', 'The server URL is not a valid URL']]),
      );
    }

    // Remove trailing slash for consistency
    this.baseURL = trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
  }

  /**
   * Get the current base URL.
   */
  getBaseURL(): string | null {
    return this.baseURL;
  }

  /**
   * Build a full API URL from a path.
   */
  buildURL(path: string): string {
    if (!this.baseURL) {
      throw new ValidationError(
        'Server not configured',
        new Map([['baseURL', 'Server URL has not been configured']]),
      );
    }
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${this.baseURL}/api/v1${normalizedPath}`;
  }
}
