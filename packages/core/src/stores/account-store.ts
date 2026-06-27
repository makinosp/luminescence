import { makeAutoObservable, runInAction } from 'mobx';
import type { Account } from '../domain-models/accounts/account.js';
import type { APIError, NetworkError, AuthError } from '../errors/error-types.js';

/**
 * Account list state.
 */
export class AccountStore {
  accounts: Account[] = [];
  isLoading = false;
  error: APIError | NetworkError | AuthError | null = null;
  selectedAccountId: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  /**
   * Set the account list.
   */
  setAccounts(accounts: Account[]): void {
    this.accounts = accounts;
    this.error = null;
  }

  /**
   * Select an account for context.
   */
  selectAccount(accountId: string): void {
    this.selectedAccountId = accountId;
  }

  /**
   * Get the currently selected account.
   */
  get selectedAccount(): Account | undefined {
    return this.accounts.find((a) => a.id === this.selectedAccountId);
  }

  /**
   * Get asset accounts only.
   */
  get assetAccounts(): Account[] {
    return this.accounts.filter((a) => a.type === 'asset' && a.isActive);
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
   * Clear all accounts (logout).
   */
  clear(): void {
    runInAction(() => {
      this.accounts = [];
      this.isLoading = false;
      this.error = null;
      this.selectedAccountId = null;
    });
  }
}
