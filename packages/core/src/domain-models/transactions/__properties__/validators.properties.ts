import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  validateAmount,
  validateDescription,
  validateDate,
  validateTransactionType,
  validateTransactionInput,
  validResult,
  getDateWarning,
} from '../validators.js';

describe('Transaction Validators — Property-Based Tests', () => {
  describe('validateAmount', () => {
    it('should accept valid positive amounts with up to 2 decimals', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1_000_000 }).map((n) => n / 100),
          (amount) => {
            const result = validateAmount(amount);
            expect(result.isValid).toBe(true);
          },
        ),
      );
    });

    it('should reject zero or negative amounts', () => {
      fc.assert(
        fc.property(
          fc.float({ min: -1_000_000, max: 0, noNaN: true }),
          (amount) => {
            const result = validateAmount(amount);
            expect(result.isValid).toBe(false);
          },
        ),
      );
    });

    it('should reject amounts with more than 2 decimal places', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1_000_000 }).map((n) => n / 1000),
          (amount) => {
            // Only check if it actually has >2 decimal places
            const scaled = Math.round(amount * 100);
            if (Math.abs(scaled / 100 - amount) > 1e-10) {
              const result = validateAmount(amount);
              expect(result.isValid).toBe(false);
            }
          },
        ),
      );
    });

    it('should reject non-number inputs', () => {
      fc.assert(
        fc.property(
          fc.oneof(fc.string(), fc.boolean(), fc.constant(null), fc.constant(undefined)),
          (input) => {
            const result = validateAmount(input);
            expect(result.isValid).toBe(false);
          },
        ),
      );
    });
  });

  describe('validateDescription', () => {
    it('should accept valid descriptions (1-1000 chars)', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 1000 }).filter((s) => s.trim().length > 0),
          (desc) => {
            const result = validateDescription(desc);
            expect(result.isValid).toBe(true);
          },
        ),
      );
    });

    it('should reject empty or whitespace-only descriptions', () => {
      fc.assert(
        fc.property(
          fc.string({ maxLength: 10 }).map((s) => s.replace(/\S/g, ' ')),
          (desc) => {
            const result = validateDescription(desc);
            if (desc.trim().length === 0) {
              expect(result.isValid).toBe(false);
            }
          },
        ),
      );
    });

    it('should reject descriptions longer than 1000 chars', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1001, maxLength: 2000 }),
          (desc) => {
            const result = validateDescription(desc);
            expect(result.isValid).toBe(false);
          },
        ),
      );
    });
  });

  describe('validateDate', () => {
    it('should accept valid dates after 1970-01-01', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('1970-01-02'), max: new Date('2100-01-01') }),
          (date) => {
            const result = validateDate(date);
            expect(result.isValid).toBe(true);
          },
        ),
      );
    });

    it('should reject dates before 1970-01-01', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('1900-01-01'), max: new Date('1969-12-31') }),
          (date) => {
            const result = validateDate(date);
            expect(result.isValid).toBe(false);
          },
        ),
      );
    });
  });

  describe('validateTransactionType', () => {
    it('should accept valid transaction types', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('deposit', 'withdrawal', 'transfer'),
          (type) => {
            const result = validateTransactionType(type);
            expect(result.isValid).toBe(true);
          },
        ),
      );
    });

    it('should reject invalid transaction types', () => {
      fc.assert(
        fc.property(
          fc.string().filter((s) => !['deposit', 'withdrawal', 'transfer'].includes(s)),
          (type) => {
            const result = validateTransactionType(type);
            expect(result.isValid).toBe(false);
          },
        ),
      );
    });
  });

  describe('getDateWarning', () => {
    it('should warn for future dates', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const warning = getDateWarning(futureDate);
      expect(warning).not.toBeNull();
      expect(warning!.field).toBe('date');
    });

    it('should not warn for past dates', () => {
      const pastDate = new Date('2020-01-01');
      const warning = getDateWarning(pastDate);
      expect(warning).toBeNull();
    });

    it('should not warn for today', () => {
      const warning = getDateWarning(new Date());
      expect(warning).toBeNull();
    });
  });

  describe('validateTransactionInput — comprehensive', () => {
    it('should accept valid transaction input', () => {
      const result = validateTransactionInput({
        type: 'withdrawal',
        amount: 50.0,
        description: 'Grocery shopping',
        date: new Date('2024-01-15'),
        fromAccountId: 'acct-1',
      });
      expect(result.isValid).toBe(true);
    });

    it('should collect all field-level errors', () => {
      const result = validateTransactionInput({
        type: 'invalid-type',
        amount: -50,
        description: '',
        date: new Date('1960-01-01'),
        fromAccountId: '',
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.size).toBeGreaterThanOrEqual(4);
    });

    it('should require toAccountId for transfers', () => {
      const result = validateTransactionInput({
        type: 'transfer',
        amount: 100,
        description: 'Transfer',
        date: new Date(),
        fromAccountId: 'acct-1',
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.has('toAccountId')).toBe(true);
    });
  });

  describe('validResult', () => {
    it('should return a valid result with empty errors', () => {
      const result = validResult();
      expect(result.isValid).toBe(true);
      expect(result.errors.size).toBe(0);
    });
  });
});
