# Services

## Service Layer Architecture

The service layer orchestrates interactions between components (domain models, stores, API client, storage) while maintaining security and testability.

---

## 1. Authentication Service

**Responsibility**: Manage user authentication flow, token validation, and secure storage coordination.

**Interface**:

```typescript
interface IAuthenticationService {
  // Configuration workflow
  isConfigured(): boolean;

  configureServer(baseURL: string, token: string): Promise<void>;
    - Validates URL (HTTPS, well-formed)
    - Validates token (non-empty)
    - Tests Firefly III connectivity
    - Stores token in SecureStorage
    - Stores URL in LocalSettings
    - Error: ValidationError, APIError, AuthError

  reconfigure(): Promise<void>;
    - Prompt for new credentials (platform-specific UI)
    - Validate & store like configureServer()

  // Token management
  getValidToken(): Promise<string>;
    - Retrieve token from SecureStorage
    - Verify token is valid (not expired)
    - Error: AuthError if invalid/missing
    - Returns: Token for API requests

  logout(): Promise<void>;
    - Remove token from SecureStorage
    - Clear base URL from LocalSettings
    - Reset all stores

  // Health check
  validateConnectivity(): Promise<boolean>;
    - Calls IFireflyIIIClient.validateConnectivity()
    - Returns: true if configured & API responds
}
```

**Interactions**:

- Coordinates: IFireflyIIIClient, ISecureStorage, ILocalSettings, AuthStore
- Enforces: SB-02 (token in secure storage only), SB-03 (URL validation), NFR-07 (fail-closed)

---

## 2. Transaction Service

**Responsibility**: Implement transaction CRUD logic with validation and store coordination.

**Interface**:

```typescript
interface ITransactionService {
  // Query operations
  getTransactions(filters: TransactionFilters): Promise<Transaction[]>;
    - Input: Optional date range, account, category filters
    - Calls: TransactionStore.loadTransactions()
    - Returns: Filtered Transaction array
    - Error: APIError, AuthError

  getTransaction(id: string): Promise<Transaction>;
    - Fetch single transaction
    - Calls: IFireflyIIIClient.getTransaction()
    - Returns: Transaction object
    - Error: APIError (404), AuthError

  // Mutation operations
  createTransaction(input: CreateTransactionInput): Promise<Transaction>;
    - Validate input (domain validators)
    - Call API (IFireflyIIIClient.createTransaction())
    - Update store (TransactionStore.createTransaction())
    - Error: ValidationError, APIError, AuthError
    - Enforces: SB-03 (client-side validation before submission)

  updateTransaction(id: string, input: Partial<CreateTransactionInput>): Promise<Transaction>;
    - Validate changed fields only
    - Call API
    - Update store
    - Error: ValidationError, APIError (404), AuthError

  deleteTransaction(id: string): Promise<void>;
    - Request confirmation in UI (platform-specific)
    - Call API
    - Update store (remove from list)
    - Error: APIError, AuthError

  // Derived queries
  getTransactionsByCategory(): Map<CategoryId, Transaction[]>;
    - Computed from store (no API call)
    - Used by ReportService
    - Returns: Grouped map for analysis

  getTransactionsByDateRange(start: Date, end: Date): Transaction[];
    - Filter store data by date
    - Used by ReportService
    - No API call (use store data)
}
```

**Interactions**:

- Coordinates: IFireflyIIIClient, TransactionStore, Transaction (validators/serializers)
- Enforces: SB-03 (input validation), US-03 (CRUD operations)

---

## 3. Account Service

**Responsibility**: Manage account data retrieval and account-based filtering.

**Interface**:

```typescript
interface IAccountService {
  // Query operations
  getAccounts(filter?: AccountType): Promise<Account[]>;
    - Optional type filter (asset, liability, etc.)
    - Calls: IFireflyIIIClient.getAccounts()
    - Updates: AccountStore
    - Returns: Account array
    - Error: APIError, AuthError

  getAccount(id: string): Promise<Account>;
    - Fetch single account
    - Calls: IFireflyIIIClient.getAccount()
    - Returns: Account with current balance
    - Error: APIError (404), AuthError

  // Filtering helpers
  getAssetAccounts(): Promise<Account[]>;
    - Filter: type === 'asset'
    - Returns: Asset accounts for transaction source/destination

  selectAccount(accountId: string): void;
    - Update UIStore.selectedAccount
    - Used by UI for context
}
```

**Interactions**:

- Coordinates: IFireflyIIIClient, AccountStore, Account (domain)
- Enforces: FR-10 (account management), US-04 (view accounts)

---

## 4. Category Service

**Responsibility**: Manage category data and category-based filtering.

**Interface**:

```typescript
interface ICategoryService {
  // Query operations
  getCategories(): Promise<Category[]>;
    - Calls: IFireflyIIIClient.getCategories()
    - Updates: CategoryStore
    - Returns: Category array
    - Error: APIError, AuthError

  getCategory(id: string): Promise<Category>;
    - Fetch single category
    - Calls: IFireflyIIIClient.getCategory()
    - Returns: Category object
    - Error: APIError (404), AuthError

  // Filtering & aggregation
  getSpendingByCategory(): Promise<Map<CategoryId, number>>;
    - Aggregates transactions by category
    - Calls: TransactionService.getTransactionsByCategory()
    - Returns: Map of category ID → total spent

  getCategoryTransactions(categoryId: string): Promise<Transaction[]>;
    - Get all transactions for specific category
    - Filter TransactionStore
    - Returns: Transaction array
}
```

**Interactions**:

- Coordinates: IFireflyIIIClient, CategoryStore, Category (domain), TransactionService
- Enforces: FR-11 (category management), US-05 (manage categories)

---

## 5. Report Service

**Responsibility**: Generate financial reports by aggregating and analyzing data.

**Interface**:

```typescript
interface IReportService {
  // Report generation
  getSpendingOverview(period: Period): Promise<SpendingOverview>;
    - Input: 'current_month', 'last_month', 'last_3_months', or custom date range
    - Calls: IFireflyIIIClient.getReport()
    - Returns: SpendingOverview (spending by category, total, comparisons)
    - Error: ValidationError (invalid period), APIError, AuthError
    - Enforces: FR-12 (financial reporting)

  getIncomeVsExpenses(period: Period): Promise<IncomeVsExpensesReport>;
    - Compare income vs expenses for period
    - Calls: IFireflyIIIClient.getReport()
    - Returns: Summary with net cashflow
    - Error: APIError, AuthError

  getSpendingByCategory(period: Period): Promise<CategorySpending[]>;
    - Breakdown of spending by category
    - Calls: IFireflyIIIClient.getReport()
    - Returns: Array of categories with amounts & percentages
    - Error: APIError, AuthError

  getTrendAnalysis(months: number): Promise<TrendData>;
    - Analyze spending trends over N months
    - Calls: IFireflyIIIClient.getReport() multiple times
    - Returns: Trend data (increasing/decreasing, volatility, etc.)
    - Error: APIError, AuthError

  // Period utilities
  validatePeriod(period: Period | CustomDateRange): ValidationResult;
    - Ensure valid period specification
    - Returns: { isValid, error? }
}
```

**Interactions**:

- Coordinates: IFireflyIIIClient, TransactionService, CategoryService, ReportStore
- Enforces: FR-12 (reporting), US-06 (financial reports)

---

## 6. Validation Service

**Responsibility**: Centralize domain validation logic for reuse across services.

**Interface**:

```typescript
interface IValidationService {
  // URL validation
  validateServerURL(url: string): ValidationResult;
    - Ensure HTTPS
    - Parse & validate URL format
    - Returns: { isValid, error? }
    - Enforces: SB-03, NFR-01 (TLS requirement)

  // Token validation
  validateToken(token: string): ValidationResult;
    - Ensure non-empty, reasonable length
    - Returns: { isValid, error? }
    - Enforces: SB-03

  // Transaction validation
  validateTransactionInput(input: unknown): ValidationResult;
    - Comprehensive transaction validation
    - Uses: Transaction.validateTransactionInput()
    - Returns: { isValid, errors: Map<field, error> }
    - Enforces: AC3-03 (input validation)

  // Account validation
  validateAccountSelection(accountId: string): ValidationResult;
    - Verify account exists and is valid for operation
    - Checks: AccountStore has account with ID
    - Returns: { isValid, error? }

  // Period validation
  validateDateRange(startDate: Date, endDate: Date): ValidationResult;
    - Ensure start < end
    - Ensure not too far in past (configurable)
    - Returns: { isValid, error? }
    - Enforces: US-02 (search & filter)
}
```

**Interactions**:

- Called by: All service layers, component models
- Enforces: SB-03 (client-side validation)

---

## 7. Error Handling Service

**Responsibility**: Centralize error categorization and user messaging.

**Interface**:

```typescript
interface IErrorHandlingService {
  // Error categorization
  categorizeError(error: unknown): ErrorCategory;
    - Map error to: network | auth | validation | api | storage
    - Returns: Category and safe message
    - Enforces: SB-04 (no secrets in messages)

  // User-friendly messages
  getUserMessage(category: ErrorCategory, context?: any): string;
    - Input: Error category, optional context
    - Returns: User-friendly message
    - Examples:
      - network: "Unable to connect. Check your internet."
      - auth: "Your token is invalid. Please reconfigure."
      - validation: "Please check your input and try again."
    - Enforces: FR-14 (user feedback), US-08 (clear feedback)

  // Logging (with secrets redacted)
  logError(error: unknown, context?: string): void;
    - Log error with context
    - Redact: tokens, paths, sensitive values
    - Calls: Platform-appropriate logger (console.log, native logging, syslog)
    - Enforces: SB-04 (no secrets in logs), NFR-05 (structured logging)

  // Retry logic
  shouldRetry(error: ErrorCategory, attemptCount: number): boolean;
    - Determine if operation can be retried
    - Input: Error category, attempt count (max 3)
    - Returns: true if retryable and under limit
    - Enforces: Network resilience without infinite loops

  getRetryDelay(attemptCount: number): number;
    - Calculate exponential backoff delay (milliseconds)
    - Formula: 1000 * (2 ^ attemptCount)
    - Example: Attempt 1 → 2s, Attempt 2 → 4s, Attempt 3 → 8s
    - Returns: Milliseconds to wait
}
```

**Interactions**:

- Used by: All services and API client
- Enforces: SB-04 (error redaction), US-08 (user-friendly messages)

---

## 8. CLI Service (CLI Adapter Only)

**Responsibility**: Orchestrate CLI-specific operations and command routing.

**Interface**:

```typescript
interface ICLIService {
  // Command routing
  executeCommand(command: string, args: string[], options: Record<string, any>): Promise<void>;
    - Route command to appropriate service
    - Examples: 'transactions list', 'transactions create', 'configure'
    - Returns: Promise (resolves on success)
    - Error: ValidationError (invalid command), APIError, etc.
    - Enforces: US-07 (interactive & scriptable modes)

  // Output formatting
  formatOutput(data: any, format: 'table' | 'json' | 'csv'): string;
    - Input: Data object, desired format
    - Returns: Formatted string for display
    - Supports: --format flag (AC2-02)

  // Exit codes
  getExitCode(error?: Error): number;
    - Map error to exit code
    - 0 = success
    - 1 = user error (validation)
    - 2 = API/network error
    - Enforces: AC7-03 (deterministic exit codes)

  // Interactive prompts
  promptForValue(label: string, options?: string[]): Promise<string>;
    - Prompt user in interactive mode
    - Supports: Yes/No, multiple choice, free text
    - Returns: User input
    - Enforces: US-07 (interactive mode), AC1-02
}
```

**Interactions**:

- Coordinates: Commander.js, all other services
- Enforces: US-07 (CLI modes), AC7-03 (exit codes)

---

## Service Orchestration Flow

### Authentication Flow

1. User provides base URL + token
2. AuthenticationService.configureServer()
    - Validates input (ValidationService)
    - Tests connectivity (IFireflyIIIClient)
    - Stores securely (ISecureStorage, ILocalSettings)
    - Updates AuthStore
3. AuthStore state changes → UI automatically updates (MobX reactivity)

### Transaction Creation Flow

1. User submits form
2. TransactionService.createTransaction()
    - Validates input (ValidationService, Transaction validators)
    - Calls IFireflyIIIClient.createTransaction()
    - On success: Updates TransactionStore
    - On error: ErrorHandlingService categorizes → user message
3. TransactionStore updates → UI re-renders with new transaction

### Report Generation Flow

1. User selects date range
2. ReportService.getSpendingOverview()
    - Validates date range (ValidationService)
    - Calls IFireflyIIIClient.getReport()
    - Aggregates category data (CategoryService)
    - Updates ReportStore
3. ReportStore state changes → UI displays report (charts/tables)

---

## Security Boundaries

- **Authentication Service**: Token & secure storage (isolated from UI)
- **Error Handling Service**: Secrets redaction (unified, non-bypassable)
- **Validation Service**: Input sanitization before API submission (SB-03)
- **All Services**: Fail-closed on missing/invalid configuration (NFR-07)

---

## Testing Strategy

### Example-Based Tests

- Service integration tests (Happy path, error cases)
- Mock IFireflyIIIClient, stores, storage

### Property-Based Tests

- Domain validators (ValidationService methods)
- Transaction/Account model constructors
- Error categorization consistency
- Date range validation logic

---

## Summary Table

| Service        | Key Methods                               | Responsibility              | Security                         |
| -------------- | ----------------------------------------- | --------------------------- | -------------------------------- |
| Authentication | configureServer, getValidToken, logout    | User auth & token lifecycle | Secure storage, validation       |
| Transaction    | create, update, delete, get               | CRUD operations             | Input validation, error handling |
| Account        | getAccounts, getAssetAccounts             | Account management          | Category filtering               |
| Category       | getCategories, getSpendingByCategory      | Category aggregation        | Spending analysis                |
| Report         | getSpendingOverview, getTrendAnalysis     | Report generation           | Data aggregation                 |
| Validation     | validate\*                                | Centralized validation      | SB-03 enforcement                |
| ErrorHandling  | categorizeError, getUserMessage, logError | Error categorization        | SB-04 enforcement                |
| CLI (adapter)  | executeCommand, formatOutput, getExitCode | CLI orchestration           | Exit codes, output formatting    |
