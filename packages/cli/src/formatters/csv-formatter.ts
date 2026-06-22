import { Transaction } from '@luminescence/core';

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

  formatAccounts(accounts: Array<{ id: string; name: string; type: string; currentBalance?: number }>): string {
    if (accounts.length === 0) {
      return '';
    }

    const headers = ['id', 'name', 'type', 'currentBalance'];
    const rows = accounts.map((a) => [
      a.id ?? '',
      a.name ?? '',
      a.type ?? '',
      a.currentBalance?.toString() ?? '',
    ]);

    return [headers, ...rows].map((row) => row.map(this.escapeCSV).join(',')).join('\n');
  }

  formatCategories(categories: Array<{ id: string; name: string }>): string {
    if (categories.length === 0) {
      return '';
    }

    const headers = ['id', 'name'];
    const rows = categories.map((c) => [
      c.id ?? '',
      c.name ?? '',
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
