import { Transaction } from '@luminescence/core';

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

  formatAccounts(accounts: Array<{ id: string; name: string; type: string; currentBalance?: number }>): string {
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
}
