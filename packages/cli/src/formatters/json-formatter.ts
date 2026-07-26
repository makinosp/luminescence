import type { Transaction, SpendingOverview, IncomeVsExpensesReport, TrendAnalysis } from '@luminescence/core';

export class JSONFormatter {
  formatTransactions(transactions: Transaction[]): string {
    return JSON.stringify(transactions, null, 2);
  }

  formatTransaction(transaction: Transaction): string {
    return JSON.stringify(transaction, null, 2);
  }

  formatAccounts(
    accounts: Array<{
      id: string;
      name: string;
      type: string;
      currentBalance?: number;
    }>,
  ): string {
    return JSON.stringify(accounts, null, 2);
  }

  formatCategories(categories: Array<{ id: string; name: string }>): string {
    return JSON.stringify(categories, null, 2);
  }

  formatSpendingOverview(overview: SpendingOverview): string {
    return JSON.stringify(overview, null, 2);
  }

  formatIncomeVsExpenses(report: IncomeVsExpensesReport): string {
    return JSON.stringify(report, null, 2);
  }

  formatTrendAnalysis(analysis: TrendAnalysis): string {
    return JSON.stringify(analysis, null, 2);
  }
}
