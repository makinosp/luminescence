# Shared Core - Service Layer Design

## 1. Service Architecture Overview

### 1.1 Service Dependency Graph

```
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer Architecture                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              AuthenticationService                   │   │
│  │  Orchestrates: AuthStore, ISecureStorage,            │   │
│  │                ILocalSettings, IFireflyIIIClient     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              TransactionService                      │   │
│  │  Orchestrates: TransactionStore, IFireflyIIIClient,  │   │
│  │                ValidationService, Transaction domain  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              AccountService                          │   │
│  │  Orchestrates: AccountStore, IFireflyIIIClient,      │   │
│  │                Account domain                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              CategoryService                         │   │
│  │  Orchestrates: CategoryStore, IFireflyIIIClient,     │   │
│  │                Category domain, TransactionService    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              ReportService                           │   │
│  │  Orchestrates: ReportStore, IFireflyIIIClient,       │   │
│  │                TransactionService, CategoryService   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              ValidationService                       │   │
│  │  Pure functions: Transaction, Account, Category     │   │
│  │  validators (no I/O, no side effects)               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              ErrorHandlingService                    │   │
│  │  Pure functions: Error categorization, messages,    │   │
│  │  logging, retry logic (no I/O, no side effects)     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. AuthenticationService

### 2.1 Interface

```typescript
export interface IAuthenticationService {
    /**
     * Check if the user is configured (baseURL + token exist).
     */
    isConfigured(): boolean;

    /**
     * Configure the server with base URL and token.
     * Validates input, tests connectivity, stores credentials.
     *
     * Flow:
     * 1. Validate URL (HTTPS, well-formed) — SB-03
     * 2. Validate token (non-empty)
     * 3. Test Firefly III connectivity
     * 4. Store token in SecureStorage — SB-02
     * 5. Store URL in LocalSettings — SB-01
     * 6. Update AuthStore state
     *
     * @throws ValidationError, APIError, AuthError, StorageError
     */
    configureServer(baseURL: string, token: string): Promise<void>;

    /**
     * Reconfigure with new credentials.
     * Clears existing data before configuring.
     */
    reconfigure(baseURL: string, token: string): Promise<void>;

    /**
     * Get a valid token for API requests.
     * Retrieves from SecureStorage.
     *
     * @throws AuthError if token is missing or invalid
     */
    getValidToken(): Promise<string>;

    /**
     * Log out the user.
     * Clears credentials and resets all stores.
     */
    logout(): Promise<void>;

    /**
     * Validate API connectivity and token.
     */
    validateConnectivity(): Promise<boolean>;
}
```

### 2.2 Implementation Notes

- **SB-02**: Token is stored ONLY in `ISecureStorage`, never in `ILocalSettings`.
- **SB-03**: URL is validated for HTTPS scheme before submission.
- **NFR-07**: If storage is unavailable, the operation fails closed with a user-friendly error.
- **Clarification Q9: B**: On storage failure, prompt user to check device security settings.

---

## 3. TransactionService

### 3.1 Interface

```typescript
export interface ITransactionService {
    /**
     * Get transactions with optional filters.
     * Loads from API and updates TransactionStore.
     *
     * @param filters - Optional date range, account, category filters
     * @throws APIError, AuthError
     */
    getTransactions(filters?: {
        startDate?: Date;
        endDate?: Date;
        accountId?: string;
        categoryId?: string;
    }): Promise<Transaction[]>;

    /**
     * Get a single transaction by ID.
     *
     * @throws APIError (404), AuthError
     */
    getTransaction(id: string): Promise<Transaction>;

    /**
     * Create a new transaction.
     * Validates input before API submission (SB-03).
     *
     * Flow:
     * 1. Validate input (ValidationService)
     * 2. Call IFireflyIIIClient.createTransaction()
     * 3. On success: Add to TransactionStore
     * 4. On error: Categorize and surface to user
     *
     * @throws ValidationError, APIError, AuthError
     */
    createTransaction(input: CreateTransactionInput): Promise<Transaction>;

    /**
     * Update an existing transaction.
     * Only changed fields are sent.
     *
     * @throws ValidationError, APIError (404), AuthError
     */
    updateTransaction(id: string, input: Partial<CreateTransactionInput>): Promise<Transaction>;

    /**
     * Delete a transaction.
     *
     * @throws APIError (404), AuthError
     */
    deleteTransaction(id: string): Promise<void>;

    /**
     * Get transactions grouped by category.
     * Computed from store data (no API call).
     */
    getTransactionsByCategory(): Map<string, Transaction[]>;

    /**
     * Get transactions within a date range.
     * Filtered from store data (no API call).
     */
    getTransactionsByDateRange(start: Date, end: Date): Transaction[];
}
```

### 3.2 Implementation Notes

- **SB-03**: All input is validated client-side before API submission.
- **AC3-06**: No optimistic updates — UI waits for API confirmation.
- **Clarification Q6: C**: Data is loaded on demand, not automatically refreshed.

---

## 4. AccountService

### 4.1 Interface

```typescript
export interface IAccountService {
    /**
     * Get accounts with optional type filter.
     *
     * @param filter - Optional account type filter
     * @throws APIError, AuthError
     */
    getAccounts(filter?: AccountType): Promise<Account[]>;

    /**
     * Get a single account by ID.
     *
     * @throws APIError (404), AuthError
     */
    getAccount(id: string): Promise<Account>;

    /**
     * Get asset accounts (for transaction source/destination).
     */
    getAssetAccounts(): Promise<Account[]>;

    /**
     * Select an account for UI context.
     */
    selectAccount(accountId: string): void;
}
```

---

## 5. CategoryService

### 5.1 Interface

```typescript
export interface ICategoryService {
    /**
     * Get all categories.
     *
     * @throws APIError, AuthError
     */
    getCategories(): Promise<Category[]>;

    /**
     * Get a single category by ID.
     *
     * @throws APIError (404), AuthError
     */
    getCategory(id: string): Promise<Category>;

    /**
     * Get total spending by category.
     * Aggregates from TransactionService data.
     */
    getSpendingByCategory(): Promise<Map<string, number>>;

    /**
     * Get all transactions for a specific category.
     */
    getCategoryTransactions(categoryId: string): Promise<Transaction[]>;
}
```

---

## 6. ReportService

### 6.1 Interface

```typescript
export interface IReportService {
    /**
     * Get spending overview for a period.
     * Clarification Q7: C — Uses Firefly III API for standard reports,
     * client-side calculation for custom queries.
     *
     * @param period - Report period preset
     * @param customRange - Custom date range (required when period is 'custom')
     * @throws ValidationError, APIError, AuthError
     */
    getSpendingOverview(period: ReportPeriod, customRange?: DateRange): Promise<SpendingOverview>;

    /**
     * Get income vs expenses comparison.
     */
    getIncomeVsExpenses(
        period: ReportPeriod,
        customRange?: DateRange,
    ): Promise<IncomeVsExpensesReport>;

    /**
     * Get spending breakdown by category.
     */
    getSpendingByCategory(
        period: ReportPeriod,
        customRange?: DateRange,
    ): Promise<CategorySpending[]>;

    /**
     * Get trend analysis over N months.
     */
    getTrendAnalysis(months: number): Promise<TrendAnalysis>;

    /**
     * Validate a report period specification.
     */
    validatePeriod(period: ReportPeriod | DateRange): ValidationResult;
}
```

### 6.2 Implementation Notes

- **Clarification Q7: C**: Standard reports use Firefly III API; custom queries use client-side calculation.
- The service abstracts this distinction from the UI layer.
- Client-side calculations use the pure functions from `domain-models.md`.

---

## 7. ValidationService

### 7.1 Interface

```typescript
export interface IValidationService {
    /**
     * Validate server URL.
     * Must be HTTPS and well-formed.
     * SB-03, NFR-01
     */
    validateServerURL(url: string): ValidationResult;

    /**
     * Validate personal access token.
     * Must be non-empty.
     */
    validateToken(token: string): ValidationResult;

    /**
     * Validate transaction input.
     * Comprehensive validation using domain validators.
     * Returns field-level errors (Clarification Q8: A).
     */
    validateTransactionInput(input: unknown): ValidationResult;

    /**
     * Validate account selection.
     * Verifies account exists in store.
     */
    validateAccountSelection(accountId: string): ValidationResult;

    /**
     * Validate date range.
     * Start before end, max 5 years.
     */
    validateDateRange(startDate: Date, endDate: Date): ValidationResult;
}
```

### 7.2 Implementation Notes

- **Pure functions**: No I/O, no side effects.
- **PBT-suitable**: All validators are pure and deterministic.
- **Field-level errors**: Per Clarification Q8 Answer A.

---

## 8. ErrorHandlingService

### 8.1 Interface

```typescript
export interface IErrorHandlingService {
    /**
     * Categorize an unknown error.
     * Maps to: network | auth | validation | api | storage
     *
     * SB-04: No secrets in error messages.
     */
    categorizeError(error: unknown): ErrorCategory;

    /**
     * Get a user-friendly error message.
     * Safe for display in UI.
     *
     * @param category - Error category
     * @param context - Optional context for message selection
     */
    getUserMessage(category: ErrorCategory, context?: Record<string, unknown>): string;

    /**
     * Log an error with secrets redacted.
     * NFR-05: Structured logging.
     * SB-04: No secrets in logs.
     */
    logError(error: unknown, context?: string): void;

    /**
     * Determine if an operation can be retried.
     * Clarification Q5: A — Only idempotent GET operations.
     */
    shouldRetry(error: LuminescenceError, attemptCount: number): boolean;

    /**
     * Calculate exponential backoff delay.
     */
    getRetryDelay(attemptCount: number): number;
}
```

### 8.2 Error Categories

```typescript
export type ErrorCategory =
    | "network" // Connection failure, timeout
    | "auth" // Invalid/expired token
    | "validation" // User input invalid
    | "api" // Firefly III server error
    | "storage" // Secure/local storage failure
    | "unknown"; // Unclassified error
```

### 8.3 User Messages (SB-04)

| Category     | User Message                                                                     |
| ------------ | -------------------------------------------------------------------------------- |
| `network`    | `"Unable to connect. Please check your internet connection."`                    |
| `auth`       | `"Your session has expired. Please reconfigure your server settings."`           |
| `validation` | `"Please check your input and try again."`                                       |
| `api`        | `"The server encountered an error. Please try again later."`                     |
| `storage`    | `"Unable to access secure storage. Please check your device security settings."` |
| `unknown`    | `"An unexpected error occurred. Please try again."`                              |

---

## 9. Service Orchestration Flows

### 9.1 Authentication Flow

```
User provides baseURL + token
  │
  ▼
AuthenticationService.configureServer(baseURL, token)
  │
  ├─→ ValidationService.validateServerURL(baseURL)
  │   └─→ HTTPS check, URL format check
  │
  ├─→ ValidationService.validateToken(token)
  │   └─→ Non-empty check
  │
  ├─→ IFireflyIIIClient.setBaseURL(baseURL)
  │
  ├─→ IFireflyIIIClient.setToken(token)
  │
  ├─→ IFireflyIIIClient.validateConnectivity()
  │   └─→ GET /api/v2/about
  │
  ├─→ ISecureStorage.setToken('ff3-token', token)
  │   └─→ Platform-specific secure storage
  │
  ├─→ ILocalSettings.set('server-base-url', baseURL)
  │   └─→ Platform-specific local settings
  │
  └─→ AuthStore: isConfigured = true, isTokenValid = true
      └─→ MobX reactivity: UI updates automatically
```

### 9.2 Transaction Creation Flow

```
User submits transaction form
  │
  ▼
TransactionService.createTransaction(input)
  │
  ├─→ ValidationService.validateTransactionInput(input)
  │   ├─→ validateAmount(input.amount)
  │   ├─→ validateDescription(input.description)
  │   ├─→ validateDate(input.date)
  │   ├─→ validateTransactionType(input.type)
  │   └─→ Account pairing rules
  │
  ├─→ IFireflyIIIClient.createTransaction(input)
  │   └─→ POST /api/v1/transactions
  │
  ├─→ [Success] TransactionStore.addTransaction(result)
  │   └─→ MobX reactivity: UI updates with new transaction
  │
  └─→ [Error] ErrorHandlingService.categorizeError(error)
      └─→ ErrorHandlingService.getUserMessage(category)
          └─→ UI displays user-friendly message
```

### 9.3 Logout Flow

```
User initiates logout
  │
  ▼
AuthenticationService.logout()
  │
  ├─→ ISecureStorage.removeToken('ff3-token')
  │
  ├─→ ILocalSettings.remove('server-base-url')
  │
  ├─→ AuthStore: isConfigured = false, isTokenValid = false
  │
  ├─→ TransactionStore.clear()
  ├─→ AccountStore.clear()
  ├─→ CategoryStore.clear()
  ├─→ ReportStore.clear()
  │
  └─→ UI redirects to configuration screen
```

---

## 10. Service Interaction Matrix

| Service                   | Depends On                                                                                       | Purpose                                |
| ------------------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------- |
| **AuthenticationService** | IFireflyIIIClient, ISecureStorage, ILocalSettings, AuthStore, ValidationService                  | Token management, connectivity check   |
| **TransactionService**    | IFireflyIIIClient, TransactionStore, ValidationService, ErrorHandlingService, Transaction domain | CRUD operations, validation            |
| **AccountService**        | IFireflyIIIClient, AccountStore, Account domain                                                  | Account queries, filtering             |
| **CategoryService**       | IFireflyIIIClient, CategoryStore, Category domain, TransactionService                            | Category queries, spending aggregation |
| **ReportService**         | IFireflyIIIClient, ReportStore, TransactionService, CategoryService                              | Report generation, trend analysis      |
| **ValidationService**     | Transaction, Account, Category (validators only)                                                 | Input sanitization                     |
| **ErrorHandlingService**  | None (pure functions)                                                                            | Error categorization, messaging        |
