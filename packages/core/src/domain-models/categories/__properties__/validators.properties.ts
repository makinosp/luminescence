import fc from 'fast-check';
import { describe, it, expect } from 'vitest';
import { validateCategoryId } from '../validators.js';

describe('Category Validators — Property-Based Tests', () => {
  describe('validateCategoryId', () => {
    it('should accept valid category IDs', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
          (id) => {
            const result = validateCategoryId(id);
            expect(result.isValid).toBe(true);
          },
        ),
      );
    });

    it('should accept undefined or null (optional field)', () => {
      expect(validateCategoryId(undefined).isValid).toBe(true);
      expect(validateCategoryId(null).isValid).toBe(true);
    });

    it('should reject empty strings', () => {
      const result = validateCategoryId('');
      expect(result.isValid).toBe(false);
    });

    it('should reject whitespace-only strings', () => {
      const result = validateCategoryId('   ');
      expect(result.isValid).toBe(false);
    });
  });
});
