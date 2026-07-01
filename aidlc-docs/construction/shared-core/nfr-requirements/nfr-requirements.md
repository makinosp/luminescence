# Shared Core - NFR Requirements

## Unit Context

- **Unit**: Unit 1 - Shared Core (`packages/core`)
- **Responsibilities**: Domain models, validators, serializers, API client, storage interfaces, MobX stores, error handling, services
- **Stories Covered**: US-01 through US-09, US-11 (shared logic portions)

---

## 1. Security Requirements

### 1.1 Token Storage (NFR-02, SB-02)

- The personal access token shall **only** be stored through the `ISecureStorage` port.
- The token shall **never** be stored in `AsyncStorage`, `localStorage`, `sessionStorage`, or any non-secure store.
- The token shall **never** be held in MobX store state or any in-memory observable beyond the immediate call scope.
- Platform adapters: Keychain (iOS), Keystore (Android), sessionStorage (Web, session-only), OS keyring (CLI).

### 1.2 Secret Redaction (NFR-03, SB-04)

- All error messages returned by the shared core shall **never** contain token values, server URLs, stack traces, or internal paths.
- The `ErrorHandlingService` shall apply redaction **before** any error is surfaced to the caller.
- Log output from the shared core (if any) shall use structured logging with sensitive fields redacted.
- Redaction applies to: token values, base URLs in error context, internal file paths, framework details.

### 1.3 Fail-Closed Behavior (NFR-07, SB-05)

- When `ISecureStorage` is unavailable (keychain locked, keyring inaccessible), the shared core shall **block** all authenticated operations.
- The `AuthStore` shall transition to an `error` state with a user-facing message prompting the user to unlock storage.
- Clarification Q6 Answer A: Fail-closed with user prompt.
- No fallback to in-memory token storage is permitted.

### 1.4 Input Validation (SB-03)

- All user inputs (server URL, token, transaction data) shall be validated **before** any API request is made.
- URL validation: must be a valid HTTPS URL; malformed URLs throw `ValidationError`.
- Token validation: must be a non-empty string; empty tokens throw `ValidationError`.
- Transaction input validation: amount, description, date, and account IDs validated per business rules.

### 1.5 TLS Requirement (NFR-01)

- All Firefly III API communication shall use HTTPS (TLS 1.2+).
- The `IFireflyIIIClient` implementation shall reject non-HTTPS base URLs at configuration time.
- Plaintext HTTP connections are not supported.

### 1.6 Security-Critical Module Isolation (NFR-06)

- Authentication, API access, secure storage, and local settings shall be isolated in dedicated modules:
    - `packages/core/src/api-client/` — HTTP client and auth headers
    - `packages/core/src/storage/interfaces/` — Storage port definitions
    - `packages/core/src/services/authentication-service.ts` — Auth orchestration
    - `packages/core/src/errors/` — Error types and redaction

---

## 2. Reliability Requirements

### 2.1 Error Handling

- The shared core defines a typed error hierarchy: `APIError`, `NetworkError`, `ValidationError`, `StorageError`, `AuthError`.
- All errors are categorized by the `ErrorHandlingService` into user-facing messages (generic, no internals) and internal diagnostics (redacted).
- Clarification Q8 Answer B: Error-only token handling — the core returns `AuthError` on 401; the client UI decides re-authentication flow.

### 2.2 Retry Middleware

- Clarification Q5 Answer A (Functional Design): Idempotent GET requests only are retried.
- Retry is applied at the API client layer via middleware.
- Non-idempotent operations (POST, PUT, DELETE) are **not** retried automatically.
- Retry configuration: maximum 1 retry with exponential backoff (starting at 500ms).

### 2.3 Storage Failure Recovery

- Clarification Q6 Answer A: Fail-closed with user prompt.
- When `ISecureStorage.setToken()` fails, the `AuthenticationService` shall:
    1. Return a `StorageError` to the caller.
    2. The client UI shall display a prompt asking the user to unlock secure storage.
    3. The `AuthStore` shall remain in its previous valid state (no partial update).
- When `ISecureStorage.getToken()` fails, the `AuthStore` shall treat the user as unauthenticated.

### 2.4 Concurrent Request Handling

- Clarification Q2 Answer C: Simple — allow concurrent requests, last-write-wins.
- MobX transactions ensure atomic state updates.
- No explicit conflict resolution; the last API response updates the store.
- Race conditions are acceptable for the personal finance use case (single-user, single-device).

---

## 3. Performance Requirements

### 3.1 API Response Time

- Clarification Q1 Answer B: Moderate — under 2 seconds for standard operations.
- The shared core shall display loading states during API calls.
- No aggressive caching is required; the core relies on server-side data with manual refresh.

### 3.2 Store Update Efficiency

- Clarification Q5 Answer B: Medium — up to 1,000 items per view.
- MobX `computed` properties shall be used for derived data (e.g., category totals, monthly summaries).
- No virtualization is required at the store level; pagination is handled at the API layer (cursor-based, per Functional Design Q4 Answer A).
- Manual refresh model (Functional Design Q6 Answer C): stores hold data until the user explicitly triggers a refresh.

### 3.3 Serialization Performance

- Domain model serialization/deserialization shall complete in under 10ms for typical payloads (< 100 items).
- No streaming parser is required for the expected data volumes.

---

## 4. Maintainability Requirements

### 4.1 Property-Based Testing (NFR-11, NFR-12, NFR-13, PBT-REQ-01/02/03)

- Clarification Q4 Answer A: Full scope — all pure functions are covered.
- PBT applies to:
    - **Validators**: amount, description, date, URL, token, transaction input
    - **Serializers**: Firefly III API response parsing, request format conversion
    - **Domain logic**: `netAmount()` calculation, transaction type sign, account pairing rules
    - **Round-trip serialization**: `serialize(deserialize(data)) === data`
    - **Business rule invariants**: amount sign convention, transfer account distinctness
- Property generators shall model realistic domain constraints (PBT-REQ-02): amounts with max 2 decimal places, valid ISO 4217 currency codes, realistic date ranges.
- fast-check is the property-based testing library (NFR-12).
- PBT failures shall preserve seed and minimized counterexample data (NFR-13).
- PBT complements, not replaces, example-based tests for critical user flows (PBT-REQ-03).

### 4.2 Example-Based Testing (NFR-10)

- Critical user flows (authentication, transaction CRUD, error handling) shall have example-based tests.
- Minimum coverage: all service orchestration paths, all error categorization paths.

### 4.3 Code Organization

- Hybrid layering (Application Design Q6 Answer C): domain models, services, stores, API client, storage in separate directories.
- Zero platform dependencies in the shared core — all platform concerns are behind port interfaces.
- Each module has a single responsibility and communicates through well-defined interfaces.

---

## 5. Availability Requirements

### 5.1 Offline Behavior

- The shared core does **not** implement offline-first synchronization (CA-05).
- When the Firefly III server is unreachable, API calls fail with `NetworkError`.
- The client UI is responsible for displaying appropriate offline indicators.
- Non-sensitive local settings (base URL) remain accessible from `ILocalSettings` when offline.

### 5.2 Disaster Recovery

- No server-side data is stored by the client (CA-06).
- Re-authentication (re-entering server URL and token) restores full functionality.
- No backup/restore mechanism is required for the shared core.

---

## 6. Usability Requirements (Core-Level)

### 6.1 Error Messages

- All user-facing error messages shall be generic and actionable.
- Messages shall **not** expose: stack traces, framework names, internal file paths, token values, server URLs.
- Error messages shall be internationalization-ready (structured keys, not hardcoded English strings in the core).

### 6.2 Validation Error Granularity

- Clarification Q8 Answer A (Functional Design): Field-level validation errors.
- Each invalid field is identified by name with a specific error message.
- Multiple validation errors can be returned in a single `ValidationError`.

---

## 7. Compliance with Extension Rules

### 7.1 Security Baseline (Enabled, Full Mode)

| Rule  | Status    | Implementation                                                 |
| ----- | --------- | -------------------------------------------------------------- |
| SB-01 | Compliant | `ILocalSettings` for non-sensitive settings                    |
| SB-02 | Compliant | `ISecureStorage` for token storage only                        |
| SB-03 | Compliant | Client-side validation before API requests                     |
| SB-04 | Compliant | `ErrorHandlingService` redacts sensitive data                  |
| SB-05 | Compliant | Defense in depth via validation + secure storage + fail-closed |

### 7.2 Property-Based Testing (Enabled, Partial Mode)

| Rule       | Status    | Implementation                              |
| ---------- | --------- | ------------------------------------------- |
| PBT-REQ-01 | Compliant | PBT for pure domain logic and serialization |
| PBT-REQ-02 | Compliant | Realistic domain constraint generators      |
| PBT-REQ-03 | Compliant | PBT complements example-based tests         |
