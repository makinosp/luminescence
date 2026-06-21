import { makeAutoObservable, computed, runInAction } from 'mobx';
import type { Transaction } from '../domain-models/transactions/transaction.js';
import type { APIError, NetworkError, AuthError } from '../errors/error-types.js';

/**
 * Transaction list state.
 * NFR Performance §3.2: Up to 1,000 items per view.
 * Clarification Q6: C — Manual refresh only.
 */
export class TransactionStore {
  transactions: Transaction[] = [];
  isLoading = false;
  error: APIError | NetworkError | AuthError | null = null;
  currentPage = 1;
  hasMore = false;

  constructor() {
    makeAutoObservable(this, {
      transactionsByCategory: computed,
      monthlySummary: computed,
    });
  }

  /**
   * Transactions grouped by category.
   * Computed property — cached until transactions change.
   */
  get transactionsByCategory(): Map<string, Transaction[]> {
    const grouped = new Map<string, Transaction[]>();
    for (const tx of this.transactions) {
      const key = tx.categoryId ?? 'uncategorized';
      const list = grouped.get(key) ?? [];
      list.push(tx);
      grouped.set(key, list);
    }
    return grouped;
  }

  /**
   * Monthly summary of income and expenses.
   * Computed property — cached until transactions change.
   */
  get monthlySummary(): { income: number; expenses: number; netCashflow: number } {
    let income = 0;
    let expenses = 0;

    for (const tx of this.transactions) {
      if (tx.type === 'deposit') {
        income += tx.amount;
      } else if (tx.type === 'withdrawal') {
        expenses += tx.amount;
      }
    }

    return {
      income,
      expenses,
      netCashflow: income - expenses,
    };
  }

  /**
   * Set the transaction list (replaces current list).
   */
  setTransactions(transactions: Transaction[], hasMore: boolean, page: number): void {
    this.transactions = transactions;
    this.hasMore = hasMore;
    this.currentPage = page;
    this.error = null;
  }

  /**
   * Append transactions to the list (pagination).
   */
  appendTransactions(transactions: Transaction[], hasMore: boolean, page: number): void {
    this.transactions = [...this.transactions, ...transactions];
    this.hasMore = hasMore;
    this.currentPage = page;
    this.error = null;
  }

  /**
   * Add a newly created transaction.
   */
  addTransaction(transaction: Transaction): void {
    this.transactions = [transaction, ...this.transactions];
  }

  /**
   * Update an existing transaction.
   */
  updateTransaction(id: string, updates: Partial<Transaction>): void {
    const index = this.transactions.findIndex((t) => t.id === id);
    if (index !== -1) {
      const updated = { ...this.transactions[index]!, ...updates };
      const newList = [...this.transactions];
      newList[index] = updated as Transaction;
      this.transactions = newList;
    }
  }

  /**
   * Remove a transaction.
   */
  removeTransaction(id: string): void {
    this.transactions = this.transactions.filter((t) => t.id !== id);
  }

  /**
   * Set loading state.
   */
  setLoading(loading: boolean): void {
    this.isLoading = loading;
  }

  /**
   * Set an error state.
   */
  setError(error: APIError | NetworkError | AuthError | null): void {
    this.error = error;
  }

  /**
   * Clear all transactions (logout).
   */
  clear(): void {
    runInAction(() => {
      this.transactions = [];
      this.isLoading = false;
      this.error = null;
      this.currentPage = 1;
      this.hasMore = false;
    });
  }
}
