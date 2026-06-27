# Shared Core - Code Generation Plan

## Unit Context
- **Unit**: Unit 1 - Shared Core (`packages/core`)
- **Project Type**: Greenfield, Multi-Unit Monorepo
- **Package Manager**: pnpm
- **Tech Stack**: TypeScript 5.4+ (max strict), MobX 6.x, Vitest + fast-check, native fetch, oxlint + Prettier
- **Runtime Dependencies**: mobx only (zero platform dependencies)

## Stories Covered
| Story | Description | Implementation |
|-------|-------------|---------------|
| US-01 | View transaction list | Transaction model, API client, TransactionStore, TransactionService |
| US-02 | Search & filter transactions | Filter params, TransactionStore pagination, ValidationService |
| US-03 | Create, edit, delete transactions | Transaction validators, serializers, mutation API calls, TransactionStore |
| US-04 | View accounts & balances | Account model, AccountStore, AccountService, API client |
| US-05 | Manage categories | Category model, CategoryStore, CategoryService, API client |
| US-06 | Financial reports | Report model, ReportStore, ReportService, trend calculation |
| US-08 | Error handling & user feedback | Error types, ErrorHandlingService, getUserMessage(), retry middleware |
| US-09 | Configure server connection | AuthStore, AuthenticationService, ValidationService, Storage interfaces |

## Dependencies
- **Depends on**: None (this is the foundational unit)
- **Depended on by**: Unit 2 (CLI), Unit 3 (Web), Unit 4 (Mobile) — all via `workspace:*`

---

## Generation Steps

### Step 1: Project Structure Setup (Monorepo Root)
- [x] Create root `package.json` with pnpm workspace configuration
- [x] Create `pnpm-workspace.yaml` defining packages
- [x] Create `tsconfig.base.json` with shared TypeScript compiler options
- [x] Create `oxlintrc.json` with security module isolation rules
- [x] Create `.prettierrc` with formatting configuration
- [x] Create `.gitignore` for Node.js/TypeScript project
- [x] Create `packages/core/package.json` with dependencies (mobx) and devDependencies
- [x] Create `packages/core/tsconfig.json` extending base config
- [x] Create `packages/core/vitest.config.ts` with fast-check integration
- [x] Create `packages/core/src/index.ts` (barrel export placeholder)

### Step 2: Error Types & Error Handling Foundation
- [x] Create `packages/core/src/errors/error-types.ts` — `LuminescenceError`, `APIError`, `NetworkError`, `ValidationError`, `StorageError`, `AuthError`
- [x] Create `packages/core/src/errors/error-categorization.ts` — `ErrorHandlingService` with categorize(), redact(), getUserMessage()
- [x] Create `packages/core/src/errors/__tests__/error-types.test.ts` — example-based tests for error hierarchy
- [x] Create `packages/core/src/errors/__properties__/error-categorization.properties.ts` — PBT for redaction invariants

### Step 3: Storage Interfaces (Ports)
- [x] Create `packages/core/src/storage/interfaces/secure-storage.ts` — `ISecureStorage` interface
- [x] Create `packages/core/src/storage/interfaces/local-settings.ts` — `ILocalSettings` interface
- [x] Create `packages/core/src/storage/__tests__/storage-interfaces.test.ts` — interface contract tests

### Step 4: Domain Models — Transaction
- [x] Create `packages/core/src/domain-models/transactions/transaction.ts` — `TransactionType`, `Transaction` interface, `TRANSACTION_TYPE_LABELS`, `TRANSACTION_TYPE_SIGN`, `TRANSACTION_ACCOUNT_REQUIREMENTS`, `netAmount()`
- [x] Create `packages/core/src/domain-models/transactions/validators.ts` — `ValidationResult`, `validResult()`, `invalidResult()`, `validateAmount()`, `validateDescription()`, `validateDate()`, `getDateWarning()`, `validateTransactionType()`, `validateTransactionInput()`
- [x] Create `packages/core/src/domain-models/transactions/serializers.ts` — `CreateTransactionInput`, `FireflyIIITransactionResponse`, `deserializeTransaction()`, `serializeCreateTransactionInput()`
- [x] Create `packages/core/src/domain-models/transactions/__tests__/transaction.test.ts` — example-based tests for netAmount(), type labels
- [x] Create `packages/core/src/domain-models/transactions/__properties__/validators.properties.ts` — PBT for all validators
- [x] Create `packages/core/src/domain-models/transactions/__properties__/serializers.properties.ts` — PBT for round-trip serialization

### Step 5: Domain Models — Account
- [x] Create `packages/core/src/domain-models/accounts/account.ts` — `AccountType`, `Account` interface, `isActiveAccount()`
- [x] Create `packages/core/src/domain-models/accounts/validators.ts` — `validateAccountType()`
- [x] Create `packages/core/src/domain-models/accounts/__tests__/account.test.ts` — example-based tests
- [x] Create `packages/core/src/domain-models/accounts/__properties__/validators.properties.ts` — PBT for account validators

### Step 6: Domain Models — Category
- [x] Create `packages/core/src/domain-models/categories/category.ts` — `Category` interface
- [x] Create `packages/core/src/domain-models/categories/validators.ts` — `validateCategoryId()`
- [x] Create `packages/core/src/domain-models/categories/__tests__/category.test.ts` — example-based tests
- [x] Create `packages/core/src/domain-models/categories/__properties__/validators.properties.ts` — PBT for category validators

### Step 7: Domain Models — Report
- [x] Create `packages/core/src/domain-models/reports/report.ts` — `ReportPeriod`, `DateRange`, `SpendingOverview`, `IncomeVsExpensesReport`, `CategorySpending`, `TrendAnalysis`, `calculateDateRange()`, `calculateNetCashflow()`, `calculateCategoryPercentages()`
- [x] Create `packages/core/src/domain-models/reports/__tests__/report.test.ts` — example-based tests for calculations
- [x] Create `packages/core/src/domain-models/reports/__properties__/report.properties.ts` — PBT for report calculation invariants

### Step 8: API Client — HTTP Adapter & Core
- [x] Create `packages/core/src/api-client/adapters/fetch-adapter.ts` — `IHTTPAdapter` interface, `FetchAdapter` implementation using native fetch
- [x] Create `packages/core/src/api-client/https-enforcer.ts` — `HTTPSEnforcer` with `setBaseURL()` validation
- [x] Create `packages/core/src/api-client/timeout-controller.ts` — `TimeoutController` with `AbortController`, default 10s
- [x] Create `packages/core/src/api-client/auth-gate.ts` — `AuthGate` with token injection, session cache
- [x] Create `packages/core/src/api-client/retry-middleware.ts` — `RetryMiddleware` for idempotent GET only, 1 retry, 500ms backoff
- [x] Create `packages/core/src/api-client/__tests__/https-enforcer.test.ts` — example-based tests
- [x] Create `packages/core/src/api-client/__tests__/retry-middleware.test.ts` — example-based tests
- [x] Create `packages/core/src/api-client/__properties__/retry-middleware.properties.ts` — PBT for retry behavior

### Step 9: API Client — Firefly III Client
- [x] Create `packages/core/src/api-client/firefly-client.ts` — `IFireflyIIIClient` interface, all CRUD operations
- [x] Create `packages/core/src/api-client/firefly-client-impl.ts` — `FireflyIIIClient` implementation with all CRUD operations (transactions, accounts, categories, reports, health)

### Step 10: MobX Stores
- [x] Create `packages/core/src/stores/auth-store.ts` — `AuthStore` with `isConfigured`, `baseURL`, `isTokenValid`, `isLoading`, `error`, `configureServer()`, `validateToken()`, `logout()`, `isAuthenticated` computed
- [x] Create `packages/core/src/stores/transaction-store.ts` — `TransactionStore` with `transactions[]`, `isLoading`, `error`, `currentPage`, `hasMore`, `loadTransactions()`, `loadNextPage()`, `addTransaction()`, `updateTransaction()`, `removeTransaction()`, `clear()`, `transactionsByCategory` computed, `monthlySummary` computed
- [x] Create `packages/core/src/stores/account-store.ts` — `AccountStore` with `accounts[]`, `isLoading`, `error`, `selectedAccountId`, `loadAccounts()`, `selectAccount()`, `clear()`
- [x] Create `packages/core/src/stores/category-store.ts` — `CategoryStore` with `categories[]`, `isLoading`, `error`, `loadCategories()`, `clear()`
- [x] Create `packages/core/src/stores/report-store.ts` — `ReportStore` with `spendingOverview`, `incomeVsExpenses`, `trendAnalysis`, `selectedPeriod`, `customDateRange`, `isLoading`, `error`, `loadSpendingOverview()`, `loadIncomeVsExpenses()`, `loadTrendAnalysis()`, `selectPeriod()`, `clear()`
- [x] Create `packages/core/src/stores/ui-store.ts` — `UIStore` with `isModalOpen`, `activeTab`, `formData`, `openModal()`, `closeModal()`, `switchTab()`, `setFormData()`, `clearFormData()`

### Step 11: Services — Validation & Error Handling
- [x] Create `packages/core/src/services/validation-service.ts` — `ValidationService` with `validateURL()`, `validateToken()`, `validateTransactionInput()`, `validateAccountType()`, `validateCategoryId()`, `validateDateRange()`

### Step 12: Services — Authentication
- [x] Create `packages/core/src/services/authentication-service.ts` — `AuthenticationService` with `isConfigured()`, `configureServer()`, `reconfigure()`, `getValidToken()`, `logout()`, `validateConnectivity()`

### Step 13: Services — Transaction, Account, Category
- [x] Create `packages/core/src/services/transaction-service.ts` — `TransactionService` with `getTransactions()`, `getTransaction()`, `createTransaction()`, `updateTransaction()`, `deleteTransaction()`, `getTransactionsByCategory()`, `getTransactionsByDateRange()`
- [x] Create `packages/core/src/services/account-service.ts` — `AccountService` with `getAccounts()`, `getAccount()`, `getAssetAccounts()`, `selectAccount()`
- [x] Create `packages/core/src/services/category-service.ts` — `CategoryService` with `getCategories()`, `getCategory()`, `getSpendingByCategory()`, `getCategoryTransactions()`

### Step 14: Services — Report
- [x] Create `packages/core/src/services/report-service.ts` — `ReportService` with `getSpendingOverview()`, `getIncomeVsExpenses()`, `getSpendingByCategory()`, `getTrendAnalysis()`

### Step 15: Storage Platform Adapters
- [x] Create `packages/core/src/storage/adapters/keychain-adapter.ts` — iOS Keychain adapter (stub with `ISecureStorage`)
- [x] Create `packages/core/src/storage/adapters/keystore-adapter.ts` — Android Keystore adapter (stub with `ISecureStorage`)
- [x] Create `packages/core/src/storage/adapters/session-storage-adapter.ts` — Web sessionStorage adapter (stub with `ISecureStorage`)
- [x] Create `packages/core/src/storage/adapters/keyring-adapter.ts` — CLI OS keyring adapter (stub with `ISecureStorage`)
- [x] Create `packages/core/src/storage/adapters/async-storage-adapter.ts` — Mobile AsyncStorage adapter (stub with `ILocalSettings`)
- [x] Create `packages/core/src/storage/adapters/local-storage-adapter.ts` — Web localStorage adapter (stub with `ILocalSettings`)
- [x] Create `packages/core/src/storage/adapters/json-config-adapter.ts` — CLI JSON config adapter (stub with `ILocalSettings`)

### Step 16: Barrel Exports & Package Entry Point
- [x] Update `packages/core/src/index.ts` — barrel exports for all public APIs (domain models, validators, serializers, API client, stores, services, storage interfaces, errors)
- [x] Create `packages/core/src/domain-models/index.ts` — barrel export
- [x] Create `packages/core/src/stores/index.ts` — barrel export
- [x] Create `packages/core/src/services/index.ts` — barrel export
- [x] Create `packages/core/src/api-client/index.ts` — barrel export
- [x] Create `packages/core/src/storage/index.ts` — barrel export
- [x] Create `packages/core/src/errors/index.ts` — barrel export

### Step 17: Documentation Generation
- [x] Create `aidlc-docs/construction/shared-core/code/code-generation-summary.md` — summary of all generated files, module structure, and key design decisions

### Step 18: Install Dependencies & Verify Build
- [x] Run `pnpm install` to install all dependencies
- [x] Run `pnpm --filter @luminescence/core build` to verify TypeScript compilation
- [x] Run `pnpm --filter @luminescence/core test` to verify all tests pass
- [x] Run `pnpm oxlint` to verify linting passes

---

## Total Steps: 18
## Estimated Files: ~75 files (source + tests + config)
