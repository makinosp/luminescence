import { makeAutoObservable, computed, runInAction } from 'mobx';
import type { AuthError, StorageError, ValidationError } from '../errors/error-types.js';

/**
 * Authentication state.
 * Observable properties trigger UI re-renders via MobX.
 */
export class AuthStore {
  isConfigured = false;
  baseURL: string | null = null;
  isTokenValid = false;
  isLoading = false;
  error: AuthError | StorageError | ValidationError | null = null;

  constructor() {
    makeAutoObservable(this, {
      isAuthenticated: computed,
    });
  }

  /**
   * Check if the user is configured and authenticated.
   */
  get isAuthenticated(): boolean {
    return this.isConfigured && this.isTokenValid;
  }

  /**
   * Set the server configuration state.
   */
  setConfigured(baseURL: string): void {
    this.isConfigured = true;
    this.baseURL = baseURL;
    this.error = null;
  }

  /**
   * Set the token validation state.
   */
  setTokenValid(valid: boolean): void {
    this.isTokenValid = valid;
    if (!valid) {
      this.isConfigured = false;
    }
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
  setError(error: AuthError | StorageError | ValidationError | null): void {
    this.error = error;
  }

  /**
   * Reset the store to initial state (logout).
   */
  reset(): void {
    runInAction(() => {
      this.isConfigured = false;
      this.baseURL = null;
      this.isTokenValid = false;
      this.isLoading = false;
      this.error = null;
    });
  }
}
