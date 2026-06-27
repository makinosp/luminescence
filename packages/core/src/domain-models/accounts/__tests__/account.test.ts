import { describe, it, expect } from 'vitest';
import { createAccount, isActiveAccount, ACCOUNT_TYPE_LABELS } from '../account.js';

describe('Account', () => {
  describe('createAccount', () => {
    it('should create an immutable account', () => {
      const account = createAccount({
        id: 'acct-1',
        name: 'Checking Account',
        type: 'asset',
        currencyCode: 'JPY',
        currentBalance: 100000,
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      });

      expect(account.id).toBe('acct-1');
      expect(account.name).toBe('Checking Account');
      expect(account.type).toBe('asset');
      expect(account.currencyCode).toBe('JPY');
      expect(account.currentBalance).toBe(100000);
      expect(account.isActive).toBe(true);
    });
  });

  describe('isActiveAccount', () => {
    it('should return true for active accounts', () => {
      const account = createAccount({
        id: 'acct-1',
        name: 'Active',
        type: 'asset',
        currencyCode: 'USD',
        currentBalance: 100,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      expect(isActiveAccount(account)).toBe(true);
    });

    it('should return false for inactive accounts', () => {
      const account = createAccount({
        id: 'acct-2',
        name: 'Inactive',
        type: 'asset',
        currencyCode: 'USD',
        currentBalance: 0,
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      expect(isActiveAccount(account)).toBe(false);
    });
  });

  describe('ACCOUNT_TYPE_LABELS', () => {
    it('should have labels for all types', () => {
      expect(ACCOUNT_TYPE_LABELS.asset).toBe('Asset');
      expect(ACCOUNT_TYPE_LABELS.liability).toBe('Liability');
      expect(ACCOUNT_TYPE_LABELS.revenue).toBe('Revenue');
      expect(ACCOUNT_TYPE_LABELS.expense).toBe('Expense');
    });
  });
});
