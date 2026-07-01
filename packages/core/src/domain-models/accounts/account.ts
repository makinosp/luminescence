/**
 * Account type per Firefly III API.
 */
export type AccountType = 'asset' | 'liability' | 'revenue' | 'expense';

/**
 * Account type display labels for UI rendering.
 */
export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  asset: 'Asset',
  liability: 'Liability',
  revenue: 'Revenue',
  expense: 'Expense',
};

/**
 * Immutable Account domain model.
 */
export interface Account {
  readonly id: string;
  readonly name: string;
  readonly type: AccountType;
  readonly currencyCode: string; // ISO 4217
  readonly currentBalance: number;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Check if an account is active and can participate in transactions.
 */
export function isActiveAccount(account: Account): boolean {
  return account.isActive;
}

/**
 * Create an Account from raw data.
 */
export function createAccount(data: {
  id: string;
  name: string;
  type: AccountType;
  currencyCode: string;
  currentBalance: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): Account {
  return Object.freeze({
    id: data.id,
    name: data.name,
    type: data.type,
    currencyCode: data.currencyCode,
    currentBalance: data.currentBalance,
    isActive: data.isActive,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  }) as unknown as Account;
}
