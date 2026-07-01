import type { Account, AccountType } from '../domain-models/accounts/account.js';
import type { Category } from '../domain-models/categories/category.js';
import type { SpendingOverview, IncomeVsExpensesReport, TrendAnalysis } from '../domain-models/reports/report.js';
import type { CreateTransactionInput } from '../domain-models/transactions/serializers.js';
import type { Transaction } from '../domain-models/transactions/transaction.js';

/**
 * Firefly III API client interface.
 * All HTTP operations against the Firefly III REST API.
 */
export interface IFireflyIIIClient {
  // Configuration
  setBaseURL(url: string): void;
  setToken(token: string): void;

  // Transactions
  getTransactions(params?: TransactionQueryParams): Promise<{
    transactions: Transaction[];
    hasMore: boolean;
    nextPage: number | undefined;
  }>;
  getTransaction(id: string): Promise<Transaction>;
  createTransaction(data: CreateTransactionInput): Promise<Transaction>;
  updateTransaction(id: string, data: Partial<CreateTransactionInput>): Promise<Transaction>;
  deleteTransaction(id: string): Promise<void>;

  // Accounts
  getAccounts(params?: { type?: AccountType }): Promise<Account[]>;
  getAccount(id: string): Promise<Account>;

  // Categories
  getCategories(): Promise<Category[]>;
  getCategory(id: string): Promise<Category>;

  // Reports
  getSpendingOverview(params: { startDate: Date; endDate: Date; accountIds?: string[] }): Promise<SpendingOverview>;
  getIncomeVsExpenses(params: { startDate: Date; endDate: Date }): Promise<IncomeVsExpensesReport>;
  getTrendAnalysis(params: { months: number }): Promise<TrendAnalysis>;

  // Health
  validateConnectivity(): Promise<boolean>;
}

/**
 * Query parameters for listing transactions.
 */
export interface TransactionQueryParams {
  page?: number;
  limit?: number;
  startDate?: Date;
  endDate?: Date;
  accountId?: string;
  categoryId?: string;
}
