import type { Category } from '../domain-models/categories/category.js';
import type { APIError, NetworkError, AuthError } from '../errors/error-types.js';
import { makeAutoObservable, runInAction } from 'mobx';

/**
 * Category list state.
 */
export class CategoryStore {
  categories: Category[] = [];
  isLoading = false;
  error: APIError | NetworkError | AuthError | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  /**
   * Set the category list.
   */
  setCategories(categories: Category[]): void {
    this.categories = categories;
    this.error = null;
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
   * Clear all categories (logout).
   */
  clear(): void {
    runInAction(() => {
      this.categories = [];
      this.isLoading = false;
      this.error = null;
    });
  }
}
