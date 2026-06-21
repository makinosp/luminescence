import { validResult, invalidResult, type ValidationResult } from '../transactions/validators.js';

/**
 * Validate a category ID.
 * Category ID must be a non-empty string if provided.
 */
export function validateCategoryId(categoryId: unknown): ValidationResult {
  const errors = new Map<string, string>();

  if (categoryId !== undefined && categoryId !== null) {
    if (typeof categoryId !== 'string' || categoryId.trim().length === 0) {
      errors.set('categoryId', 'Category ID must be a non-empty string if provided');
    }
  }

  return errors.size > 0 ? invalidResult(errors) : validResult();
}
