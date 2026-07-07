import type { IFireflyIIIClient } from '../api-client/firefly-client.js';
import type { Category } from '../domain-models/categories/category.js';
import type { Transaction } from '../domain-models/transactions/transaction.js';
import type { APIError, NetworkError, AuthError } from '../errors/error-types.js';
import type { CategoryStore } from '../stores/category-store.js';
import type { TransactionService } from './transaction-service.js';

/**
 * Category service.
 * Orchestrates category listing and transaction grouping.
 */
export class CategoryService {
  constructor(
    private readonly apiClient: IFireflyIIIClient,
    private readonly categoryStore: CategoryStore,
    private readonly transactionService: TransactionService,
  ) {}

  /**
   * Get all categories.
   */
  async getCategories(): Promise<Category[]> {
    this.categoryStore.setLoading(true);
    this.categoryStore.setError(null);

    try {
      const categories = await this.apiClient.getCategories();
      this.categoryStore.setCategories(categories);
      return categories;
    } catch (error) {
      this.categoryStore.setError(error as APIError | NetworkError | AuthError);
      throw error;
    } finally {
      this.categoryStore.setLoading(false);
    }
  }

  /**
   * Get a single category by ID.
   */
  async getCategory(id: string): Promise<Category> {
    return this.apiClient.getCategory(id);
  }

  /**
   * Get total spending by category.
   * Aggregates from TransactionService data.
   */
  async getSpendingByCategory(): Promise<Map<string, number>> {
    const grouped = this.transactionService.getTransactionsByCategory();
    const spending = new Map<string, number>();

    for (const [categoryId, transactions] of grouped) {
      const total = transactions.filter((t) => t.type === 'withdrawal').reduce((sum, t) => sum + t.amount, 0);
      spending.set(categoryId, total);
    }

    return spending;
  }

  /**
   * Get all transactions for a specific category.
   */
  async getCategoryTransactions(categoryId: string): Promise<Transaction[]> {
    const grouped = this.transactionService.getTransactionsByCategory();
    return grouped.get(categoryId) ?? [];
  }
}
