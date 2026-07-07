// @luminescence/core — Shared core barrel exports
// Domain models, API client, stores, services, storage interfaces, errors

// Domain Models
export type {
  Transaction,
  TransactionType,
  Account,
  AccountType,
  Category,
  ReportPeriod,
  DateRange,
  SpendingOverview,
  CategorySpending,
  IncomeVsExpensesReport,
  TrendAnalysis,
  MonthlyTrend,
  ValidationResult,
  ValidationWarning,
  CreateTransactionInput,
  FireflyIIITransactionResponse,
  FireflyIIIPaginatedResponse,
} from './domain-models/index.js';
export {
  TRANSACTION_TYPE_LABELS,
  TRANSACTION_TYPE_SIGN,
  TRANSACTION_ACCOUNT_REQUIREMENTS,
  ACCOUNT_TYPE_LABELS,
  createTransaction,
  createAccount,
  createCategory,
  netAmount,
  isTransfer,
  hasCategory,
  isActiveAccount,
  validResult,
  invalidResult,
  validateAmount,
  validateDescription,
  validateDate,
  getDateWarning,
  validateTransactionType,
  validateTransactionInput,
  validateAccountType,
  validateCategoryId,
  deserializeTransaction,
  deserializeTransactionList,
  serializeCreateTransactionInput,
  calculateDateRange,
  calculateNetCashflow,
  calculateCategoryPercentages,
  aggregateSpendingOverview,
} from './domain-models/index.js';

// API Client
export type {
  IFireflyIIIClient,
  TransactionQueryParams,
  IHTTPAdapter,
  RequestOptions,
  HTTPResponse,
} from './api-client/index.js';
export {
  FireflyIIIClient,
  HTTPSEnforcer,
  TimeoutController,
  AuthGate,
  RetryMiddleware,
  FetchAdapter,
} from './api-client/index.js';

// Stores
export { AuthStore, TransactionStore, AccountStore, CategoryStore, ReportStore, UIStore } from './stores/index.js';

// Services
export {
  ValidationService,
  AuthenticationService,
  TransactionService,
  AccountService,
  CategoryService,
  ReportService,
} from './services/index.js';

// Storage
export type { ISecureStorage, ILocalSettings } from './storage/index.js';
export {
  SECURE_STORAGE_KEYS,
  LOCAL_SETTINGS_KEYS,
  KeychainAdapter,
  KeystoreAdapter,
  SessionStorageAdapter,
  KeyringAdapter,
  AsyncStorageAdapter,
  LocalStorageAdapter,
  JSONConfigAdapter,
} from './storage/index.js';

// Errors
export type { ErrorCategory, RedactedError } from './errors/index.js';
export {
  LuminescenceError,
  APIError,
  NetworkError,
  ValidationError,
  StorageError,
  AuthError,
  ErrorHandlingService,
  errorHandlingService,
} from './errors/index.js';
