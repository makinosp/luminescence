import { describe, it, expect } from 'vitest';
import {
  calculateDateRange,
  calculateNetCashflow,
  calculateCategoryPercentages,
  aggregateSpendingOverview,
} from '../report.js';
import { createTransaction } from '../../transactions/transaction.js';

describe('Report', () => {
  describe('calculateDateRange', () => {
    it('should calculate current month range', () => {
      const range = calculateDateRange('current_month');
      expect(range.startDate.getDate()).toBe(1);
      expect(range.startDate.getMonth()).toBe(new Date().getMonth());
    });

    it('should calculate last month range', () => {
      const range = calculateDateRange('last_month');
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      expect(range.startDate.getMonth()).toBe(lastMonth.getMonth());
    });

    it('should calculate last 3 months range', () => {
      const range = calculateDateRange('last_3_months');
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 2);
      expect(range.startDate.getMonth()).toBe(threeMonthsAgo.getMonth());
    });

    it('should use custom range when provided', () => {
      const customRange = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      };
      const range = calculateDateRange('custom', customRange);
      expect(range).toBe(customRange);
    });

    it('should throw for custom period without range', () => {
      expect(() => calculateDateRange('custom')).toThrow('Custom date range is required');
    });
  });

  describe('calculateNetCashflow', () => {
    it('should calculate positive net cashflow', () => {
      expect(calculateNetCashflow(5000, 3000)).toBe(2000);
    });

    it('should calculate negative net cashflow', () => {
      expect(calculateNetCashflow(3000, 5000)).toBe(-2000);
    });

    it('should calculate zero net cashflow', () => {
      expect(calculateNetCashflow(5000, 5000)).toBe(0);
    });
  });

  describe('calculateCategoryPercentages', () => {
    it('should calculate percentages correctly', () => {
      const spending = new Map([
        ['cat-1', { name: 'Food', totalSpent: 500, transactionCount: 5 }],
        ['cat-2', { name: 'Transport', totalSpent: 300, transactionCount: 3 }],
        ['cat-3', { name: 'Entertainment', totalSpent: 200, transactionCount: 2 }],
      ]);

      const result = calculateCategoryPercentages(spending, 1000);
      expect(result).toHaveLength(3);
      expect(result[0]!.categoryName).toBe('Food');
      expect(result[0]!.percentage).toBe(50);
      expect(result[1]!.categoryName).toBe('Transport');
      expect(result[1]!.percentage).toBe(30);
      expect(result[2]!.categoryName).toBe('Entertainment');
      expect(result[2]!.percentage).toBe(20);
    });

    it('should return empty array for zero expenses', () => {
      const result = calculateCategoryPercentages(new Map(), 0);
      expect(result).toEqual([]);
    });
  });

  describe('aggregateSpendingOverview', () => {
    it('should aggregate transactions correctly', () => {
      const transactions = [
        createTransaction({
          id: '1',
          type: 'deposit',
          amount: 5000,
          description: 'Salary',
          date: new Date('2024-01-15'),
          fromAccountId: 'rev-1',
          toAccountId: 'acct-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        createTransaction({
          id: '2',
          type: 'withdrawal',
          amount: 500,
          description: 'Groceries',
          date: new Date('2024-01-16'),
          fromAccountId: 'acct-1',
          toAccountId: 'exp-1',
          categoryId: 'cat-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        createTransaction({
          id: '3',
          type: 'withdrawal',
          amount: 300,
          description: 'Train ticket',
          date: new Date('2024-01-17'),
          fromAccountId: 'acct-1',
          toAccountId: 'exp-2',
          categoryId: 'cat-2',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        createTransaction({
          id: '4',
          type: 'transfer',
          amount: 1000,
          description: 'Transfer to savings',
          date: new Date('2024-01-18'),
          fromAccountId: 'acct-1',
          toAccountId: 'acct-2',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ];

      const categoryNames = new Map([
        ['cat-1', 'Food'],
        ['cat-2', 'Transport'],
      ]);

      const overview = aggregateSpendingOverview(
        transactions,
        'current_month',
        { startDate: new Date('2024-01-01'), endDate: new Date('2024-01-31') },
        categoryNames,
      );

      expect(overview.totalIncome).toBe(5000);
      expect(overview.totalExpenses).toBe(800);
      expect(overview.netCashflow).toBe(4200);
      expect(overview.categoryBreakdown).toHaveLength(2);
    });
  });
});
