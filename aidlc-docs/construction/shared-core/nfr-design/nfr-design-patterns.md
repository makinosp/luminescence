# Shared Core - NFR Design Patterns

## 1. Resilience Patterns

### 1.1 Retry Middleware (Idempotent GET Only)

**Requirement**: NFR Reliability §2.2 — Retry middleware for idempotent GET requests only.

```
┌─────────────────────────────────────────────────────────────┐
│                   Retry Middleware Flow                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  GET Request ──► Attempt 1 ──► Success ──► Return Result    │
│                     │                                        │
│                     ▼ Failure                                │
│              Wait 500ms (exponential backoff)                │
│                     │                                        │
│                     ▼                                        │
│              Attempt 2 ──► Success ──► Return Result         │
│                     │                                        │
│                     ▼ Failure                                │
│              Return NetworkError                             │
│                                                              │
│  POST/PUT/DELETE ──► Single attempt ──► Return result/error │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Pattern Details**:
- **Scope**: GET requests only (list transactions, get accounts, get categories, get reports).
- **Non-idempotent operations** (POST, PUT, DELETE) are **never** retried automatically.
- **Retry configuration**: Maximum 1 retry with exponential backoff starting at 500ms.
- **Implementation**: Middleware in the API client layer (`api-client/retry-middleware.ts`).
- **Error propagation**: After retry exhaustion, the error is categorized by `ErrorHandlingService` and surfaced as `NetworkError`.

### 1.2 No Circuit Breaker (Answer: B)

**Decision**: No circuit breaker pattern. Each API call fails independently when the Firefly III server is unreachable. The client UI is responsible for displaying offline indicators.

**Rationale**: The personal finance use case (single-user, single-device) does not require server-side circuit breaking. Network errors are surfaced immediately, allowing the user to retry manually.

### 1.3 Fail-Closed on Storage Unavailability (Answer: A)

**Requirement**: NFR Security §1.3, NFR Reliability §2.3

When `ISecureStorage` is unavailable:
1. All authenticated operations are **blocked**.
2. `AuthStore` transitions to an `error` state.
3. User-facing message prompts the user to unlock storage.
4. No fallback to in-memory token storage.

```
┌─────────────────────────────────────────────────────────────┐
│                Fail-Closed Storage Flow                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  getToken() ──► Storage Available ──► Return Token           │
│       │                                                      │
│       ▼ Storage Unavailable                                  │
│  Throw StorageError ──► AuthStore.error = "Unlock storage"   │
│                      ──► Block all API calls                 │
│                                                              │
│  setToken() ──► Storage Available ──► Store Token            │
│       │                                                      │
│       ▼ Storage Unavailable                                  │
│  Throw StorageError ──► AuthStore remains in previous state  │
│                      ──► No partial update                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 1.4 Concurrent Request Handling (Answer: C)

**Decision**: Simple concurrent handling with last-write-wins semantics.

- MobX transactions ensure atomic state updates.
- No explicit conflict resolution for the personal finance use case.
- Race conditions are acceptable (single-user, single-device).

---

## 2. Security Patterns

### 2.1 Token Lifecycle (Answer: B — Session Cache)

**Requirement**: NFR Security §1.1, §1.6

```
┌─────────────────────────────────────────────────────────────┐
│                    Token Lifecycle                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  App Start ──► Read token from ISecureStorage (once)         │
│            ──► Cache in memory for session                   │
│            ──► Use for all API calls                         │
│                                                              │
│  On 401 ──► Clear in-memory cache                            │
│         ──► Re-read from ISecureStorage                      │
│         ──► If null ──► AuthStore → unauthenticated          │
│                                                              │
│  On Logout ──► Clear in-memory cache                         │
│            ──► Clear ISecureStorage                           │
│                                                              │
│  Token is NEVER:                                             │
│  - Stored in MobX observable state                           │
│  - Stored in ILocalSettings                                  │
│  - Included in error messages or logs                        │
│  - Persisted to AsyncStorage/localStorage                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Error Redaction Pipeline (Answer: B — User-Facing Only)

**Requirement**: NFR Security §1.2, SB-04

Internal logs may contain full error details (URLs, stack traces) for debugging. Only user-facing error messages are redacted.

```
┌─────────────────────────────────────────────────────────────┐
│               Error Redaction Pipeline                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Raw Error ──► ErrorHandlingService.categorize()             │
│                   │                                          │
│                   ├──► Internal Log (full details)           │
│                   │    - URL, stack trace, error code        │
│                   │    - For developer debugging             │
│                   │                                          │
│                   └──► User-Facing Message (redacted)        │
│                        - Generic, actionable text            │
│                        - No tokens, URLs, paths              │
│                        - i18n-ready structured keys           │
│                                                              │
│  Redaction applies to:                                       │
│  ✗ Token values                                              │
│  ✗ Base URLs in error context                                │
│  ✗ Internal file paths                                       │
│  ✗ Framework details                                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 Validation Pipeline (Answer: B — Chain of Validators)

**Requirement**: NFR Security §1.4, SB-03

Composable validator functions that can be chained together:

```typescript
// Validation chain pattern
const validateTransaction = (input: CreateTransactionInput): ValidationResult[] => [
  validateAmount(input.amount),
  validateDescription(input.description),
  validateDate(input.date),
  validateAccounts(input.fromAccountId, input.toAccountId, input.type),
  validateCategory(input.categoryId, input.type),
].filter((r): r is ValidationResult => r !== null);
```

**Chain behavior**:
- Each validator is a **pure function** (PBT-suitable).
- All validators run; errors are **collected**, not short-circuited.
- Returns `ValidationError` with field-level error details.

### 2.4 Security Module Isolation (Answer: A — Linter Import Restrictions)

**Requirement**: NFR Security §1.6

Use `oxlint` (Rust-based, fast, React Native + Expo compatible) `no-restricted-imports` to enforce module boundaries:

```jsonc
// oxlint configuration
{
  "rules": {
    "no-restricted-imports": [
      "error",
      {
        "patterns": [
          {
            "group": ["packages/core/src/api-client/internal/*"],
            "message": "Auth internals are not accessible outside the api-client module."
          }
        ]
      }
    ]
  }
}
```

**Isolated modules**:
- `packages/core/src/api-client/` — HTTP client and auth headers
- `packages/core/src/storage/interfaces/` — Storage port definitions
- `packages/core/src/services/authentication-service.ts` — Auth orchestration
- `packages/core/src/errors/` — Error types and redaction

### 2.5 TLS Enforcement

**Requirement**: NFR Security §1.5

- `IFireflyIIIClient.setBaseURL()` validates HTTPS scheme at configuration time.
- Non-HTTPS URLs throw `ValidationError` immediately.
- Plaintext HTTP connections are rejected before any network request.

---

## 3. Performance Patterns

### 3.1 MobX Computed Properties

**Requirement**: NFR Performance §3.2

```typescript
// Derived data via computed properties — no redundant calculations
class TransactionStore {
  @computed
  get transactionsByCategory(): Map<string, Transaction[]> {
    return groupBy(this.transactions, t => t.categoryId ?? 'uncategorized');
  }

  @computed
  get monthlySummary(): MonthlySummary {
    return calculateMonthlySummary(this.transactions);
  }
}
```

**Rules**:
- Computed properties cache results until dependencies change.
- No manual cache invalidation needed — MobX handles reactivity.
- Up to 1,000 items per view is the target performance boundary.

### 3.2 Cursor-Based Pagination

**Requirement**: NFR Performance §3.2, Functional Design Q4 Answer A

- API responses include `hasMore` and `nextPage` fields.
- `TransactionStore.loadNextPage()` appends to the existing list.
- No full-refresh on pagination — only new pages are fetched.

### 3.3 Manual Refresh Model (Answer: C)

**Requirement**: Functional Design Q6 Answer C

- Stores hold data until the user explicitly triggers a refresh.
- No automatic polling or background refresh.
- Pull-to-refresh or refresh button triggers `store.loadTransactions()`.

### 3.4 API Client Timeout (Answer: D — Configurable)

**Requirement**: Clarification Q7 Answer D

```typescript
// Default timeout: 10 seconds, configurable per-request or globally
const DEFAULT_TIMEOUT_MS = 10_000;

interface RequestConfig {
  url: string;
  method: string;
  timeout?: number; // Override default timeout
  signal?: AbortController; // For cancellation
}
```

- Default: 10 seconds (balances slower self-hosted servers with responsive UX).
- Per-request override for long-running operations (e.g., report generation).
- Uses `AbortController` for timeout implementation with native `fetch`.

---

## 4. Maintainability Patterns

### 4.1 Property-Based Testing Organization (Answer: B — Separate Test Directory)

**Requirement**: NFR Maintainability §4.1, PBT-REQ-01/02/03

```
packages/core/src/
├── domain-models/
│   └── transaction/
│       ├── transaction.ts
│       ├── __tests__/
│       │   └── transaction.test.ts          // Example-based tests
│       └── __properties__/
│           └── transaction.properties.ts    // Property-based tests
├── services/
│   └── authentication-service.ts
│   └── __tests__/
│       └── authentication-service.test.ts
└── ...
```

**PBT scope** (Answer: A — Full scope, all pure functions):
- **Validators**: amount, description, date, URL, token, transaction input
- **Serializers**: Firefly III API response parsing, request format conversion
- **Domain logic**: `netAmount()` calculation, transaction type sign, account pairing rules
- **Round-trip serialization**: `serialize(deserialize(data)) === data`
- **Business rule invariants**: amount sign convention, transfer account distinctness

**PBT complements, not replaces, example-based tests** for critical user flows.

### 4.2 Strict TypeScript Configuration

**Requirement**: Tech Stack §1.2 — Maximum strictness

All strict flags enabled:
- `strict: true`
- `noUncheckedIndexedAccess: true`
- `exactOptionalPropertyTypes: true`
- `noImplicitReturns: true`

### 4.3 Zero Platform Dependencies

**Requirement**: Tech Stack §6.3

- Shared core has **zero platform dependencies** at runtime.
- Only `mobx` is a runtime dependency.
- All platform concerns (storage, HTTP) are behind port interfaces (`ISecureStorage`, `ILocalSettings`, `IHTTPAdapter`).

### 4.4 Linting with oxlint

**Requirement**: Clarification Q8, Tech Stack §5.1 (updated)

- ESLint replaced with **oxlint** (Rust-based, fast, React Native + Expo compatible).
- Key rules:
  - `no-restricted-imports` for security module isolation.
  - `@typescript-eslint/no-explicit-any`: error.
  - `@typescript-eslint/strict-boolean-expressions`: error.

---

## 5. Extension Rule Compliance

### 5.1 Security Baseline (Enabled, Full Mode)

| Rule | Status | Design Pattern |
|------|--------|----------------|
| SB-01 | Compliant | `ILocalSettings` for non-sensitive settings only |
| SB-02 | Compliant | `ISecureStorage` exclusive token storage; session cache in memory |
| SB-03 | Compliant | Chain of validators before any API request |
| SB-04 | Compliant | Error redaction pipeline — user-facing messages redacted; internal logs full detail |
| SB-05 | Compliant | Defense in depth: validation + secure storage + fail-closed + TLS + module isolation |

### 5.2 Property-Based Testing (Enabled, Partial Mode)

| Rule | Status | Design Pattern |
|------|--------|----------------|
| PBT-REQ-01 | Compliant | PBT for all pure functions (validators, serializers, domain logic) |
| PBT-REQ-02 | Compliant | Realistic domain constraint generators (ISO 4217, 2-decimal amounts, valid dates) |
| PBT-REQ-03 | Compliant | PBT in `__properties__/` directories; example-based tests in `__tests__/` for critical flows |
