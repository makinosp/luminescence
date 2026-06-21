import type { IFireflyIIIClient } from '../api-client/firefly-client.js';
import type { Account, AccountType } from '../domain-models/accounts/account.js';
import type { APIError, NetworkError, AuthError } from '../errors/error-types.js';
import { AccountStore } from '../stores/account-store.js';

/**
 * Account service.
 * Orchestrates account listing and selection.
 */
export class AccountService {
  constructor(
    private readonly apiClient: IFireflyIIIClient,
    private readonly accountStore: AccountStore,
  ) { }

  /**
   * Get accounts with optional type filter.
   */
  async getAccounts(filter?: AccountType): Promise<Account[]> {
    this.accountStore.setLoading(true);
    this.accountStore.setError(null);

    try {
      const accounts = await this.apiClient.getAccounts(filter ? { type: filter } : undefined);
      this.accountStore.setAccounts(accounts);
      return accounts;
    } catch (error) {
      this.accountStore.setError(error as APIError | NetworkError | AuthError);
      throw error;
    } finally {
      this.accountStore.setLoading(false);
    }
  }

  /**
   * Get a single account by ID.
   */
  async getAccount(id: string): Promise<Account> {
    return this.apiClient.getAccount(id);
  }

  /**
   * Get asset accounts (for transaction source/destination).
   */
  async getAssetAccounts(): Promise<Account[]> {
    const accounts = await this.getAccounts('asset');
    return accounts.filter((a) => a.isActive);
  }

  /**
   * Select an account for UI context.
   */
  selectAccount(accountId: string): void {
    this.accountStore.selectAccount(accountId);
  }
}
