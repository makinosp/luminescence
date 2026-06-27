import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { validateAccountType } from '../validators.js';

describe('Account Validators — Property-Based Tests', () => {
  describe('validateAccountType', () => {
    it('should accept valid account types', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('asset', 'liability', 'revenue', 'expense'),
          (type) => {
            const result = validateAccountType(type);
            expect(result.isValid).toBe(true);
          },
        ),
      );
    });

    it('should reject invalid account types', () => {
      fc.assert(
        fc.property(
          fc.string().filter((s) => !['asset', 'liability', 'revenue', 'expense'].includes(s)),
          (type) => {
            const result = validateAccountType(type);
            expect(result.isValid).toBe(false);
          },
        ),
      );
    });
  });
});
