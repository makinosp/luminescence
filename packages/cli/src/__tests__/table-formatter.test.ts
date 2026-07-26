import type { Transaction } from '@luminescence/core';
import { describe, it, expect } from 'vitest';
import { CSVFormatter } from '../formatters/csv-formatter.js';
import { JSONFormatter } from '../formatters/json-formatter.js';
import { TableFormatter } from '../formatters/table-formatter.js';

describe('TableFormatter', () => {
  const formatter = new TableFormatter();

  describe('formatTransactions', () => {
    it('should return empty message for no transactions', () => {
      const result = formatter.formatTransactions([]);
      expect(result).toBe('No transactions found.');
    });

    it('should format transactions as table', () => {
      const transactions = [
        {
          id: '123',
          type: 'withdrawal' as const,
          amount: 100,
          description: 'Test transaction',
          date: new Date('2024-01-15'),
          fromAccountId: 'acc-1',
          toAccountId: undefined,
          categoryId: undefined,
          tags: [],
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-15'),
        },
      ] as Transaction[];

      const result = formatter.formatTransactions(transactions);
      expect(result).toContain('Test transaction');
      expect(result).toContain('withdrawal');
    });
  });

  describe('formatAccounts', () => {
    it('should return empty message for no accounts', () => {
      const result = formatter.formatAccounts([]);
      expect(result).toBe('No accounts found.');
    });

    it('should format accounts as table', () => {
      const accounts = [{ id: '1', name: 'Checking', type: 'asset', currentBalance: 1000 }];

      const result = formatter.formatAccounts(accounts);
      expect(result).toContain('Checking');
      expect(result).toContain('asset');
    });
  });

  describe('formatCategories', () => {
    it('should return empty message for no categories', () => {
      const result = formatter.formatCategories([]);
      expect(result).toBe('No categories found.');
    });

    it('should format categories as table', () => {
      const categories = [{ id: '1', name: 'Groceries' }];

      const result = formatter.formatCategories(categories);
      expect(result).toContain('Groceries');
    });
  });
});

describe('JSONFormatter', () => {
  const formatter = new JSONFormatter();

  it('should format transactions as JSON', () => {
    const tx: Transaction = {
      id: '12345',
      type: 'withdrawal',
      amount: 50.0,
      description: 'Test',
      date: new Date('2024-01-15'),
      fromAccountId: 'acc-1',
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = formatter.formatTransactions([tx]);
    const parsed = JSON.parse(result);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].id).toBe('12345');
  });
});

describe('CSVFormatter', () => {
  const formatter = new CSVFormatter();

  it('should format transactions as CSV', () => {
    const tx: Transaction = {
      id: '12345',
      type: 'deposit',
      amount: 100.5,
      description: 'Test transaction',
      date: new Date('2024-01-15'),
      fromAccountId: 'acc-1',
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = formatter.formatTransactions([tx]);
    expect(result).toContain('id,date,type,amount');
    expect(result).toContain('12345,2024-01-15,deposit,100.5');
  });

  it('should escape CSV values with commas', () => {
    const tx: Transaction = {
      id: '12345',
      type: 'deposit',
      amount: 100,
      description: 'Test, with comma',
      date: new Date('2024-01-15'),
      fromAccountId: 'acc-1',
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = formatter.formatTransactions([tx]);
    expect(result).toContain('"Test, with comma"');
  });

  it('should return empty string for empty transactions', () => {
    const result = formatter.formatTransactions([]);
    expect(result).toBe('');
  });
});

describe('Report Formatters', () => {
  const tableFormatter = new TableFormatter();
  const jsonFormatter = new JSONFormatter();

  describe('TableFormatter - SpendingOverview', () => {
    it('should format spending overview summary', () => {
      const overview = {
        period: 'current_month' as const,
        dateRange: { startDate: new Date('2024-01-01'), endDate: new Date('2024-01-31') },
        totalIncome: 5000,
        totalExpenses: 3000,
        netCashflow: 2000,
        categoryBreakdown: [
          { categoryId: '1', categoryName: 'Food', totalSpent: 1000, percentage: 33.3, transactionCount: 10 },
          { categoryId: '2', categoryName: 'Transport', totalSpent: 500, percentage: 16.7, transactionCount: 5 },
        ],
      };

      const result = tableFormatter.formatSpendingOverview(overview);
      expect(result).toContain('Spending Overview');
      expect(result).toContain('5000.00');
      expect(result).toContain('3000.00');
      expect(result).toContain('2000.00');
      expect(result).toContain('Food');
      expect(result).toContain('Transport');
    });
  });

  describe('TableFormatter - IncomeVsExpenses', () => {
    it('should format income vs expenses report', () => {
      const report = {
        period: 'last_month' as const,
        dateRange: { startDate: new Date('2023-12-01'), endDate: new Date('2023-12-31') },
        income: 4000,
        expenses: 2500,
        netCashflow: 1500,
      };

      const result = tableFormatter.formatIncomeVsExpenses(report);
      expect(result).toContain('Income vs Expenses');
      expect(result).toContain('4000.00');
      expect(result).toContain('2500.00');
    });
  });

  describe('TableFormatter - TrendAnalysis', () => {
    it('should format trend analysis with monthly data', () => {
      const analysis = {
        months: [
          { month: '2024-01', income: 5000, expenses: 3000, netCashflow: 2000 },
          { month: '2024-02', income: 4500, expenses: 2800, netCashflow: 1700 },
        ],
      };

      const result = tableFormatter.formatTrendAnalysis(analysis);
      expect(result).toContain('Trend Analysis');
      expect(result).toContain('2024-01');
      expect(result).toContain('2024-02');
      expect(result).toContain('2000.00');
    });

    it('should return empty message for no data', () => {
      const analysis = { months: [] };
      const result = tableFormatter.formatTrendAnalysis(analysis);
      expect(result).toBe('No trend data available.');
    });
  });

  describe('JSONFormatter - Reports', () => {
    it('should format spending overview as JSON', () => {
      const overview = {
        period: 'current_month' as const,
        dateRange: { startDate: new Date('2024-01-01'), endDate: new Date('2024-01-31') },
        totalIncome: 5000,
        totalExpenses: 3000,
        netCashflow: 2000,
        categoryBreakdown: [],
      };

      const result = jsonFormatter.formatSpendingOverview(overview);
      const parsed = JSON.parse(result);
      expect(parsed.totalIncome).toBe(5000);
      expect(parsed.period).toBe('current_month');
    });
  });
});
