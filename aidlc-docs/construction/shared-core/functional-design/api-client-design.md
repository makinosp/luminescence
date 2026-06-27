# Shared Core - API Client Interface Design

## 1. IFireflyIIIClient Interface

### 1.1 Configuration Methods

```typescript
/**
 * Set the Firefly III server base URL.
 * Must be a valid HTTPS URL.
 * Throws ValidationError if URL is malformed.
 */
setBaseURL(url: string): void;

/**
 * Set the personal access token for authentication.
 * Token is stored in memory; persisted via SecureStorage.
 * Throws ValidationError if token is empty.
 */
setToken(token: string): void;
```

### 1.2 Transaction Operations

```typescript
/**
 * List transactions with pagination and optional filters.
 * Clarification Q4: A — Cursor-based pagination.
 *
 * @param params - Optional filters (page, limit, date range, accountId, categoryId)
 * @returns Paginated transaction list with hasMore flag
 * @throws APIError, NetworkError, AuthError
 */
getTransactions(params?: {
  page?: number;
  limit?: number;
  startDate?: Date;
  endDate?: Date;
  accountId?: string;
  categoryId?: string;
}): Promise<{
  data: Transaction[];
  hasMore: boolean;
  nextPage?: number;
}>;

/**
 * Get a single transaction by ID.
 *
 * @param id - Firefly III transaction ID
 * @returns Transaction object
 * @throws APIError (404 if not found), AuthError
 */
getTransaction(id: string): Promise<Transaction>;

/**
 * Create a new transaction.
 * Input is validated client-side before submission (SB-03).
 *
 * @param data - Validated transaction input
 * @returns Created Transaction with Firefly III ID
 * @throws ValidationError, APIError, AuthError
 */
createTransaction(data: CreateTransactionInput): Promise<Transaction>;

/**
 * Update an existing transaction.
 * Only changed fields are sent (partial update).
 *
 * @param id - Transaction ID to update
 * @param data - Partial transaction data
 * @returns Updated Transaction
 * @throws ValidationError, APIError (404 if not found), AuthError
 */
updateTransaction(id: string, data: Partial<CreateTransactionInput>): Promise<Transaction>;

/**
 * Delete a transaction.
 *
 * @param id - Transaction ID to delete
 * @throws APIError (404 if not found), AuthError
 */
deleteTransaction(id: string): Promise<void>;
```

### 1.3 Account Operations

```typescript
/**
 * List accounts with optional type filter.
 *
 * @param params - Optional type filter
 * @returns Array of Account objects
 * @throws APIError, NetworkError, AuthError
 */
getAccounts(params?: {
  type?: 'asset' | 'liability' | 'revenue' | 'expense';
}): Promise<Account[]>;

/**
 * Get a single account by ID.
 *
 * @param id - Account ID
 * @returns Account with current balance
 * @throws APIError (404 if not found), AuthError
 */
getAccount(id: string): Promise<Account>;
```

### 1.4 Category Operations

```typescript
/**
 * List all categories.
 *
 * @returns Array of Category objects
 * @throws APIError, NetworkError, AuthError
 */
getCategories(): Promise<Category[]>;

/**
 * Get a single category by ID.
 *
 * @param id - Category ID
 * @returns Category object
 * @throws APIError (404 if not found), AuthError
 */
getCategory(id: string): Promise<Category>;
```

### 1.5 Report Operations

```typescript
/**
 * Generate a financial report for a date range.
 * Clarification Q7: C — Uses Firefly III report API for standard reports.
 *
 * @param type - Report type identifier
 * @param params - Report parameters including date range
 * @returns Report data with aggregated metrics
 * @throws ValidationError, APIError, AuthError
 */
getReport(type: string, params: {
  startDate: Date;
  endDate: Date;
  accountIds?: string[];
}): Promise<ReportData>;
```

### 1.6 Health & Validation

```typescript
/**
 * Verify API connectivity and token validity.
 * Called during initial configuration and periodic health checks.
 *
 * @returns true if API responds and token is valid
 * @throws NetworkError, AuthError
 */
validateConnectivity(): Promise<boolean>;
```

---

## 2. Request/Response Data Structures

### 2.1 CreateTransactionInput

```typescript
/**
 * Input data for creating a transaction.
 * Matches Firefly III API request format.
 */
export interface CreateTransactionInput {
  type: TransactionType;
  amount: number;
  description: string;
  date: Date;
  fromAccountId: string;
  toAccountId?: string;
  categoryId?: string;
  budgetId?: string;
  tags?: string[];
}
```

### 2.2 Firefly III API Response Types

```typescript
/**
 * Firefly III transaction API response structure.
 * Used for deserialization with lenient validation (Clarification Q10: B).
 */
export interface FireflyIIITransactionResponse {
  data: {
    id: string;
    type: string;
    attributes: {
      type: string;
      amount: string;        // Firefly III returns amount as string
      description: string;
      date: string;          // ISO 8601 date string
      source_id: string;
      destination_id?: string;
      category_id?: string;
      budget_id?: string;
      tags?: string[];
      created_at: string;
      updated_at: string;
    };
  };
}

/**
 * Firefly III account API response structure.
 */
export interface FireflyIIIAccountResponse {
  data: {
    id: string;
    type: string;
    attributes: {
      name: string;
      type: string;
      currency_code: string;
      current_balance: string;
      active: boolean;
      created_at: string;
      updated_at: string;
    };
  };
}

/**
 * Firefly III category API response structure.
 */
export interface FireflyIIICategoryResponse {
  data: {
    id: string;
    type: string;
    attributes: {
      name: string;
      description?: string;
      created_at: string;
      updated_at: string;
    };
  };
}

/**
 * Firefly III paginated response wrapper.
 */
export interface FireflyIIIPaginatedResponse<T> {
  data: T[];
  meta: {
    pagination: {
      total: number;
      count: number;
      per_page: number;
      current_page: number;
      total_pages: number;
    };
  };
}
```

---

## 3. Error Handling and Categorization

### 3.1 Error Type Hierarchy

```typescript
/**
 * Base error class for all Luminescence errors.
 */
export abstract class LuminescenceError extends Error {
  abstract readonly isRetryable: boolean;
  abstract readonly userMessage: string; // Safe for display (SB-04)

  constructor(
    message: string,
    public readonly context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

/**
 * API error from Firefly III server.
 * Contains HTTP status code and server response.
 */
export class APIError extends LuminescenceError {
  readonly isRetryable: boolean;

  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly serverResponse?: unknown,
  ) {
    super(message);
    // 5xx errors are retryable; 4xx are not
    this.isRetryable = statusCode >= 500 && statusCode < 600;
  }

  readonly userMessage: string =
    this.statusCode >= 500
      ? 'The server encountered an error. Please try again later.'
      : 'The request could not be completed. Please check your input.';
}

/**
 * Network error (connection failure, timeout).
 * Always retryable.
 */
export class NetworkError extends LuminescenceError {
  readonly isRetryable = true;
  readonly userMessage = 'Unable to connect. Please check your internet connection.';

  constructor(message: string, public readonly cause?: Error) {
    super(message);
  }
}

/**
 * Validation error (client-side input validation failure).
 * Never retryable — user must correct input.
 */
export class ValidationError extends LuminescenceError {
  readonly isRetryable = false;
  readonly userMessage = 'Please check your input and try again.';

  constructor(
    message: string,
    public readonly fieldErrors: Map<string, string>,
  ) {
    super(message);
  }
}

/**
 * Storage error (secure or local storage failure).
 * Never retryable — indicates platform issue.
 */
export class StorageError extends LuminescenceError {
  readonly isRetryable = false;

  readonly userMessage: string; // Clarification Q9: B — User-friendly prompt

  constructor(
    message: string,
    public readonly operation: 'read' | 'write' | 'delete',
  ) {
    super(message);
    this.userMessage =
      'Unable to access secure storage. Please check your device security settings and try again.';
  }
}

/**
 * Authentication error (invalid or expired token).
 * Never retryable — user must reconfigure.
 */
export class AuthError extends LuminescenceError {
  readonly isRetryable = false;
  readonly userMessage = 'Your session has expired. Please reconfigure your server settings.';

  constructor(message: string, public readonly cause?: Error) {
    super(message);
  }
}
```

### 3.2 Error Categorization Logic

```typescript
/**
 * Categorize an unknown error into a Luminescence error type.
 * Used by the API client to wrap fetch/axios errors.
 */
export function categorizeError(error: unknown): LuminescenceError {
  if (error instanceof LuminescenceError) {
    return error;
  }

  // Network errors (fetch throws TypeError for network failures)
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return new NetworkError('Network request failed', error);
  }

  // HTTP errors (from response status)
  if (error instanceof APIError) {
    return error;
  }

  // Unknown error — wrap as generic API error
  const message = error instanceof Error ? error.message : 'An unexpected error occurred';
  return new APIError(message, 500);
}
```

---

## 4. Retry Middleware Behavior (Clarification Q5: A)

### 4.1 Retry Policy

```typescript
/**
 * Retry configuration for the API client.
 */
export interface RetryConfig {
  readonly maxAttempts: number;       // Default: 3
  readonly baseDelayMs: number;       // Default: 1000
  readonly maxDelayMs: number;        // Default: 8000
  readonly retryableStatusCodes: readonly number[]; // Default: [500, 502, 503, 504]
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 8000,
  retryableStatusCodes: [500, 502, 503, 504],
};
```

### 4.2 Retry Rules (Clarification Q5: A)

- **Only idempotent GET operations are retried automatically.**
- POST, PUT, DELETE operations are **never** retried automatically.
- Retry applies to: 5xx status codes and `NetworkError`.
- Exponential backoff: `delay = min(baseDelay * 2^attempt, maxDelay)`.
- The retry middleware is **optional** — clients choose to apply it.

### 4.3 Retry Decision Logic

```typescript
/**
 * Determine if a failed request should be retried.
 * Only GET requests with retryable errors are retried.
 */
export function shouldRetry(
  method: string,
  error: LuminescenceError,
  attemptCount: number,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
): boolean {
  // Only retry GET requests
  if (method !== 'GET') return false;

  // Check attempt limit
  if (attemptCount >= config.maxAttempts) return false;

  // Check if error is retryable
  if (!error.isRetryable) return false;

  return true;
}

/**
 * Calculate exponential backoff delay.
 */
export function getRetryDelay(attemptCount: number, config: RetryConfig = DEFAULT_RETRY_CONFIG): number {
  const delay = config.baseDelayMs * Math.pow(2, attemptCount);
  return Math.min(delay, config.maxDelayMs);
}
```

---

## 5. API Endpoint Mappings

### 5.1 Firefly III REST API v1

| Method | Endpoint | Client Method | Description |
|--------|----------|--------------|-------------|
| GET | `/api/v1/transactions` | `getTransactions()` | List transactions (paginated) |
| GET | `/api/v1/transactions/{id}` | `getTransaction()` | Get single transaction |
| POST | `/api/v1/transactions` | `createTransaction()` | Create transaction |
| PUT | `/api/v1/transactions/{id}` | `updateTransaction()` | Update transaction |
| DELETE | `/api/v1/transactions/{id}` | `deleteTransaction()` | Delete transaction |
| GET | `/api/v1/accounts` | `getAccounts()` | List accounts |
| GET | `/api/v1/accounts/{id}` | `getAccount()` | Get single account |
| GET | `/api/v1/categories` | `getCategories()` | List categories |
| GET | `/api/v1/categories/{id}` | `getCategory()` | Get single category |
| GET | `/api/v1/reports` | `getReport()` | Generate report |
| GET | `/api/v1/about` | `validateConnectivity()` | Check API health |

### 5.2 Request Headers

All authenticated requests include:
```
Authorization: Bearer <token>
Accept: application/json
Content-Type: application/json
```

### 5.3 TLS Enforcement (NFR-01)

- All requests must use HTTPS.
- The `setBaseURL()` method validates the URL scheme.
- Non-HTTPS URLs throw `ValidationError`.

---

## 6. Security Constraints (SB-04, NFR-03)

### 6.1 Secret Redaction

All error messages and logs must redact:
- Token values
- Server base URLs (in error logs)
- Internal file paths
- Stack traces (in user-facing output)

### 6.2 Logging

```typescript
/**
 * Log an API request with secrets redacted.
 */
export function logRequest(method: string, endpoint: string): void {
  console.log(`[API] ${method} ${endpoint}`);
  // Never log headers (contain token) or request body (may contain sensitive data)
}

/**
 * Log an API response with secrets redacted.
 */
export function logResponse(status: number, endpoint: string): void {
  console.log(`[API] ${endpoint} → ${status}`);
  // Never log response body (may contain financial data in error messages)
}
```
