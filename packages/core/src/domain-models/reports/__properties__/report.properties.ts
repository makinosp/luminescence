import fc from 'fast-check';
import { describe, it, expect } from 'vitest';
import { calculateNetCashflow, calculateCategoryPercentages } from '../report.js';

describe('Report Calculations — Property-Based Tests', () => {
  describe('calculateNetCashflow', () => {
    it('should satisfy: income - expenses = netCashflow', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 1_000_000, noNaN: true }),
          fc.float({ min: 0, max: 1_000_000, noNaN: true }),
          (income, expenses) => {
            const result = calculateNetCashflow(income, expenses);
            expect(result).toBe(income - expenses);
          },
        ),
      );
    });

    it('should be positive when income > expenses', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 1, max: 1_000_000, noNaN: true }),
          fc.float({ min: 0, max: 1_000_000, noNaN: true }),
          (income, expenses) => {
            if (income > expenses) {
              expect(calculateNetCashflow(income, expenses)).toBeGreaterThan(0);
            }
          },
        ),
      );
    });

    it('should be negative when expenses > income', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 1_000_000, noNaN: true }),
          fc.float({ min: 1, max: 1_000_000, noNaN: true }),
          (income, expenses) => {
            if (expenses > income) {
              expect(calculateNetCashflow(income, expenses)).toBeLessThan(0);
            }
          },
        ),
      );
    });
  });

  describe('calculateCategoryPercentages', () => {
    it('should sum to approximately 100%', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.string({ minLength: 1 }),
              name: fc.string({ minLength: 1 }),
              spent: fc.float({ min: 1, max: 10000, noNaN: true }),
              count: fc.integer({ min: 1, max: 100 }),
            }),
            { minLength: 1, maxLength: 10 },
          ),
          (categories) => {
            const spending = new Map(
              categories.map((c) => [
                c.id,
                {
                  name: c.name,
                  totalSpent: c.spent,
                  transactionCount: c.count,
                },
              ]),
            );
            const totalExpenses = categories.reduce((sum, c) => sum + c.spent, 0);
            const result = calculateCategoryPercentages(spending, totalExpenses);

            const totalPercentage = result.reduce((sum, c) => sum + c.percentage, 0);
            // Should be close to 100% (allow 1% rounding error per category)
            expect(totalPercentage).toBeGreaterThanOrEqual(99);
            expect(totalPercentage).toBeLessThanOrEqual(101);
          },
        ),
      );
    });

    it('should be sorted by totalSpent descending', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.string({ minLength: 1 }),
              name: fc.string({ minLength: 1 }),
              spent: fc.float({ min: 1, max: 10000, noNaN: true }),
              count: fc.integer({ min: 1, max: 100 }),
            }),
            { minLength: 2, maxLength: 10 },
          ),
          (categories) => {
            const spending = new Map(
              categories.map((c) => [
                c.id,
                {
                  name: c.name,
                  totalSpent: c.spent,
                  transactionCount: c.count,
                },
              ]),
            );
            const totalExpenses = categories.reduce((sum, c) => sum + c.spent, 0);
            const result = calculateCategoryPercentages(spending, totalExpenses);

            for (let i = 1; i < result.length; i++) {
              expect(result[i - 1]!.totalSpent).toBeGreaterThanOrEqual(result[i]!.totalSpent);
            }
          },
        ),
      );
    });
  });
});
