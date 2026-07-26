import type { Transaction, SpendingOverview, IncomeVsExpensesReport, TrendAnalysis } from '@luminescence/core';

export class CSVFormatter {
  formatTransactions(transactions: Transaction[]): string {
    if (transactions.length === 0) {
      return '';
    }

    const headers = ['id', 'date', 'type', 'amount', 'description', 'fromAccountId', 'toAccountId', 'categoryId'];
    const rows = transactions.map((t) => [
      t.id ?? '',
      t.date?.toISOString().substring(0, 10) ?? '',
      t.type ?? '',
      t.amount?.toString() ?? '',
      t.description ?? '',
      t.fromAccountId ?? '',
      t.toAccountId ?? '',
      t.categoryId ?? '',
    ]);

    return [headers, ...rows].map((row) => row.map(this.escapeCSV).join(',')).join('\n');
  }

  formatTransaction(transaction: Transaction): string {
    const headers = ['id', 'date', 'type', 'amount', 'description', 'fromAccountId', 'toAccountId', 'categoryId'];
    const values = [
      transaction.id ?? '',
      transaction.date?.toISOString().substring(0, 10) ?? '',
      transaction.type ?? '',
      transaction.amount?.toString() ?? '',
      transaction.description ?? '',
      transaction.fromAccountId ?? '',
      transaction.toAccountId ?? '',
      transaction.categoryId ?? '',
    ];
    return [headers, values].map((row) => row.map(this.escapeCSV).join(',')).join('\n');
  }

  formatAccounts(
    accounts: Array<{
      id: string;
      name: string;
      type: string;
      currentBalance?: number;
    }>,
  ): string {
    if (accounts.length === 0) {
      return '';
    }

    const headers = ['id', 'name', 'type', 'currentBalance'];
    const rows = accounts.map((a) => [a.id ?? '', a.name ?? '', a.type ?? '', a.currentBalance?.toString() ?? '']);

    return [headers, ...rows].map((row) => row.map(this.escapeCSV).join(',')).join('\n');
  }

  formatCategories(categories: Array<{ id: string; name: string }>): string {
    if (categories.length === 0) {
      return '';
    }

    const headers = ['id', 'name'];
    const rows = categories.map((c) => [c.id ?? '', c.name ?? '']);

    return [headers, ...rows].map((row) => row.map(this.escapeCSV).join(',')).join('\n');
  }

  formatSpendingOverview(overview: SpendingOverview): string {
    if (overview.categoryBreakdown.length === 0) {
      return '';
    }

    const headers = ['categoryId', 'categoryName', 'totalSpent', 'percentage', 'transactionCount'];
    const rows = overview.categoryBreakdown.map((c) => [
      c.categoryId ?? '',
      c.categoryName ?? '',
      c.totalSpent.toString(),
      c.percentage.toFixed(1),
      String(c.transactionCount),
    ]);

    return [headers, ...rows].map((row) => row.map(this.escapeCSV).join(',')).join('\n');
  }

  formatIncomeVsExpenses(report: IncomeVsExpensesReport): string {
    const headers = ['period', 'startDate', 'endDate', 'income', 'expenses', 'netCashflow'];
    const values = [
      report.period,
      report.dateRange.startDate.toISOString().substring(0, 10),
      report.dateRange.endDate.toISOString().substring(0, 10),
      report.income.toFixed(2),
      report.expenses.toFixed(2),
      report.netCashflow.toFixed(2),
    ];
    return [headers, values].map((row) => row.map(this.escapeCSV).join(',')).join('\n');
  }

  formatTrendAnalysis(analysis: TrendAnalysis): string {
    if (analysis.months.length === 0) {
      return '';
    }

    const headers = ['month', 'income', 'expenses', 'netCashflow'];
    const rows = analysis.months.map((m) => [
      m.month,
      m.income.toFixed(2),
      m.expenses.toFixed(2),
      m.netCashflow.toFixed(2),
    ]);

    return [headers, ...rows].map((row) => row.map(this.escapeCSV).join(',')).join('\n');
  }

  private escapeCSV(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
}
