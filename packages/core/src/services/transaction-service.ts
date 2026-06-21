import type { IFireflyIIIClient } from '../api-client/firefly-client.js';
import type { Transaction } from '../domain-models/transactions/transaction.js';
import type { CreateTransactionInput } from '../domain-models/transactions/serializers.js';
import type { APIError, NetworkError, AuthError } from '../errors/error-types.js';
import { ValidationService } from './validation-service.js';
import { TransactionStore } from '../stores/transaction-store.js';

/**
 * Transaction service.
 * Orchestrates transaction CRUD with validation and store updates.
 *
 * Flow: Validate → API call → Update store → Return result
 * SB-03: All input validated client-side before API submission.
 * AC3-06: No optimistic updates — UI waits for API confirmation.
 */
export class TransactionService {
  constructor(
    private readonly apiClient: IFireflyIIIClient,
    private readonly validationService: ValidationService,
    private readonly transactionStore: TransactionStore,
  ) { }

  /**
   * Get transactions with optional filters.
   */
  async getTransactions(filters?: {
    startDate?: Date;
    endDate?: Date;
    accountId?: string;
    categoryId?: string;
  }): Promise<Transaction[]> {
    this.transactionStore.setLoading(true);
    this.transactionStore.setError(null);

    try {
      const result = await this.apiClient.getTransactions({
        page: 1,
        limit: 50,
        ...filters,
      });

      this.transactionStore.setTransactions(result.transactions, result.hasMore, 1);
      return result.transactions;
    } catch (error) {
      this.transactionStore.setError(error as APIError | NetworkError | AuthError);
      throw error;
    } finally {
      this.transactionStore.setLoading(false);
    }
  }

  /**
   * Get a single transaction by ID.
   */
  async getTransaction(id: string): Promise<Transaction> {
    return this.apiClient.getTransaction(id);
  }

  /**
   * Create a new transaction.
   */
  async createTransaction(input: CreateTransactionInput): Promise<Transaction> {
    // Validate input before API submission (SB-03)
    this.validationService.throwIfInvalid(
      this.validationService.validateTransactionInput(input),
    );

    const transaction = await this.apiClient.createTransaction(input);
    this.transactionStore.addTransaction(transaction);
    return transaction;
  }

  /**
   * Update an existing transaction.
   */
  async updateTransaction(id: string, input: Partial<CreateTransactionInput>): Promise<Transaction> {
    const transaction = await this.apiClient.updateTransaction(id, input);
    this.transactionStore.updateTransaction(id, transaction);
    return transaction;
  }

  /**
   * Delete a transaction.
   */
  async deleteTransaction(id: string): Promise<void> {
    await this.apiClient.deleteTransaction(id);
    this.transactionStore.removeTransaction(id);
  }

  /**
   * Get transactions grouped by category.
   * Computed from store data (no API call).
   */
  getTransactionsByCategory(): Map<string, Transaction[]> {
    return this.transactionStore.transactionsByCategory;
  }

  /**
   * Get transactions within a date range.
   * Filtered from store data (no API call).
   */
  getTransactionsByDateRange(start: Date, end: Date): Transaction[] {
    return this.transactionStore.transactions.filter((tx) => {
      return tx.date >= start && tx.date <= end;
    });
  }
}
