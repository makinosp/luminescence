import { NetworkError } from '../errors/error-types.js';

/**
 * Retry configuration.
 */
interface RetryConfig {
  /** Maximum number of retry attempts. */
  maxRetries: number;
  /** Initial backoff delay in milliseconds. */
  initialBackoffMs: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 1,
  initialBackoffMs: 500,
};

/**
 * Retry Middleware.
 * Retries failed idempotent GET requests with exponential backoff.
 *
 * NFR Reliability §2.2:
 * - GET requests only (idempotent)
 * - POST, PUT, DELETE are never retried
 * - Maximum 1 retry with exponential backoff starting at 500ms
 */
export class RetryMiddleware {
  private config: RetryConfig;

  constructor(config?: Partial<RetryConfig>) {
    this.config = { ...DEFAULT_RETRY_CONFIG, ...config };
  }

  /**
   * Check if a request method is idempotent and can be retried.
   */
  isIdempotent(method: string): boolean {
    return method === 'GET';
  }

  /**
   * Execute a request with retry logic.
   * Only retries idempotent requests on network errors.
   *
   * @param method - HTTP method
   * @param requestFn - The request function to execute
   * @returns The result of the request
   */
  async execute<T>(method: string, requestFn: () => Promise<T>): Promise<T> {
    if (!this.isIdempotent(method)) {
      // Non-idempotent: single attempt only
      return requestFn();
    }

    let lastError: unknown;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;

        // Only retry on network errors
        if (error instanceof NetworkError && attempt < this.config.maxRetries) {
          const delay = this.config.initialBackoffMs * Math.pow(2, attempt);
          await this.sleep(delay);
          continue;
        }

        throw error;
      }
    }

    throw lastError;
  }

  /**
   * Sleep for a given duration.
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
