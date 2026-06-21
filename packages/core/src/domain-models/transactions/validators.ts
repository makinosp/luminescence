/**
 * Validation result type used across all validators.
 * Clarification Q8 Answer A: Field-level errors.
 */
export interface ValidationResult {
  readonly isValid: boolean;
  readonly errors: ReadonlyMap<string, string>; // field → error message
}

/**
 * Warning result for non-blocking validation issues.
 */
export interface ValidationWarning {
  readonly field: string;
  readonly message: string;
}

/**
 * Creates an empty successful validation result.
 */
export function validResult(): ValidationResult {
  return { isValid: true, errors: new Map() };
}

/**
 * Creates a failed validation result with field-level errors.
 */
export function invalidResult(errors: Map<string, string>): ValidationResult {
  return { isValid: false, errors };
}

/**
 * Amount validation rules (Clarification Q1: C):
 * - Must be positive (> 0)
 * - Maximum 2 decimal places
 * - No upper bound enforced at domain level (API may impose limits)
 */
export function validateAmount(amount: unknown): ValidationResult {
  const errors = new Map<string, string>();

  if (typeof amount !== 'number' || isNaN(amount)) {
    errors.set('amount', 'Amount must be a valid number');
    return invalidResult(errors);
  }

  if (amount <= 0) {
    errors.set('amount', 'Amount must be greater than zero');
  }

  // Check decimal precision: multiply by 100 and check if integer
  const scaled = Math.round(amount * 100);
  if (Math.abs(scaled / 100 - amount) > 1e-10) {
    errors.set('amount', 'Amount must have at most 2 decimal places');
  }

  return errors.size > 0 ? invalidResult(errors) : validResult();
}

/**
 * Description validation rules:
 * - Required (non-empty after trimming)
 * - Maximum 1000 characters
 */
export function validateDescription(description: unknown): ValidationResult {
  const errors = new Map<string, string>();

  if (typeof description !== 'string') {
    errors.set('description', 'Description is required');
    return invalidResult(errors);
  }

  const trimmed = description.trim();
  if (trimmed.length === 0) {
    errors.set('description', 'Description is required');
  } else if (trimmed.length > 1000) {
    errors.set('description', 'Description must be 1000 characters or fewer');
  }

  return errors.size > 0 ? invalidResult(errors) : validResult();
}

/**
 * Date validation rules (Clarification Q2: C):
 * - Must be a valid Date object
 * - Future dates allowed but produce a warning (not an error)
 * - Date must not be before 1970-01-01
 */
export function validateDate(date: unknown): ValidationResult {
  const errors = new Map<string, string>();

  if (!(date instanceof Date) || isNaN(date.getTime())) {
    errors.set('date', 'A valid date is required');
    return invalidResult(errors);
  }

  const epoch = new Date('1970-01-01T00:00:00Z');
  if (date < epoch) {
    errors.set('date', 'Date must be after 1970-01-01');
  }

  return errors.size > 0 ? invalidResult(errors) : validResult();
}

/**
 * Check if a date is in the future and should produce a warning.
 */
export function getDateWarning(date: Date): ValidationWarning | null {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const txDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (txDate > today) {
    return {
      field: 'date',
      message: 'This transaction is dated in the future. Please confirm this is intentional.',
    };
  }
  return null;
}

/**
 * Transaction type validation:
 * - Must be one of: 'deposit', 'withdrawal', 'transfer'
 */
export function validateTransactionType(type: unknown): ValidationResult {
  const errors = new Map<string, string>();
  const validTypes: string[] = ['deposit', 'withdrawal', 'transfer'];

  if (typeof type !== 'string' || !validTypes.includes(type)) {
    errors.set('type', 'Transaction type must be deposit, withdrawal, or transfer');
  }

  return errors.size > 0 ? invalidResult(errors) : validResult();
}

/**
 * Comprehensive transaction input validation.
 * Combines all field-level validators per Clarification Q8 Answer A (field-level errors).
 */
export function validateTransactionInput(input: {
  type?: unknown;
  amount?: unknown;
  description?: unknown;
  date?: unknown;
  fromAccountId?: unknown;
  toAccountId?: unknown;
  categoryId?: unknown;
  budgetId?: unknown;
  tags?: unknown;
}): ValidationResult {
  const errors = new Map<string, string>();

  // Type validation
  const typeResult = validateTransactionType(input.type);
  if (!typeResult.isValid) {
    typeResult.errors.forEach((msg, field) => errors.set(field, msg));
  }

  // Amount validation
  const amountResult = validateAmount(input.amount);
  if (!amountResult.isValid) {
    amountResult.errors.forEach((msg, field) => errors.set(field, msg));
  }

  // Description validation
  const descResult = validateDescription(input.description);
  if (!descResult.isValid) {
    descResult.errors.forEach((msg, field) => errors.set(field, msg));
  }

  // Date validation
  const dateResult = validateDate(input.date);
  if (!dateResult.isValid) {
    dateResult.errors.forEach((msg, field) => errors.set(field, msg));
  }

  // Account ID validation
  if (typeof input.fromAccountId !== 'string' || input.fromAccountId.trim().length === 0) {
    errors.set('fromAccountId', 'Source account is required');
  }

  // Transfer requires destination account
  if (input.type === 'transfer') {
    if (typeof input.toAccountId !== 'string' || input.toAccountId.trim().length === 0) {
      errors.set('toAccountId', 'Destination account is required for transfers');
    }
  }

  // Optional field validation
  if (input.categoryId !== undefined && input.categoryId !== null) {
    if (typeof input.categoryId !== 'string' || input.categoryId.trim().length === 0) {
      errors.set('categoryId', 'Category ID must be a non-empty string if provided');
    }
  }

  if (input.budgetId !== undefined && input.budgetId !== null) {
    if (typeof input.budgetId !== 'string' || input.budgetId.trim().length === 0) {
      errors.set('budgetId', 'Budget ID must be a non-empty string if provided');
    }
  }

  if (input.tags !== undefined && input.tags !== null) {
    if (!Array.isArray(input.tags) || !input.tags.every((t: unknown) => typeof t === 'string')) {
      errors.set('tags', 'Tags must be an array of strings');
    }
  }

  return errors.size > 0 ? invalidResult(errors) : validResult();
}
