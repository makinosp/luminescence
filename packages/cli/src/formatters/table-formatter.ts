import type { Transaction, SpendingOverview, IncomeVsExpensesReport, TrendAnalysis } from '@luminescence/core';

export class TableFormatter {
  formatTransactions(transactions: Transaction[]): string {
    if (transactions.length === 0) {
      return 'No transactions found.';
    }

    const header = 'ID'.padEnd(8) + 'Date'.padEnd(12) + 'Type'.padEnd(12) + 'Amount'.padEnd(15) + 'Description';
    const separator = '-'.repeat(80);
    const rows = transactions.map((t) => {
      const id = t.id?.substring(0, 7).padEnd(8) ?? ''.padEnd(8);
      const date = t.date?.toISOString().substring(0, 10).padEnd(12) ?? ''.padEnd(12);
      const type = t.type?.padEnd(12) ?? ''.padEnd(12);
      const amount = t.amount?.toString().padEnd(15) ?? ''.padEnd(15);
      const description = t.description ?? '';
      return id + date + type + amount + description;
    });

    return [header, separator, ...rows].join('\n');
  }

  formatTransaction(transaction: Transaction): string {
    const lines = [
      `ID: ${transaction.id ?? 'N/A'}`,
      `Date: ${transaction.date?.toISOString().substring(0, 10) ?? 'N/A'}`,
      `Type: ${transaction.type ?? 'N/A'}`,
      `Amount: ${transaction.amount ?? 'N/A'}`,
      `Description: ${transaction.description ?? 'N/A'}`,
      `Source: ${transaction.fromAccountId ?? 'N/A'}`,
      `Destination: ${transaction.toAccountId ?? 'N/A'}`,
      `Category: ${transaction.categoryId ?? 'N/A'}`,
    ];
    return lines.join('\n');
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
      return 'No accounts found.';
    }

    const header = 'ID'.padEnd(8) + 'Name'.padEnd(30) + 'Type'.padEnd(15) + 'Balance';
    const separator = '-'.repeat(70);
    const rows = accounts.map((a) => {
      const id = a.id?.substring(0, 7).padEnd(8) ?? ''.padEnd(8);
      const name = (a.name ?? '').padEnd(30);
      const type = (a.type ?? '').padEnd(15);
      const balance = a.currentBalance?.toString() ?? 'N/A';
      return id + name + type + balance;
    });

    return [header, separator, ...rows].join('\n');
  }

  formatCategories(categories: Array<{ id: string; name: string }>): string {
    if (categories.length === 0) {
      return 'No categories found.';
    }

    const header = 'ID'.padEnd(8) + 'Name';
    const separator = '-'.repeat(50);
    const rows = categories.map((c) => {
      const id = c.id?.substring(0, 7).padEnd(8) ?? ''.padEnd(8);
      const name = c.name ?? '';
      return id + name;
    });

    return [header, separator, ...rows].join('\n');
  }

  formatSpendingOverview(overview: SpendingOverview): string {
    const lines: string[] = [];
    lines.push('=== Spending Overview ===');
    lines.push(`Period: ${overview.period}`);
    lines.push(
      `Period: ${overview.dateRange.startDate.toISOString().substring(0, 10)} — ${overview.dateRange.endDate.toISOString().substring(0, 10)}`,
    );
    lines.push(`Total Income:    ${overview.totalIncome.toFixed(2)}`);
    lines.push(`Total Expenses:  ${overview.totalExpenses.toFixed(2)}`);
    lines.push(`Net Cashflow:    ${overview.netCashflow.toFixed(2)}`);

    if (overview.categoryBreakdown.length > 0) {
      lines.push('');
      lines.push('--- Category Breakdown ---');
      const catHeader = 'Category'.padEnd(30) + 'Spent'.padEnd(15) + 'Percentage'.padEnd(12) + 'Count';
      const catSep = '-'.repeat(70);
      lines.push(catHeader);
      lines.push(catSep);
      for (const cat of overview.categoryBreakdown) {
        const name = (cat.categoryName ?? 'Unknown').padEnd(30);
        const spent = cat.totalSpent.toFixed(2).padEnd(15);
        const pct = cat.percentage.toFixed(1).padEnd(12);
        const count = String(cat.transactionCount);
        lines.push(name + spent + pct + count);
      }
    }

    return lines.join('\n');
  }

  formatIncomeVsExpenses(report: IncomeVsExpensesReport): string {
    const lines: string[] = [];
    lines.push('=== Income vs Expenses ===');
    lines.push(`Period: ${report.period}`);
    lines.push(
      `${report.dateRange.startDate.toISOString().substring(0, 10)} — ${report.dateRange.endDate.toISOString().substring(0, 10)}`,
    );
    lines.push('');
    lines.push(`Income:     ${report.income.toFixed(2)}`);
    lines.push(`Expenses:   ${report.expenses.toFixed(2)}`);
    lines.push(`Net:        ${report.netCashflow.toFixed(2)}`);
    return lines.join('\n');
  }

  formatTrendAnalysis(analysis: TrendAnalysis): string {
    if (analysis.months.length === 0) {
      return 'No trend data available.';
    }

    const lines: string[] = [];
    lines.push('=== Trend Analysis ===');
    lines.push('');
    const header = 'Month'.padEnd(12) + 'Income'.padEnd(15) + 'Expenses'.padEnd(15) + 'Net Cashflow';
    const separator = '-'.repeat(60);
    lines.push(header);
    lines.push(separator);
    for (const month of analysis.months) {
      const m = (month.month ?? '').padEnd(12);
      const i = month.income.toFixed(2).padEnd(15);
      const e = month.expenses.toFixed(2).padEnd(15);
      const n = month.netCashflow.toFixed(2);
      lines.push(m + i + e + n);
    }
    return lines.join('\n');
  }
}
