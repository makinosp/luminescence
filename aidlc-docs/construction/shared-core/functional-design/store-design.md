# Shared Core - MobX Store Design

## 1. Store Architecture Overview

### 1.1 Store Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                    MobX Store Architecture                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   AuthStore                          │   │
│  │  - isConfigured, baseURL, isTokenValid              │   │
│  │  - configureServer(), logout(), validateToken()     │   │
│  │  - Depends on: ISecureStorage, ILocalSettings       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │               TransactionStore                       │   │
│  │  - transactions[], isLoading, error                  │   │
│  │  - loadTransactions(), create/update/delete()       │   │
│  │  - Depends on: IFireflyIIIClient, Transaction domain │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                AccountStore                          │   │
│  │  - accounts[], isLoading, error                     │   │
│  │  - loadAccounts(), selectAccount()                  │   │
│  │  - Depends on: IFireflyIIIClient, Account domain    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │               CategoryStore                         │   │
│  │  - categories[], isLoading, error                   │   │
│  │  - loadCategories()                                 │   │
│  │  - Depends on: IFireflyIIIClient, Category domain   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                ReportStore                           │   │
│  │  - reports[], selectedPeriod, isLoading              │   │
│  │  - loadReport(), selectPeriod()                     │   │
│  │  - Depends on: IFireflyIIIClient                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                  UIStore                             │   │
│  │  - isModalOpen, activeTab, formData                 │   │
│  │  - openModal(), closeModal(), switchTab()           │   │
│  │  - Depends on: None (local UI state only)           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Store Interaction Rules

- Stores communicate through **services**, not directly.
- The `AuthStore` is the gatekeeper — other stores check auth state before API calls.
- The `UIStore` is isolated — it never triggers API calls.
- Clarification Q6: C — Stores load data once and hold it until **manual refresh** (pull-to-refresh, refresh button).

---

## 2. AuthStore

### 2.1 State

```typescript
/**
 * Authentication state.
 * Observable properties trigger UI re-renders via MobX.
 */
export interface AuthState {
  readonly isConfigured: boolean;   // true when baseURL + token are set
  readonly baseURL: string | null;  // Server base URL (non-sensitive)
  readonly isTokenValid: boolean;   // true when token has been validated
  readonly isLoading: boolean;       // true during configuration/validation
  readonly error: AuthError | null;  // Last error, if any
}
```

### 2.2 Methods

```typescript
/**
 * Configure the server with base URL and token.
 * Validates input, tests connectivity, stores credentials.
 *
 * @throws ValidationError, APIError, AuthError, StorageError
 */
@action
async configureServer(baseURL: string, token: string): Promise<void>

/**
 * Validate the current token against the API.
 * Called on app startup and periodically.
 *
 * @throws AuthError if token is invalid
 */
@action
async validateToken(): Promise<void>

/**
 * Log out the user.
 * Clears credentials and resets all stores.
 */
@action
async logout(): Promise<void>

/**
 * Check if the user is configured and authenticated.
 */
@computed
get isAuthenticated(): boolean {
  return this.isConfigured && this.isTokenValid;
}
```

### 2.3 Data Freshness (Clarification Q6: C)

- Auth state is checked on app startup.
- Token validation is performed once at startup.
- No automatic re-validation — user must trigger reconfiguration.

---

## 3. TransactionStore

### 3.1 State

```typescript
/**
 * Transaction list state.
 */
export interface TransactionState {
  readonly transactions: readonly Transaction[];  // Immutable array
  readonly isLoading: boolean;
  readonly error: APIError | NetworkError | AuthError | null;
  readonly currentPage: number;
  readonly hasMore: boolean;
}
```

### 3.2 Methods

```typescript
/**
 * Load transactions from the API.
 * Replaces the current transaction list.
 * Clarification Q6: C — Manual refresh only.
 *
 * @param params - Optional filters (page, date range, accountId, categoryId)
 */
@action
async loadTransactions(params?: {
  page?: number;
  limit?: number;
  startDate?: Date;
  endDate?: Date;
  accountId?: string;
  categoryId?: string;
}): Promise<void>

/**
 * Load the next page of transactions.
 * Appends to the current list.
 */
@action
async loadNextPage(): Promise<void>

/**
 * Add a newly created transaction to the store.
 * Called by TransactionService after successful creation.
 */
@action
addTransaction(transaction: Transaction): void

/**
 * Update a transaction in the store.
 * Called by TransactionService after successful update.
 */
@action
updateTransaction(id: string, updates: Partial<Transaction>): void

/**
 * Remove a transaction from the store.
 * Called by TransactionService after successful deletion.
 */
@action
removeTransaction(id: string): void

/**
 * Clear all transactions (e.g., on logout).
 */
@action
clear(): void
```

### 3.3 Data Freshness (Clarification Q6: C)

- Transactions are loaded on demand (navigation to transaction list).
- No automatic background refresh.
- Pull-to-refresh (Mobile) or refresh button (Web) triggers `loadTransactions()`.
- Newly created transactions are added to the store immediately (optimistic update is NOT used per AC3-06).

---

## 4. AccountStore

### 4.1 State

```typescript
/**
 * Account list state.
 */
export interface AccountState {
  readonly accounts: readonly Account[];
  readonly isLoading: boolean;
  readonly error: APIError | NetworkError | AuthError | null;
  readonly selectedAccountId: string | null;
}
```

### 4.2 Methods

```typescript
/**
 * Load accounts from the API.
 * @param type - Optional account type filter
 */
@action
async loadAccounts(type?: AccountType): Promise<void>

/**
 * Select an account for context (e.g., filtering transactions).
 */
@action
selectAccount(accountId: string): void

/**
 * Clear selection and data.
 */
@action
clear(): void
```

---

## 5. CategoryStore

### 5.1 State

```typescript
/**
 * Category list state.
 */
export interface CategoryState {
  readonly categories: readonly Category[];
  readonly isLoading: boolean;
  readonly error: APIError | NetworkError | AuthError | null;
}
```

### 5.2 Methods

```typescript
/**
 * Load categories from the API.
 */
@action
async loadCategories(): Promise<void>

/**
 * Clear all categories (e.g., on logout).
 */
@action
clear(): void
```

---

## 6. ReportStore

### 6.1 State

```typescript
/**
 * Report data state.
 */
export interface ReportState {
  readonly spendingOverview: SpendingOverview | null;
  readonly incomeVsExpenses: IncomeVsExpensesReport | null;
  readonly trendAnalysis: TrendAnalysis | null;
  readonly selectedPeriod: ReportPeriod;
  readonly customDateRange: DateRange | null;
  readonly isLoading: boolean;
  readonly error: APIError | NetworkError | AuthError | null;
}
```

### 6.2 Methods

```typescript
/**
 * Load spending overview report.
 */
@action
async loadSpendingOverview(period: ReportPeriod, customRange?: DateRange): Promise<void>

/**
 * Load income vs expenses report.
 */
@action
async loadIncomeVsExpenses(period: ReportPeriod, customRange?: DateRange): Promise<void>

/**
 * Load trend analysis.
 */
@action
async loadTrendAnalysis(months: number): Promise<void>

/**
 * Select a report period.
 */
@action
selectPeriod(period: ReportPeriod): void

/**
 * Set custom date range for reports.
 */
@action
setCustomDateRange(range: DateRange): void

/**
 * Clear all report data (e.g., on logout).
 */
@action
clear(): void
```

---

## 7. UIStore

### 7.1 State

```typescript
/**
 * Local UI state (does not persist between sessions).
 */
export interface UIState {
  readonly isModalOpen: boolean;
  readonly activeTab: string;
  readonly formData: Record<string, unknown>;
  readonly toastMessage: string | null;
}
```

### 7.2 Methods

```typescript
/**
 * Open a modal dialog.
 */
@action
openModal(): void

/**
 * Close the modal dialog.
 */
@action
closeModal(): void

/**
 * Switch the active tab.
 */
@action
switchTab(tab: string): void

/**
 * Update form data.
 */
@action
updateFormData(data: Record<string, unknown>): void

/**
 * Show a toast message.
 */
@action
showToast(message: string): void

/**
 * Clear the toast message.
 */
@action
clearToast(): void
```

### 7.3 Isolation Rules

- UIStore has **no dependencies** on other stores or services.
- UIStore state is **never persisted** between sessions.
- UIStore is **reset** on logout (but not cleared — it's always in-memory).

---

## 8. Store Dependencies

```
┌─────────────────────────────────────────────────────────────┐
│                    Store Dependency Graph                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  AuthStore ──depends on──→ ISecureStorage, ILocalSettings  │
│                                                              │
│  TransactionStore ──depends on──→ IFireflyIIIClient        │
│                                                              │
│  AccountStore ──depends on──→ IFireflyIIIClient            │
│                                                              │
│  CategoryStore ──depends on──→ IFireflyIIIClient           │
│                                                              │
│  ReportStore ──depends on──→ IFireflyIIIClient             │
│                                                              │
│  UIStore ──depends on──→ Nothing (isolated)                 │
│                                                              │
│  Cross-store communication: via Services only               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 9. MobX Configuration

### 9.1 MobX Settings

```typescript
/**
 * Enable MobX strict mode.
 * All state mutations must happen inside @action methods.
 */
import { configure } from 'mobx';

configure({
  enforceActions: 'always',    // State changes only in @action
  computedRequiresReaction: true,
  reactionRequiresObservable: true,
  observableRequiresReaction: true,
});
```

### 9.2 Store Provider Pattern

```typescript
/**
 * Root store containing all domain stores.
 * Provided to the React tree via Context.
 */
export class RootStore {
  readonly authStore: AuthStore;
  readonly transactionStore: TransactionStore;
  readonly accountStore: AccountStore;
  readonly categoryStore: CategoryStore;
  readonly reportStore: ReportStore;
  readonly uiStore: UIStore;

  constructor(dependencies: {
    secureStorage: ISecureStorage;
    localSettings: ILocalSettings;
    apiClient: IFireflyIIIClient;
  }) {
    this.authStore = new AuthStore(dependencies.secureStorage, dependencies.localSettings, dependencies.apiClient);
    this.transactionStore = new TransactionStore(dependencies.apiClient);
    this.accountStore = new AccountStore(dependencies.apiClient);
    this.categoryStore = new CategoryStore(dependencies.apiClient);
    this.reportStore = new ReportStore(dependencies.apiClient);
    this.uiStore = new UIStore();
  }

  /**
   * Reset all stores (e.g., on logout).
   */
  reset(): void {
    this.authStore.clear();
    this.transactionStore.clear();
    this.accountStore.clear();
    this.categoryStore.clear();
    this.reportStore.clear();
    this.uiStore.reset();
  }
}
```
