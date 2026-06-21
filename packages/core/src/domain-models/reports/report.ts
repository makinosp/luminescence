import type { Transaction } from '../transactions/transaction.js';

/**
 * Report period presets.
 * Clarification Q7: C — Hybrid (API for standard, client-side for custom).
 */
export type ReportPeriod = 'current_month' | 'last_month' | 'last_3_months' | 'custom';

/**
 * Date range for custom report periods.
 */
export interface DateRange {
  readonly startDate: Date;
  readonly endDate: Date;
}

/**
 * Spending overview report data.
 */
export interface SpendingOverview {
  readonly period: ReportPeriod;
  readonly dateRange: DateRange;
  readonly totalIncome: number;
  readonly totalExpenses: number;
  readonly netCashflow: number;
  readonly categoryBreakdown: readonly CategorySpending[];
}

/**
 * Category spending breakdown.
 */
export interface CategorySpending {
  readonly categoryId: string;
  readonly categoryName: string;
  readonly totalSpent: number;
  readonly percentage: number;
  readonly transactionCount: number;
}

/**
 * Income vs expenses comparison report.
 */
export interface IncomeVsExpensesReport {
  readonly period: ReportPeriod;
  readonly dateRange: DateRange;
  readonly income: number;
  readonly expenses: number;
  readonly netCashflow: number;
}

/**
 * Trend analysis over multiple months.
 */
export interface TrendAnalysis {
  readonly months: readonly MonthlyTrend[];
}

/**
 * Monthly trend data point.
 */
export interface MonthlyTrend {
  readonly month: string; // YYYY-MM format
  readonly income: number;
  readonly expenses: number;
  readonly netCashflow: number;
}

/**
 * Calculate the date range for a given report period.
 */
export function calculateDateRange(period: ReportPeriod, customRange?: DateRange): DateRange {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (period) {
    case 'current_month': {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return { startDate: start, endDate: end };
    }
    case 'last_month': {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0);
      return { startDate: start, endDate: end };
    }
    case 'last_3_months': {
      const start = new Date(today.getFullYear(), today.getMonth() - 2, 1);
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return { startDate: start, endDate: end };
    }
    case 'custom':
      if (!customRange) {
        throw new Error('Custom date range is required for custom period');
      }
      return customRange;
  }
}

/**
 * Calculate net cashflow from income and expenses.
 * Pure function — suitable for PBT.
 */
export function calculateNetCashflow(totalIncome: number, totalExpenses: number): number {
  return totalIncome - totalExpenses;
}

/**
 * Calculate category spending percentages.
 * Sorted by totalSpent descending.
 * Pure function — suitable for PBT.
 */
export function calculateCategoryPercentages(
  categorySpending: Map<string, { name: string; totalSpent: number; transactionCount: number }>,
  totalExpenses: number,
): CategorySpending[] {
  if (totalExpenses === 0) {
    return [];
  }

  const results: CategorySpending[] = [];

  for (const [categoryId, data] of categorySpending) {
    results.push({
      categoryId,
      categoryName: data.name,
      totalSpent: data.totalSpent,
      percentage: Math.round((data.totalSpent / totalExpenses) * 10000) / 100,
      transactionCount: data.transactionCount,
    });
  }

  // Sort by totalSpent descending
  results.sort((a, b) => b.totalSpent - a.totalSpent);

  return results;
}

/**
 * Aggregate transactions into a spending overview.
 * Client-side calculation for custom queries (Clarification Q7: C).
 */
export function aggregateSpendingOverview(
  transactions: readonly Transaction[],
  period: ReportPeriod,
  dateRange: DateRange,
  categoryNames: Map<string, string>,
): SpendingOverview {
  let totalIncome = 0;
  let totalExpenses = 0;
  const categorySpending = new Map<string, { name: string; totalSpent: number; transactionCount: number }>();

  for (const tx of transactions) {
    if (tx.type === 'deposit') {
      totalIncome += tx.amount;
    } else if (tx.type === 'withdrawal') {
      totalExpenses += tx.amount;

      if (tx.categoryId) {
        const existing = categorySpending.get(tx.categoryId) ?? {
          name: categoryNames.get(tx.categoryId) ?? 'Unknown',
          totalSpent: 0,
          transactionCount: 0,
        };
        existing.totalSpent += tx.amount;
        existing.transactionCount += 1;
        categorySpending.set(tx.categoryId, existing);
      }
    }
    // Transfers are excluded from income/expense calculations
  }

  return {
    period,
    dateRange,
    totalIncome,
    totalExpenses,
    netCashflow: calculateNetCashflow(totalIncome, totalExpenses),
    categoryBreakdown: calculateCategoryPercentages(categorySpending, totalExpenses),
  };
}
