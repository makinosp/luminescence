import { LuminescenceError, APIError, NetworkError, ValidationError, StorageError, AuthError } from './error-types.js';

/**
 * Error category for routing and handling decisions.
 */
export type ErrorCategory = 'api' | 'network' | 'validation' | 'storage' | 'auth' | 'unknown';

/**
 * Redacted error for user-facing display.
 * Never contains tokens, URLs, paths, or framework details (SB-04).
 */
export interface RedactedError {
  readonlycategory: ErrorCategory;
  readonlymessage: string;
  readonlyisRetryable: boolean;
}

/**
 * Sensitive patterns to redact from error messages.
 * These patterns are applied to internal log messages before they are
 * surfaced to the user. Internal logs retain full details for debugging.
 */
const SENSITIVE_PATTERNS: ReadonlyArray<{
  pattern: RegExp;
  replacement: string;
}> = [
  {
    pattern: /Bearer\s+[A-Za-z0-9\-._~+/]+=*/g,
    replacement: 'Bearer [REDACTED]',
  },
  { pattern: /https?:\/\/[^\s]+/g, replacement: '[REDACTED_URL]' },
  { pattern: /\/home\/[^\s]+/g, replacement: '[REDACTED_PATH]' },
  { pattern: /\/Users\/[^\s]+/g, replacement: '[REDACTED_PATH]' },
];

/**
 * Error handling service.
 * Categorizes errors, applies redaction, and produces user-facing messages.
 *
 * NFR Security §1.2, SB-04: User-facing messages are redacted.
 * Internal logs retain full details for debugging.
 */
export class ErrorHandlingService {
  /**
   * Categorize a raw error into a typed error category.
   */
  categorize(error: unknown): ErrorCategory {
    if (error instanceof APIError) return 'api';
    if (error instanceof NetworkError) return 'network';
    if (error instanceof ValidationError) return 'validation';
    if (error instanceof StorageError) return 'storage';
    if (error instanceof AuthError) return 'auth';
    return 'unknown';
  }

  /**
   * Get a user-facing message from an error.
   * Applies redaction to ensure no sensitive data is leaked (SB-04).
   */
  getUserMessage(error: unknown): string {
    if (error instanceof LuminescenceError) {
      return error.userMessage;
    }
    if (error instanceof Error) {
      return this.redact(error.message);
    }
    return 'An unexpected error occurred. Please try again.';
  }

  /**
   * Check if an error is retryable.
   * Used by retry middleware to decide whether to retry.
   */
  isRetryable(error: unknown): boolean {
    if (error instanceof LuminescenceError) {
      return error.isRetryable;
    }
    // Network errors from native fetch are retryable
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return true;
    }
    return false;
  }

  /**
   * Log an error internally with full details for debugging.
   * Internal logs are NOT redacted — they retain URLs, stack traces, etc.
   * Only user-facing messages go through redaction.
   */
  logError(error: unknown, context?: string): void {
    const category = this.categorize(error);
    const timestamp = new Date().toISOString();

    if (error instanceof LuminescenceError) {
      console.error(`[${timestamp}] [${category}] [${context ?? 'unknown'}] ${error.message}`, {
        stack: error.stack,
        context: error.context,
      });
    } else if (error instanceof Error) {
      console.error(`[${timestamp}] [${category}] [${context ?? 'unknown'}] ${error.message}`, {
        stack: error.stack,
      });
    } else {
      console.error(`[${timestamp}] [${category}] [${context ?? 'unknown'}]`, error);
    }
  }

  /**
   * Redact sensitive information from a message string.
   * Applied to user-facing messages only.
   */
  redact(message: string): string {
    let redacted = message;
    for (const { pattern, replacement } of SENSITIVE_PATTERNS) {
      redacted = redacted.replace(pattern, replacement);
    }
    return redacted;
  }

  /**
   * Produce a redacted error object safe for user display.
   */
  toRedactedError(error: unknown): RedactedError {
    return {
      category: this.categorize(error),
      message: this.getUserMessage(error),
      isRetryable: this.isRetryable(error),
    };
  }
}

/** Singleton instance for convenience. */
export const errorHandlingService = new ErrorHandlingService();
