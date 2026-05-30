# Component Methods

## Shared Core API Client Module

### IFireflyIIIClient Interface

```typescript
// Configuration & Initialization
setBaseURL(url: string): void
  Purpose: Set Firefly III server base URL
  Input: url (validated HTTPS URL)
  Error: ValidationError if URL malformed
  
setToken(token: string): void
  Purpose: Set Firefly III personal access token
  Input: token (opaque string, stored in SecureStorage)
  Error: ValidationError if token empty

// Transaction Operations
getTransactions(params: {
  page?: number;
  limit?: number;
  startDate?: Date;
  endDate?: Date;
  accountId?: string;
  categoryId?: string;
}): Promise<{ data: Transaction[]; hasMore: boolean }>
  Purpose: Retrieve paginated transaction list with optional filters
  Returns: Transactions + pagination info
  Error: APIError, NetworkError, AuthError
  
getTransaction(id: string): Promise<Transaction>
  Purpose: Get single transaction by ID
  Input: Transaction ID from Firefly III
  Returns: Transaction object
  Error: APIError (404 if not found), AuthError

createTransaction(data: {
  type: 'deposit' | 'withdrawal' | 'transfer';
  amount: number;
  description: string;
  date: Date;
  fromAccountId?: string;
  toAccountId?: string;
  categoryId?: string;
  budgetId?: string;
  tags?: string[];
}): Promise<Transaction>
  Purpose: Create new transaction
  Input: Validated transaction data
  Returns: Created Transaction object with Firefly III ID
  Error: ValidationError, APIError, AuthError
  
updateTransaction(id: string, data: Partial<CreateTransactionInput>): Promise<Transaction>
  Purpose: Update existing transaction
  Input: ID + partial data (only changed fields)
  Returns: Updated Transaction object
  Error: ValidationError, APIError (404 if not found), AuthError

deleteTransaction(id: string): Promise<void>
  Purpose: Delete transaction
  Input: Transaction ID
  Returns: void
  Error: APIError (404 if not found), AuthError

// Account Operations
getAccounts(params?: {
  type?: 'asset' | 'liability' | 'revenue' | 'expense';
}): Promise<Account[]>
  Purpose: Retrieve account list with optional type filter
  Returns: Array of Account objects
  Error: APIError, NetworkError, AuthError

getAccount(id: string): Promise<Account>
  Purpose: Get single account with details
  Input: Account ID
  Returns: Account object (includes balance)
  Error: APIError (404 if not found), AuthError

// Category Operations
getCategories(): Promise<Category[]>
  Purpose: Retrieve all categories
  Returns: Array of Category objects
  Error: APIError, NetworkError, AuthError

getCategory(id: string): Promise<Category>
  Purpose: Get single category
  Input: Category ID
  Returns: Category object
  Error: APIError (404 if not found), AuthError

// Report Operations
getReport(type: ReportType, params: {
  startDate: Date;
  endDate: Date;
  accountIds?: string[];
}): Promise<ReportData>
  Purpose: Generate financial report for date range
  Input: Report type (expense_breakdown, income_vs_expense, etc.) + date range
  Returns: ReportData object (aggregated metrics)
  Error: ValidationError, APIError, AuthError

// Health & Validation
validateConnectivity(): Promise<boolean>
  Purpose: Verify API connectivity and token validity
  Returns: true if successful, false otherwise
  Error: NetworkError, AuthError (token invalid)
  Side Effect: Logs non-sensitive info (URL, timestamp)
```

---

## Domain Models Module

### Transaction Model Methods

```typescript
class Transaction {
  // Immutable properties
  readonly id: string;
  readonly type: TransactionType;  // 'deposit' | 'withdrawal' | 'transfer'
  readonly amount: number;         // Positive decimal
  readonly description: string;
  readonly date: Date;
  readonly fromAccount: Account;
  readonly toAccount?: Account;
  readonly category?: Category;
  readonly budget?: Budget;
  readonly tags: string[];

  // Validators (static, pure functions)
  static validateAmount(amount: number): ValidationResult
    Purpose: Validate transaction amount
    Rules: amount > 0, precision <= 2 decimals
    Returns: { isValid: boolean; error?: string }
    
  static validateDescription(description: string): ValidationResult
    Purpose: Validate transaction description
    Rules: length > 0 and <= 1000 chars
    Returns: { isValid: boolean; error?: string }
    
  static validateDate(date: Date, type: TransactionType): ValidationResult
    Purpose: Validate transaction date
    Rules: Date <= today (no future withdrawals), valid Date object
    Returns: { isValid: boolean; error?: string }
    
  static validateTransactionInput(input: CreateTransactionInput): ValidationResult
    Purpose: Comprehensive validation
    Rules: All fields validated, account/category/budget IDs exist
    Returns: { isValid: boolean; errors: Map<field, error> }

  // Serializers (pure functions)
  static fromFireflyIIIResponse(raw: unknown): Transaction
    Purpose: Parse Firefly III API response into Domain model
    Input: Raw API response object
    Returns: Transaction instance
    Error: ValidationError if schema mismatches
    
  toFireflyIIIFormat(): CreateTransactionInput
    Purpose: Convert Domain model to Firefly III request format
    Returns: Request payload
    
  toJSON(): object
    Purpose: Serialize to JSON for storage
    Returns: Plain object representation

  // Business Logic
  isWithdrawal(): boolean
    Purpose: Convenience check
    Returns: type === 'withdrawal'
    
  netAmount(): number
    Purpose: Net amount considering transaction type
    Returns: Positive for deposits, negative for withdrawals
}
```

### Account Model Methods

```typescript
class Account {
  readonly id: string;
  readonly name: string;
  readonly type: AccountType;      // 'asset' | 'liability' | 'revenue' | 'expense'
  readonly currency: string;       // ISO 4217 code
  readonly balance: number;        // Current balance

  static validateAccountInput(input: CreateAccountInput): ValidationResult
    Purpose: Validate account creation input
    Rules: Name required, type valid, balance numeric
    Returns: { isValid: boolean; errors: Map<field, error> }
    
  static fromFireflyIIIResponse(raw: unknown): Account
    Purpose: Parse Firefly III response
    Input: Raw API response
    Returns: Account instance
    Error: ValidationError
    
  isAsset(): boolean
    Purpose: Check if asset account (has balance tracking)
    Returns: type === 'asset'
    
  isLiability(): boolean
    Purpose: Check if liability account
    Returns: type === 'liability'
```

### Category Model Methods

```typescript
class Category {
  readonly id: string;
  readonly name: string;

  static validateCategoryInput(input: CreateCategoryInput): ValidationResult
    Purpose: Validate category creation input
    Rules: Name required, unique
    Returns: { isValid: boolean; errors: Map<field, error> }
    
  static fromFireflyIIIResponse(raw: unknown): Category
    Purpose: Parse Firefly III response
    Input: Raw API response
    Returns: Category instance
    Error: ValidationError
}
```

---

## MobX Stores Module

### AuthStore Methods

```typescript
class AuthStore {
  // State (observable)
  @observable baseURL: string | null;
  @observable isConfigured: boolean;
  @observable isValidating: boolean;
  @observable error: AuthError | null;

  // Configuration (actions)
  @action configureServer(baseURL: string, token: string): Promise<void>
    Purpose: Configure Firefly III server URL and token
    Input: Base URL (HTTPS), personal access token
    Returns: Promise (resolves on successful validation)
    Error: ValidationError (invalid URL), APIError, AuthError
    Side Effect: Stores token in SecureStorage, URL in LocalSettings
    
  @action validateToken(): Promise<boolean>
    Purpose: Check if configured token is still valid
    Returns: true if valid, false if expired/invalid
    Side Effect: Updates isTokenValid state

  @action logout(): Promise<void>
    Purpose: Clear configuration and token
    Returns: Promise
    Side Effect: Removes from SecureStorage, clears baseURL
    
  // Selectors (computed)
  @computed isConfiguredAndValid(): boolean
    Purpose: Check if ready for authenticated operations
    Returns: isConfigured && isTokenValid
    Reactivity: Auto-updates when state changes
}
```

### TransactionStore Methods

```typescript
class TransactionStore {
  // State (observable)
  @observable transactions: Transaction[];
  @observable isLoading: boolean;
  @observable error: APIError | null;
  @observable pageInfo: { current: number; hasMore: boolean };

  // Actions
  @action loadTransactions(filters: TransactionFilters): Promise<void>
    Purpose: Fetch transactions with optional filters
    Input: Date range, account ID, category ID, etc.
    Returns: Promise
    Side Effect: Sets transactions[], updates isLoading, error
    
  @action createTransaction(input: CreateTransactionInput): Promise<Transaction>
    Purpose: Create new transaction
    Input: Validated transaction data
    Returns: Promise<created Transaction>
    Side Effect: Adds to transactions[], updates store state
    
  @action updateTransaction(id: string, input: Partial<CreateTransactionInput>): Promise<Transaction>
    Purpose: Update existing transaction
    Input: ID + changed fields
    Returns: Promise<updated Transaction>
    Side Effect: Updates matching transaction in array
    
  @action deleteTransaction(id: string): Promise<void>
    Purpose: Delete transaction
    Input: Transaction ID
    Returns: Promise
    Side Effect: Removes from transactions[] array
    
  @action paginate(direction: 'next' | 'prev'): Promise<void>
    Purpose: Load next/previous page
    Returns: Promise
    Side Effect: Updates transactions[] and pageInfo
    
  // Selectors (computed)
  @computed hasTransactions(): boolean
    Purpose: Quick check for empty state
    Returns: transactions.length > 0
    
  @computed transactionsByCategory(): Map<string, Transaction[]>
    Purpose: Group transactions by category
    Returns: Map for report generation
    Reactivity: Auto-updates when transactions change
}
```

### UIStore Methods

```typescript
class UIStore {
  // State (observable)
  @observable isCreateModalOpen: boolean;
  @observable isFilterPanelOpen: boolean;
  @observable activeTab: 'transactions' | 'accounts' | 'reports' | 'settings';
  @observable formData: Partial<CreateTransactionInput>;

  // Actions (UI state only, no persistence)
  @action openCreateModal(): void
    Purpose: Show transaction creation modal
    Side Effect: Sets isCreateModalOpen = true
    
  @action closeCreateModal(): void
    Purpose: Close modal and clear form
    Side Effect: Sets isCreateModalOpen = false, clears formData
    
  @action updateFormData(field: string, value: any): void
    Purpose: Update form input state
    Input: Field name, value
    Side Effect: Merges into formData
    
  @action switchTab(tab: string): void
    Purpose: Change active tab
    Input: Tab identifier
    Side Effect: Sets activeTab
    
  // Selectors (computed)
  @computed canSubmitForm(): boolean
    Purpose: Check if form has valid required fields
    Returns: Validation result based on formData
    Reactivity: Auto-updates when formData changes
}
```

---

## Storage Module Interfaces

### ISecureStorage Interface

```typescript
interface ISecureStorage {
  setToken(key: string, value: string): Promise<void>
    Purpose: Securely store token/secret
    Input: Key name, secret value
    Returns: Promise (resolves on success)
    Error: StorageError if unavailable
    
  getToken(key: string): Promise<string | null>
    Purpose: Retrieve stored token/secret
    Input: Key name
    Returns: Promise<secret value or null if not found>
    Error: StorageError
    
  removeToken(key: string): Promise<void>
    Purpose: Delete stored token
    Input: Key name
    Returns: Promise
    Error: StorageError
    
  clear(): Promise<void>
    Purpose: Clear all stored secrets
    Returns: Promise
    Error: StorageError
}
```

### ILocalSettings Interface

```typescript
interface ILocalSettings {
  get(key: string): Promise<string | null>
    Purpose: Retrieve non-sensitive setting
    Input: Key name
    Returns: Promise<value or null>
    
  set(key: string, value: string): Promise<void>
    Purpose: Store non-sensitive setting
    Input: Key, value
    Returns: Promise
    
  remove(key: string): Promise<void>
    Purpose: Delete setting
    Input: Key name
    Returns: Promise
    
  clear(): Promise<void>
    Purpose: Clear all settings
    Returns: Promise
}
```

---

## Error Handling Module

### Error Types & Methods

```typescript
class APIError extends Error {
  statusCode: number;
  message: string;
  
  getUserMessage(): string
    Purpose: Get safe error message for UI
    Returns: User-friendly message (no secrets, internals)
    
  isRetryable(): boolean
    Purpose: Check if operation can be retried
    Returns: true for 5xx, timeouts; false for 4xx
}

class ValidationError extends Error {
  field: string;
  value: any;
  
  getUserMessage(): string
    Purpose: Get field-specific error message
    Returns: "Invalid [field]: [reason]"
}

class AuthError extends Error {
  reason: 'invalid_token' | 'expired_token' | 'missing_config'
  
  getUserMessage(): string
    Purpose: Get auth-specific message
    Returns: Safe message guiding user to reconfigure
}

// Categorization Function
categorizeError(error: unknown): ErrorCategory
  Purpose: Map any error to category
  Input: Unknown error object
  Returns: 'network' | 'auth' | 'validation' | 'api' | 'storage'
  Side Effect: Logs error with secrets redacted
```

---

## Summary Table

| Component         | Methods Count                | Responsibility      | Security                                    |
| ----------------- | ---------------------------- | ------------------- | ------------------------------------------- |
| APIClient         | 10+                          | HTTP communication  | Retry, error categorization, token handling |
| Transaction       | 4+ validators, 3 serializers | Domain logic        | Pure functions for PBT                      |
| Account, Category | 3+ validators, 2 serializers | Domain models       | Validation, immutability                    |
| AuthStore         | 4                            | Auth state          | Token isolation, secure storage             |
| TransactionStore  | 5+                           | Transaction state   | Observable mutations                        |
| UIStore           | 5+                           | Local UI state      | Non-persistent, no I/O                      |
| StorageInterfaces | 4 each                       | Storage abstraction | Port abstraction, platform adaptation       |
