/**
 * Transaction type enum per Firefly III API.
 * Clarification Q3 Answer A: Strict account pairing enforced.
 */
export type TransactionType = 'deposit' | 'withdrawal' | 'transfer';

/**
 * Transaction type display labels for UI rendering.
 */
export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  deposit: 'Deposit',
  withdrawal: 'Withdrawal',
  transfer: 'Transfer',
};

/**
 * Transaction type determines the sign of netAmount().
 * Deposits → positive (money coming in)
 * Withdrawals → negative (money going out)
 * Transfers → neutral (money moving between accounts)
 */
export const TRANSACTION_TYPE_SIGN: Record<TransactionType, 1 | -1 | 0> = {
  deposit: 1,
  withdrawal: -1,
  transfer: 0,
};

/**
 * Account requirements per transaction type.
 * Used by ValidationService to enforce business rules.
 */
export const TRANSACTION_ACCOUNT_REQUIREMENTS: Record<
  TransactionType,
  {
    fromRequired: boolean;
    toRequired: boolean;
    fromAccountTypes: string[];
    toAccountTypes: string[];
  }
> = {
  deposit: {
    fromRequired: true,
    toRequired: true,
    fromAccountTypes: ['revenue'],
    toAccountTypes: ['asset'],
  },
  withdrawal: {
    fromRequired: true,
    toRequired: true,
    fromAccountTypes: ['asset'],
    toAccountTypes: ['expense'],
  },
  transfer: {
    fromRequired: true,
    toRequired: true,
    fromAccountTypes: ['asset'],
    toAccountTypes: ['asset'],
  },
};

/**
 * Immutable Transaction domain model.
 * All properties are readonly to enforce immutability.
 * Created via factory functions, never mutated directly.
 */
export interface Transaction {
  readonly id: string;
  readonly type: TransactionType;
  readonly amount: number; // Positive decimal, max 2 decimal places (Clarification Q1: C)
  readonly description: string; // 1-1000 chars
  readonly date: Date; // Transaction date (Clarification Q2: C, future dates allowed with warning)
  readonly fromAccountId: string; // Source account ID (always required)
  readonly toAccountId?: string; // Destination account ID (required for transfers)
  readonly categoryId?: string; // Optional category assignment
  readonly budgetId?: string; // Optional budget assignment
  readonly tags: readonly string[]; // Immutable tag list
  readonly createdAt: Date; // Firefly III creation timestamp
  readonly updatedAt: Date; // Firefly III update timestamp
}

/**
 * Calculate the net amount of a transaction based on its type.
 * Deposits → positive, Withdrawals → negative, Transfers → 0.
 *
 * Pure function — suitable for PBT.
 */
export function netAmount(transaction: Transaction): number {
  const sign = TRANSACTION_TYPE_SIGN[transaction.type];
  return transaction.amount * sign;
}

/**
 * Check if a transaction is a transfer between two accounts.
 */
export function isTransfer(transaction: Transaction): boolean {
  return transaction.type === 'transfer';
}

/**
 * Check if a transaction has a category assigned.
 */
export function hasCategory(transaction: Transaction): boolean {
  return transaction.categoryId !== undefined && transaction.categoryId !== null;
}

/**
 * Create a Transaction from raw data.
 * Factory function ensures immutability.
 */
export function createTransaction(data: {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  date: Date;
  fromAccountId: string;
  toAccountId?: string;
  categoryId?: string;
  budgetId?: string;
  tags?: readonly string[];
  createdAt: Date;
  updatedAt: Date;
}): Transaction {
  return Object.freeze({
    id: data.id,
    type: data.type,
    amount: data.amount,
    description: data.description,
    date: data.date,
    fromAccountId: data.fromAccountId,
    toAccountId: data.toAccountId,
    categoryId: data.categoryId,
    budgetId: data.budgetId,
    tags: Object.freeze(data.tags ?? []),
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  }) as unknown as Transaction;
}
