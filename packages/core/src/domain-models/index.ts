// Domain Models — barrel exports
export type { Transaction, TransactionType } from './transactions/transaction.js';
export {
  TRANSACTION_TYPE_LABELS,
  TRANSACTION_TYPE_SIGN,
  TRANSACTION_ACCOUNT_REQUIREMENTS,
  createTransaction,
  netAmount,
  isTransfer,
  hasCategory,
} from './transactions/transaction.js';

export type { ValidationResult, ValidationWarning } from './transactions/validators.js';
export {
  validResult,
  invalidResult,
  validateAmount,
  validateDescription,
  validateDate,
  getDateWarning,
  validateTransactionType,
  validateTransactionInput,
} from './transactions/validators.js';

export type {
  CreateTransactionInput,
  FireflyIIITransactionResponse,
  FireflyIIIPaginatedResponse,
} from './transactions/serializers.js';
export {
  deserializeTransaction,
  deserializeTransactionList,
  serializeCreateTransactionInput,
} from './transactions/serializers.js';

export type { Account, AccountType } from './accounts/account.js';
export { ACCOUNT_TYPE_LABELS, createAccount, isActiveAccount } from './accounts/account.js';
export { validateAccountType } from './accounts/validators.js';

export type { Category } from './categories/category.js';
export { createCategory } from './categories/category.js';
export { validateCategoryId } from './categories/validators.js';

export type {
  ReportPeriod,
  DateRange,
  SpendingOverview,
  CategorySpending,
  IncomeVsExpensesReport,
  TrendAnalysis,
  MonthlyTrend,
} from './reports/report.js';
export {
  calculateDateRange,
  calculateNetCashflow,
  calculateCategoryPercentages,
  aggregateSpendingOverview,
} from './reports/report.js';
