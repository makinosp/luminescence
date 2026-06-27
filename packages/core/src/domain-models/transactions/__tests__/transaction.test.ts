import { describe, it, expect } from 'vitest';
import {
  createTransaction,
  netAmount,
  isTransfer,
  hasCategory,
  TRANSACTION_TYPE_LABELS,
  TRANSACTION_TYPE_SIGN,
} from '../transaction.js';

const baseTransaction = {
  id: 'tx-1',
  type: 'withdrawal' as const,
  amount: 50.0,
  description: 'Grocery shopping',
  date: new Date('2024-01-15'),
  fromAccountId: 'acct-1',
  createdAt: new Date('2024-01-15T10:00:00Z'),
  updatedAt: new Date('2024-01-15T10:00:00Z'),
};

describe('Transaction', () => {
  describe('createTransaction', () => {
    it('should create an immutable transaction', () => {
      const tx = createTransaction(baseTransaction);
      expect(tx.id).toBe('tx-1');
      expect(tx.type).toBe('withdrawal');
      expect(tx.amount).toBe(50.0);
      expect(tx.description).toBe('Grocery shopping');
    });

    it('should default tags to empty array', () => {
      const tx = createTransaction(baseTransaction);
      expect(tx.tags).toEqual([]);
    });

    it('should freeze tags array', () => {
      const tx = createTransaction({ ...baseTransaction, tags: ['food'] });
      expect(Object.isFrozen(tx.tags)).toBe(true);
    });

    it('should include optional fields when provided', () => {
      const tx = createTransaction({
        ...baseTransaction,
        toAccountId: 'acct-2',
        categoryId: 'cat-1',
        budgetId: 'bud-1',
      });
      expect(tx.toAccountId).toBe('acct-2');
      expect(tx.categoryId).toBe('cat-1');
      expect(tx.budgetId).toBe('bud-1');
    });
  });

  describe('netAmount', () => {
    it('should return positive for deposits', () => {
      const tx = createTransaction({ ...baseTransaction, type: 'deposit', amount: 100 });
      expect(netAmount(tx)).toBe(100);
    });

    it('should return negative for withdrawals', () => {
      const tx = createTransaction({ ...baseTransaction, type: 'withdrawal', amount: 50 });
      expect(netAmount(tx)).toBe(-50);
    });

    it('should return zero for transfers', () => {
      const tx = createTransaction({ ...baseTransaction, type: 'transfer', amount: 200 });
      expect(netAmount(tx)).toBe(0);
    });
  });

  describe('isTransfer', () => {
    it('should return true for transfers', () => {
      const tx = createTransaction({ ...baseTransaction, type: 'transfer' });
      expect(isTransfer(tx)).toBe(true);
    });

    it('should return false for deposits', () => {
      const tx = createTransaction({ ...baseTransaction, type: 'deposit' });
      expect(isTransfer(tx)).toBe(false);
    });

    it('should return false for withdrawals', () => {
      const tx = createTransaction({ ...baseTransaction, type: 'withdrawal' });
      expect(isTransfer(tx)).toBe(false);
    });
  });

  describe('hasCategory', () => {
    it('should return true when category is assigned', () => {
      const tx = createTransaction({ ...baseTransaction, categoryId: 'cat-1' });
      expect(hasCategory(tx)).toBe(true);
    });

    it('should return false when category is undefined', () => {
      const tx = createTransaction(baseTransaction);
      expect(hasCategory(tx)).toBe(false);
    });
  });

  describe('TRANSACTION_TYPE_LABELS', () => {
    it('should have labels for all types', () => {
      expect(TRANSACTION_TYPE_LABELS.deposit).toBe('Deposit');
      expect(TRANSACTION_TYPE_LABELS.withdrawal).toBe('Withdrawal');
      expect(TRANSACTION_TYPE_LABELS.transfer).toBe('Transfer');
    });
  });

  describe('TRANSACTION_TYPE_SIGN', () => {
    it('should have correct signs', () => {
      expect(TRANSACTION_TYPE_SIGN.deposit).toBe(1);
      expect(TRANSACTION_TYPE_SIGN.withdrawal).toBe(-1);
      expect(TRANSACTION_TYPE_SIGN.transfer).toBe(0);
    });
  });
});
