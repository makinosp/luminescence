import { validResult, invalidResult, type ValidationResult } from '../transactions/validators.js';

const VALID_ACCOUNT_TYPES = ['asset', 'liability', 'revenue', 'expense'];

/**
 * Validate an account type string.
 */
export function validateAccountType(type: unknown): ValidationResult {
  const errors = new Map<string, string>();

  if (typeof type !== 'string' || !VALID_ACCOUNT_TYPES.includes(type)) {
    errors.set('type', 'Account type must be asset, liability, revenue, or expense');
  }

  return errors.size > 0 ? invalidResult(errors) : validResult();
}
