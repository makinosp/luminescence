# Shared Core - Logical Components

## 1. Component Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Logical Component Diagram                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        API Client Layer                             │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐ │   │
│  │  │  HTTPS       │  │  Retry       │  │  Timeout                 │ │   │
│  │  │  Enforcer    │  │  Middleware  │  │  Controller              │ │   │
│  │  │  (TLS 1.2+)  │  │  (GET only)  │  │  (default 10s)           │ │   │
│  │  └──────┬───────┘  └──────┬───────┘  └────────────┬─────────────┘ │   │
│  │         │                 │                        │               │   │
│  │         └────────────┬────┴────────────────────────┘               │   │
│  │                      ▼                                             │   │
│  │            ┌──────────────────┐                                    │   │
│  │            │  Auth Gate       │                                    │   │
│  │            │  (Token Injector)│                                    │   │
│  │            └────────┬─────────┘                                    │   │
│  │                     │                                              │   │
│  └─────────────────────┼──────────────────────────────────────────────┘   │
│                        │                                                   │
│                        ▼                                                   │
│              ┌──────────────────┐                                          │
│              │  native fetch    │                                          │
│              │  (IHTTPAdapter)  │                                          │
│              └──────────────────┘                                          │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        Service Layer                                 │   │
│  │                                                                      │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌────────────────────┐ │   │
│  │  │  Authentication │  │  Validation     │  │  Error Handling    │ │   │
│  │  │  Service        │  │  Service        │  │  Service           │ │   │
│  │  │  (Orchestrator) │  │  (Pure Chain)   │  │  (Redaction)       │ │   │
│  │  └────────┬────────┘  └────────┬────────┘  └─────────┬──────────┘ │   │
│  │           │                    │                      │            │   │
│  │  ┌────────┴────────┐  ┌───────┴─────────┐  ┌────────┴──────────┐ │   │
│  │  │  Transaction    │  │  Account        │  │  Category         │ │   │
│  │  │  Service        │  │  Service        │  │  Service          │ │   │
│  │  └─────────────────┘  └─────────────────┘  └────────────────────┘ │   │
│  │                                                                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        Store Layer (MobX)                            │   │
│  │                                                                      │   │
│  │  ┌──────────┐  ┌──────────────┐  ┌───────────┐  ┌───────────────┐ │   │
│  │  │  Auth    │  │  Transaction │  │  Account  │  │  Category     │ │   │
│  │  │  Store   │  │  Store       │  │  Store    │  │  Store        │ │   │
│  │  │          │  │  (computed)  │  │           │  │               │ │   │
│  │  └──────────┘  └──────────────┘  └───────────┘  └───────────────┘ │   │
│  │                                                                      │   │
│  │  ┌────────────────────────────────────────────────────────────────┐ │   │
│  │  │  UI Store (isolated, no API calls)                             │ │   │
│  │  └────────────────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        Storage Ports                                 │   │
│  │                                                                      │   │
│  │  ┌──────────────────┐        ┌──────────────────┐                  │   │
│  │  │  ISecureStorage  │        │  ILocalSettings  │                  │   │
│  │  │  (Token only)    │        │  (Non-sensitive) │                  │   │
│  │  │  Fail-closed     │        │  AsyncStorage OK │                  │   │
│  │  └──────────────────┘        └──────────────────┘                  │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. API Client Layer Components

### 2.1 HTTPS Enforcer

| Property           | Value                                                                           |
| ------------------ | ------------------------------------------------------------------------------- |
| **Component**      | HTTPS Enforcer                                                                  |
| **Location**       | `packages/core/src/api-client/https-enforcer.ts`                                |
| **Responsibility** | Reject non-HTTPS base URLs at configuration time                                |
| **NFR Mapping**    | NFR-01 (TLS Requirement), SB-03                                                 |
| **Behavior**       | `setBaseURL()` validates URL scheme; throws `ValidationError` if not `https://` |

### 2.2 Retry Middleware

| Property           | Value                                                             |
| ------------------ | ----------------------------------------------------------------- |
| **Component**      | Retry Middleware                                                  |
| **Location**       | `packages/core/src/api-client/retry-middleware.ts`                |
| **Responsibility** | Retry failed GET requests with exponential backoff                |
| **NFR Mapping**    | NFR Reliability §2.2                                              |
| **Behavior**       | Max 1 retry, 500ms initial backoff; POST/PUT/DELETE never retried |
| **Configuration**  | Retry count and backoff delay are hardcoded (not configurable)    |

### 2.3 Timeout Controller

| Property           | Value                                                |
| ------------------ | ---------------------------------------------------- |
| **Component**      | Timeout Controller                                   |
| **Location**       | `packages/core/src/api-client/timeout-controller.ts` |
| **Responsibility** | Abort requests exceeding timeout threshold           |
| **NFR Mapping**    | NFR Performance §3.4, Clarification Q7 Answer D      |
| **Default**        | 10 seconds                                           |
| **Override**       | Per-request timeout via `RequestConfig.timeout`      |
| **Implementation** | `AbortController` with native `fetch` signal         |

### 2.4 Auth Gate (Token Injector)

| Property           | Value                                                                           |
| ------------------ | ------------------------------------------------------------------------------- |
| **Component**      | Auth Gate                                                                       |
| **Location**       | `packages/core/src/api-client/auth-gate.ts`                                     |
| **Responsibility** | Inject Bearer token into outgoing API requests                                  |
| **NFR Mapping**    | NFR Security §1.1, §1.6, SB-02                                                  |
| **Behavior**       | Reads token from session cache; attaches `Authorization: Bearer <token>` header |
| **Session Cache**  | Token cached in memory for session lifetime; refreshed on 401 or logout         |
| **Isolation**      | Auth internals restricted via `oxlint` `no-restricted-imports`                  |

---

## 3. Service Layer Components

### 3.1 Authentication Service

| Property           | Value                                                                                  |
| ------------------ | -------------------------------------------------------------------------------------- |
| **Component**      | AuthenticationService                                                                  |
| **Location**       | `packages/core/src/services/authentication-service.ts`                                 |
| **Responsibility** | Orchestrate authentication flow: validate, store token, test connectivity              |
| **NFR Mapping**    | NFR Security §1.1, §1.3, §1.4; NFR Reliability §2.3                                    |
| **Dependencies**   | `AuthStore`, `ISecureStorage`, `ILocalSettings`, `IFireflyIIIClient`                   |
| **Fail-Closed**    | If `ISecureStorage` unavailable, operation fails with `StorageError`; no partial state |

### 3.2 Validation Service

| Property           | Value                                                                                                                           |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| **Component**      | ValidationService                                                                                                               |
| **Location**       | `packages/core/src/services/validation-service.ts`                                                                              |
| **Responsibility** | Chain of composable validators for all input data                                                                               |
| **NFR Mapping**    | NFR Security §1.4, SB-03; NFR Maintainability §4.1                                                                              |
| **Pattern**        | Chain of validators — all run, errors collected (not short-circuited)                                                           |
| **PBT Coverage**   | All validator functions are pure — covered by property-based tests                                                              |
| **Validators**     | `validateAmount`, `validateDescription`, `validateDate`, `validateAccounts`, `validateCategory`, `validateURL`, `validateToken` |

### 3.3 Error Handling Service

| Property           | Value                                                                                                               |
| ------------------ | ------------------------------------------------------------------------------------------------------------------- |
| **Component**      | ErrorHandlingService                                                                                                |
| **Location**       | `packages/core/src/services/error-handling-service.ts`                                                              |
| **Responsibility** | Categorize errors, apply redaction, produce user-facing messages                                                    |
| **NFR Mapping**    | NFR Security §1.2, SB-04; NFR Usability §6.1                                                                        |
| **Redaction**      | User-facing messages redacted; internal logs retain full details                                                    |
| **Output**         | Typed errors (`APIError`, `NetworkError`, `ValidationError`, `StorageError`, `AuthError`) + i18n-ready message keys |

### 3.4 Transaction Service

| Property           | Value                                                                              |
| ------------------ | ---------------------------------------------------------------------------------- |
| **Component**      | TransactionService                                                                 |
| **Location**       | `packages/core/src/services/transaction-service.ts`                                |
| **Responsibility** | Orchestrate transaction CRUD with validation and store updates                     |
| **NFR Mapping**    | NFR Performance §3.1, §3.2; NFR Reliability §2.1                                   |
| **Dependencies**   | `TransactionStore`, `IFireflyIIIClient`, `ValidationService`, `Transaction` domain |
| **Flow**           | Validate → API call → Update store → Return result                                 |

### 3.5 Account Service

| Property           | Value                                                 |
| ------------------ | ----------------------------------------------------- |
| **Component**      | AccountService                                        |
| **Location**       | `packages/core/src/services/account-service.ts`       |
| **Responsibility** | Orchestrate account listing and selection             |
| **Dependencies**   | `AccountStore`, `IFireflyIIIClient`, `Account` domain |

### 3.6 Category Service

| Property           | Value                                                                         |
| ------------------ | ----------------------------------------------------------------------------- |
| **Component**      | CategoryService                                                               |
| \*\*Location`      | `packages/core/src/services/category-service.ts`                              |
| **Responsibility** | Orchestrate category listing and transaction grouping                         |
| **Dependencies**   | `CategoryStore`, `IFireflyIIIClient`, `Category` domain, `TransactionService` |

### 3.7 Report Service

| Property           | Value                                                                       |
| ------------------ | --------------------------------------------------------------------------- |
| **Component**      | ReportService                                                               |
| **Location**       | `packages/core/src/services/report-service.ts`                              |
| **Responsibility** | Orchestrate report generation with date range filtering                     |
| **Dependencies**   | `ReportStore`, `IFireflyIIIClient`, `TransactionService`, `CategoryService` |

---

## 4. Store Layer Components

### 4.1 AuthStore

| Property              | Value                                                                        |
| --------------------- | ---------------------------------------------------------------------------- | ----------------------- |
| **Component**         | AuthStore                                                                    |
| **Location**          | `packages/core/src/stores/auth-store.ts`                                     |
| **Responsibility**    | Manage authentication state (isConfigured, baseURL, isTokenValid, error)     |
| **NFR Mapping**       | NFR Security §1.3 (fail-closed); NFR Reliability §2.4                        |
| **Error Granularity** | Single `error: AppError                                                      | null` field (Answer: A) |
| **Token Handling**    | Token is NOT stored in MobX state; retrieved from `ISecureStorage` on demand |
| **Concurrency**       | Last-write-wins via MobX transactions                                        |

### 4.2 TransactionStore

| Property              | Value                                                            |
| --------------------- | ---------------------------------------------------------------- | ------------ | --------- | ----------- |
| **Component**         | TransactionStore                                                 |
| **Location**          | `packages/core/src/stores/transaction-store.ts`                  |
| **Responsibility**    | Manage transaction list with pagination and computed derivations |
| **NFR Mapping**       | NFR Performance §3.2 (computed properties, up to 1,000 items)    |
| **Computed**          | `transactionsByCategory`, `monthlySummary`                       |
| **Pagination**        | Cursor-based; `loadNextPage()` appends to list                   |
| **Refresh Model**     | Manual refresh only (Answer: C)                                  |
| **Error Granularity** | Single `error: APIError                                          | NetworkError | AuthError | null` field |

### 4.3 AccountStore

| Property           | Value                                       |
| ------------------ | ------------------------------------------- |
| **Component**      | AccountStore                                |
| **Location**       | `packages/core/src/stores/account-store.ts` |
| **Responsibility** | Manage account list and selection state     |
| **NFR Mapping**    | NFR Performance §3.2                        |

### 4.4 CategoryStore

| Property           | Value                                        |
| ------------------ | -------------------------------------------- |
| **Component**      | CategoryStore                                |
| **Location**       | `packages/core/src/stores/category-store.ts` |
| **Responsibility** | Manage category list                         |
| **NFR Mapping**    | NFR Performance §3.2                         |

### 4.5 ReportStore

| Property           | Value                                      |
| ------------------ | ------------------------------------------ |
| **Component**      | ReportStore                                |
| **Location**       | `packages/core/src/stores/report-store.ts` |
| **Responsibility** | Manage report data and selected period     |

### 4.6 UIStore

| Property           | Value                                                |
| ------------------ | ---------------------------------------------------- |
| **Component**      | UIStore                                              |
| **Location**       | `packages/core/src/stores/ui-store.ts`               |
| **Responsibility** | Manage local UI state only (modals, tabs, form data) |
| **NFR Mapping**    | Isolation — never triggers API calls                 |

---

## 5. Storage Port Components

### 5.1 ISecureStorage (Port)

| Property              | Value                                                                      |
| --------------------- | -------------------------------------------------------------------------- |
| **Component**         | ISecureStorage                                                             |
| **Location**          | `packages/core/src/storage/interfaces/secure-storage.ts`                   |
| **Responsibility**    | Token storage exclusively via platform secure storage                      |
| **NFR Mapping**       | NFR Security §1.1, §1.3; SB-02                                             |
| **Fail-Closed**       | Throws `StorageError` on any read/write failure                            |
| **Platform Adapters** | Keychain (iOS), Keystore (Android), sessionStorage (Web), OS keyring (CLI) |

### 5.2 ILocalSettings (Port)

| Property           | Value                                                     |
| ------------------ | --------------------------------------------------------- |
| **Component**      | ILocalSettings                                            |
| **Location**       | `packages/core/src/storage/interfaces/local-settings.ts`  |
| **Responsibility** | Non-sensitive settings storage (base URL, UI preferences) |
| **NFR Mapping**    | NFR Security §1.1; SB-01                                  |
| **Constraint**     | Never stores tokens or secrets                            |

---

## 6. Cross-Cutting Component Interactions

### 6.1 Request Flow

```
Client UI
    │
    ▼
Service Layer (e.g., TransactionService)
    │
    ├──► ValidationService (chain of validators) ──► ValidationError?
    │
    ▼
IFireflyIIIClient
    │
    ├──► HTTPS Enforcer ──► ValidationError if not HTTPS
    │
    ├──► Auth Gate (token injection from session cache)
    │
    ├──► Timeout Controller (AbortController, default 10s)
    │
    ├──► Retry Middleware (GET only, 1 retry, 500ms backoff)
    │
    ▼
native fetch (IHTTPAdapter)
    │
    ▼
Firefly III API
    │
    ▼
Response ──► ErrorHandlingService.categorize()
                │
                ├──► Internal Log (full details)
                └──► User-Facing Message (redacted)
```

### 6.2 Error Propagation Flow

```
API Error / Network Error
    │
    ▼
ErrorHandlingService.categorize()
    │
    ├──► 401 ──► AuthError ──► Clear token session cache ──► AuthStore.error
    │
    ├──► Network timeout ──► NetworkError ──► User-facing: "Connection timed out"
    │
    ├──► Validation failure ──► ValidationError ──► Field-level errors
    │
    ├──► Storage failure ──► StorageError ──► Fail-closed: block auth operations
    │
    └──► Other API error ──► APIError ──► User-facing: generic message
```

### 6.3 Token Flow

```
App Start
    │
    ▼
AuthenticationService.getValidToken()
    │
    ├──► Check session cache ──► Hit ──► Return token
    │
    └──► Miss ──► ISecureStorage.getToken()
                    │
                    ├──► Found ──► Cache in session memory ──► Return token
                    │
                    └──► Not found ──► AuthStore → unauthenticated

On 401 Response
    │
    ▼
Clear session cache ──► Re-read ISecureStorage ──► If null → unauthenticated

On Logout
    │
    ▼
Clear session cache ──► ISecureStorage.clear() ──► AuthStore → unauthenticated
```
