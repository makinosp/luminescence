# Shared Core - Functional Design Plan

## Unit Context
- **Unit**: Unit 1 - Shared Core (`packages/core`)
- **Responsibilities**: Domain models, validators, serializers, API client, storage interfaces, MobX stores, error handling, services
- **Stories Covered**: US-01 through US-09, US-11 (shared logic portions)
- **Dependencies**: None (self-contained, pure business logic)

## Design Steps

### Step 1: Domain Model Analysis
- [ ] Analyze Transaction domain model structure and relationships
- [ ] Analyze Account domain model structure and relationships
- [ ] Analyze Category domain model structure and relationships
- [ ] Analyze Report domain model structure and relationships
- [ ] Define entity relationships and dependencies
- [ ] Document immutability constraints

### Step 2: Business Logic Modeling
- [ ] Model transaction validation rules and algorithms
- [ ] Model account validation rules and algorithms
- [ ] Model category validation rules and algorithms
- [ ] Model report calculation logic and aggregations
- [ ] Define pure transformation functions (PBT-suitable)
- [ ] Document business invariants and constraints

### Step 3: Business Rules Definition
- [ ] Define transaction type rules (deposit, withdrawal, transfer)
- [ ] Define amount validation rules (precision, sign, currency)
- [ ] Define date validation rules (future dates, transaction type constraints)
- [ ] Define account type constraints and relationships
- [ ] Define category assignment rules
- [ ] Define report period and aggregation rules

### Step 4: API Client Interface Design
- [ ] Define IFireflyIIIClient interface methods
- [ ] Define request/response data structures
- [ ] Define error handling and categorization logic
- [ ] Define retry middleware behavior (optional)
- [ ] Document API endpoint mappings

### Step 5: Storage Interface Design
- [ ] Define ISecureStorage interface (port)
- [ ] Define ILocalSettings interface (port)
- [ ] Define storage key naming conventions
- [ ] Define fail-closed behavior for storage errors
- [ ] Document security constraints (SB-02, NFR-02)

### Step 6: MobX Store Design
- [ ] Design AuthStore state and methods
- [ ] Design TransactionStore state and methods
- [ ] Design AccountStore state and methods
- [ ] Design CategoryStore state and methods
- [ ] Design ReportStore state and methods
- [ ] Design UIStore state and methods
- [ ] Define store interactions and dependencies

### Step 7: Service Layer Design
- [ ] Design AuthenticationService orchestration logic
- [ ] Design TransactionService orchestration logic
- [ ] Design AccountService orchestration logic
- [ ] Design CategoryService orchestration logic
- [ ] Design ReportService orchestration logic
- [ ] Design ValidationService orchestration logic
- [ ] Design ErrorHandlingService orchestration logic

### Step 8: Error Handling Design
- [ ] Define error type hierarchy (APIError, NetworkError, ValidationError, StorageError, AuthError)
- [ ] Define error categorization rules
- [ ] Define user-friendly message generation
- [ ] Define retry-ability determination logic
- [ ] Document secret redaction rules (SB-04, NFR-03)

### Step 9: Validation and Testing Strategy
- [ ] Identify pure functions suitable for property-based testing
- [ ] Define serialization round-trip test scenarios
- [ ] Define validation edge cases
- [ ] Document test coverage requirements

---

## Clarification Questions

Please answer the following questions to clarify the functional design for the Shared Core unit.

### Question 1 — Transaction Amount Precision
How should transaction amounts be represented and validated?

A) **Decimal with 2-digit precision** — Amounts are positive numbers with exactly 2 decimal places (e.g., 50.00, 123.45). Validation rejects amounts with more than 2 decimals or negative values.
B) **Integer cents** — Amounts are stored as integers representing cents (e.g., 5000 = $50.00). Conversion to/from decimal happens at API boundaries. Prevents floating-point errors.
C) **Decimal with flexible precision** — Amounts are positive numbers with up to 2 decimal places (e.g., 50, 50.5, 50.50 all valid). Validation rejects more than 2 decimals.
D) Other (please describe after [Answer]: tag below)

[Answer]: 

### Question 2 — Transaction Date Validation
What date validation rules should apply to transactions?

A) **No future dates** — All transaction dates must be today or in the past. Future-dated transactions are rejected.
B) **Future dates allowed for scheduled transactions** — Transactions can have future dates if marked as "scheduled" or "pending". Otherwise, dates must be today or past.
C) **Flexible with warning** — Future dates are allowed but trigger a validation warning (not an error). The user can confirm or adjust.
D) Other (please describe after [Answer]: tag below)

[Answer]: 

### Question 3 — Transaction Type Rules
What are the account requirements for each transaction type?

A) **Strict account pairing** — Withdrawals require fromAccount (asset) + toAccount (expense). Deposits require fromAccount (revenue) + toAccount (asset). Transfers require fromAccount (asset) + toAccount (asset).
B) **Flexible with defaults** — Only one account is required; the other can be inferred or defaulted based on transaction type. For example, withdrawals default toAccount to "Uncategorized Expense".
C) **Minimal validation** — Only validate that at least one account is provided. Let Firefly III API enforce account type rules.
D) Other (please describe after [Answer]: tag below)

[Answer]: 

### Question 4 — Pagination Strategy
How should the API client handle paginated responses from Firefly III?

A) **Cursor-based pagination** — Use page/offset parameters. Return `{ data: T[], hasMore: boolean, nextPage?: number }`. Client decides when to fetch more.
B) **Automatic full fetch** — Automatically fetch all pages and return complete dataset. Simpler for stores but may be slow for large datasets.
C) **Streaming/iterator** — Return an async iterator that yields items page by page. Memory-efficient for large datasets.
D) Other (please describe after [Answer]: tag below)

[Answer]: 

### Question 5 — Error Retry Behavior
Which operations should be automatically retried by the retry middleware?

A) **Idempotent GET operations only** — Only retry GET requests (read operations) on 5xx or network errors. Never retry POST/PUT/DELETE (mutations) automatically.
B) **All operations with user opt-in** — Retry all operations (including mutations) if the client enables retry middleware. Client decides retry policy.
C) **Configurable per-operation** — Each API method has a `retryable` flag. GET defaults to true, mutations default to false but can be overridden.
D) Other (please describe after [Answer]: tag below)

[Answer]: 

### Question 6 — Store Data Freshness
How should MobX stores handle data freshness and caching?

A) **Always fetch from API** — Stores always call the API on load. No local caching. Ensures data is current but may be slow.
B) **Cache with TTL** — Stores cache data with a time-to-live (e.g., 5 minutes). Return cached data if fresh, otherwise fetch from API.
C) **Manual refresh** — Stores load data once and hold it until explicitly refreshed by the user (pull-to-refresh, refresh button).
D) Other (please describe after [Answer]: tag below)

[Answer]: 

### Question 7 — Report Calculation Location
Where should financial report calculations (totals, averages, trends) be performed?

A) **Client-side from raw transactions** — Fetch all transactions for the period and calculate aggregates (sum, average, trend) in the ReportService. Flexible but may be slow for large datasets.
B) **Server-side via Firefly III API** — Use Firefly III's built-in report endpoints that return pre-calculated aggregates. Fast but limited to Firefly III's report types.
C) **Hybrid approach** — Use Firefly III report API for standard reports, but allow client-side calculation for custom queries or visualizations.
D) Other (please describe after [Answer]: tag below)

[Answer]: 

### Question 8 — Validation Error Granularity
How detailed should validation errors be?

A) **Field-level errors** — Return a map of field names to error messages (e.g., `{ amount: "Must be positive", description: "Required" }`). Allows UI to highlight specific fields.
B) **Single error message** — Return the first validation error encountered. Simpler but requires user to fix one issue at a time.
C) **All errors with severity** — Return all validation errors with severity levels (error, warning). UI can display all issues at once.
D) Other (please describe after [Answer]: tag below)

[Answer]: 

### Question 9 — Secure Storage Failure Handling
What should happen when secure storage operations fail?

A) **Fail closed with error** — Throw StorageError and block the operation. User must retry or reconfigure. Ensures security but may frustrate users.
B) **Fail closed with fallback prompt** — Throw StorageError but provide a user-friendly prompt to re-enter credentials or check device security settings.
C) **Graceful degradation** — Log the error (without secrets) and allow the user to continue in a limited mode (read-only, no authenticated operations).
D) Other (please describe after [Answer]: tag below)

[Answer]: 

### Question 10 — API Response Schema Validation
How strictly should Firefly III API responses be validated?

A) **Strict schema validation** — Validate every field in the API response against expected schema. Reject responses with unexpected fields or types. Catches API changes early.
B) **Lenient with type coercion** — Accept responses with extra fields (ignore them) and attempt type coercion (e.g., string "123" → number 123). More resilient to API variations.
C) **Minimal validation** — Only validate critical fields (id, amount, date). Trust the API for other fields. Fastest but riskier.
D) Other (please describe after [Answer]: tag below)

[Answer]: 

---

## Instructions
1. Fill in [Answer]: tags above with your chosen option (e.g., `[Answer]: A`)
2. For "Other" options, describe your preferred approach after the tag
3. After completing all answers, I'll review for ambiguities and ask follow-ups if needed
4. Once all questions are resolved, I'll generate the functional design artifacts
