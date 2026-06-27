import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  deserializeTransaction,
  serializeCreateTransactionInput,
  type CreateTransactionInput,
  type FireflyIIITransactionResponse,
} from '../serializers.js';

describe('Transaction Serializers — Property-Based Tests', () => {
  describe('deserializeTransaction', () => {
    it('should correctly parse a valid API response', () => {
      const response: FireflyIIITransactionResponse = {
        data: {
          id: 'tx-1',
          type: 'transactions',
          attributes: {
            type: 'withdrawal',
            amount: '50.00',
            description: 'Grocery shopping',
            date: '2024-01-15T00:00:00Z',
            source_id: 'acct-1',
            destination_id: 'acct-2',
            category_id: 'cat-1',
            budget_id: 'bud-1',
            tags: ['food', 'essential'],
            created_at: '2024-01-15T10:00:00Z',
            updated_at: '2024-01-15T10:00:00Z',
          },
        },
      };

      const tx = deserializeTransaction(response);
      expect(tx.id).toBe('tx-1');
      expect(tx.type).toBe('withdrawal');
      expect(tx.amount).toBe(50.0);
      expect(tx.description).toBe('Grocery shopping');
      expect(tx.fromAccountId).toBe('acct-1');
      expect(tx.toAccountId).toBe('acct-2');
      expect(tx.categoryId).toBe('cat-1');
      expect(tx.budgetId).toBe('bud-1');
      expect(tx.tags).toEqual(['food', 'essential']);
    });

    it('should handle missing optional fields', () => {
      const response: FireflyIIITransactionResponse = {
        data: {
          id: 'tx-2',
          type: 'transactions',
          attributes: {
            type: 'deposit',
            amount: '100.00',
            description: 'Salary',
            date: '2024-01-15T00:00:00Z',
            source_id: 'acct-3',
            created_at: '2024-01-15T10:00:00Z',
            updated_at: '2024-01-15T10:00:00Z',
          },
        },
      };

      const tx = deserializeTransaction(response);
      expect(tx.toAccountId).toBeUndefined();
      expect(tx.categoryId).toBeUndefined();
      expect(tx.budgetId).toBeUndefined();
    });
  });

  describe('serializeCreateTransactionInput', () => {
    it('should serialize a complete input', () => {
      const input: CreateTransactionInput = {
        type: 'withdrawal',
        amount: 50.0,
        description: 'Grocery shopping',
        date: new Date('2024-01-15'),
        fromAccountId: 'acct-1',
        toAccountId: 'acct-2',
        categoryId: 'cat-1',
        budgetId: 'bud-1',
        tags: ['food'],
      };

      const result = serializeCreateTransactionInput(input);
      expect(result.type).toBe('withdrawal');
      expect(result.amount).toBe('50.00');
      expect(result.description).toBe('Grocery shopping');
      expect(result.source_id).toBe('acct-1');
      expect(result.destination_id).toBe('acct-2');
      expect(result.category_id).toBe('cat-1');
      expect(result.budget_id).toBe('bud-1');
      expect(result.tags).toEqual(['food']);
    });

    it('should omit optional fields when not provided', () => {
      const input: CreateTransactionInput = {
        type: 'deposit',
        amount: 100,
        description: 'Salary',
        date: new Date('2024-01-15'),
        fromAccountId: 'acct-1',
      };

      const result = serializeCreateTransactionInput(input);
      expect(result.destination_id).toBeUndefined();
      expect(result.category_id).toBeUndefined();
      expect(result.budget_id).toBeUndefined();
      expect(result.tags).toBeUndefined();
    });

    it('should format amount with 2 decimal places', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1_000_000 }).map((n) => n / 100),
          (amount) => {
            const input: CreateTransactionInput = {
              type: 'withdrawal',
              amount,
              description: 'Test',
              date: new Date(),
              fromAccountId: 'acct-1',
            };
            const result = serializeCreateTransactionInput(input);
            const amountStr = result.amount as string;
            // Should have exactly 2 decimal places
            expect(amountStr).toMatch(/^\d+\.\d{2}$/);
          },
        ),
      );
    });
  });
});
