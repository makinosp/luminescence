import type { CreateTransactionInput } from '../domain-models/transactions/serializers.js';
import { validateAccountType } from '../domain-models/accounts/validators.js';
import { validateCategoryId } from '../domain-models/categories/validators.js';
import { validateTransactionInput, type ValidationResult } from '../domain-models/transactions/validators.js';
import { ValidationError } from '../errors/error-types.js';

/**
 * Validation service.
 * Composes domain validators into a unified validation API.
 *
 * NFR Security §1.4, SB-03: All inputs validated before API requests.
 * Chain of validators — all run, errors collected (not short-circuited).
 */
export class ValidationService {
  /**
   * Validate a server URL.
   * Must be a valid HTTPS URL.
   */
  validateURL(url: unknown): ValidationResult {
    const errors = new Map<string, string>();

    if (typeof url !== 'string' || url.trim().length === 0) {
      errors.set('url', 'Server URL is required');
      return { isValid: false, errors };
    }

    const trimmed = url.trim();

    if (!trimmed.startsWith('https://')) {
      errors.set('url', 'The server URL must start with https://');
    }

    try {
      new URL(trimmed);
    } catch {
      errors.set('url', 'The server URL is not a valid URL');
    }

    return errors.size > 0 ? { isValid: false, errors } : { isValid: true, errors: new Map() };
  }

  /**
   * Validate a personal access token.
   * Must be a non-empty string.
   */
  validateToken(token: unknown): ValidationResult {
    const errors = new Map<string, string>();

    if (typeof token !== 'string' || token.trim().length === 0) {
      errors.set('token', 'Access token is required');
    }

    return errors.size > 0 ? { isValid: false, errors } : { isValid: true, errors: new Map() };
  }

  /**
   * Validate a transaction input.
   * Delegates to domain validators.
   */
  validateTransactionInput(input: CreateTransactionInput): ValidationResult {
    return validateTransactionInput(input);
  }

  /**
   * Validate an account type.
   */
  validateAccountType(type: unknown): ValidationResult {
    return validateAccountType(type);
  }

  /**
   * Validate a category ID.
   */
  validateCategoryId(categoryId: unknown): ValidationResult {
    return validateCategoryId(categoryId);
  }

  /**
   * Validate a date range for reports.
   */
  validateDateRange(startDate: unknown, endDate: unknown): ValidationResult {
    const errors = new Map<string, string>();

    if (!(startDate instanceof Date) || isNaN(startDate.getTime())) {
      errors.set('startDate', 'A valid start date is required');
    }

    if (!(endDate instanceof Date) || isNaN(endDate.getTime())) {
      errors.set('endDate', 'A valid end date is required');
    }

    if (
      startDate instanceof Date &&
      endDate instanceof Date &&
      !isNaN(startDate.getTime()) &&
      !isNaN(endDate.getTime())
    ) {
      if (startDate > endDate) {
        errors.set('dateRange', 'Start date must be before end date');
      }

      // Max 5 year range
      const fiveYears = 5 * 365 * 24 * 60 * 60 * 1000;
      if (endDate.getTime() - startDate.getTime() > fiveYears) {
        errors.set('dateRange', 'Date range must not exceed 5 years');
      }
    }

    return errors.size > 0 ? { isValid: false, errors } : { isValid: true, errors: new Map() };
  }

  /**
   * Check if a validation result has errors and throw if so.
   */
  throwIfInvalid(result: ValidationResult): void {
    if (!result.isValid) {
      throw new ValidationError('Validation failed', result.errors);
    }
  }
}
