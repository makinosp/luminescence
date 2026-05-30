# Components

## Shared Core Library Components

### 1. API Client Module (`api-client/`)

**Responsibility**: Handle all Firefly III API communication with standardized error handling and retry logic.

**Component Interface (Port)**:
```typescript
interface IFireflyIIIClient {
  // Configuration
  setBaseURL(url: string): void;
  setToken(token: string): void;
  
  // Transactions
  getTransactions(params: ListParams): Promise<TransactionList>;
  getTransaction(id: string): Promise<Transaction>;
  createTransaction(data: CreateTransactionInput): Promise<Transaction>;
  updateTransaction(id: string, data: UpdateTransactionInput): Promise<Transaction>;
  deleteTransaction(id: string): Promise<void>;
  
  // Accounts
  getAccounts(params: ListParams): Promise<AccountList>;
  getAccount(id: string): Promise<Account>;
  
  // Categories
  getCategories(params: ListParams): Promise<CategoryList>;
  getCategory(id: string): Promise<Category>;
  
  // Reports
  getReport(type: ReportType, params: ReportParams): Promise<ReportData>;
}
```

**Key Features**:
- Optional retry on 5xx and network errors (configurable; clients opt in via retry middleware)
- Centralized error categorization
- Request/response logging with secrets redacted (SB-04)
- TLS 1.2+ enforcement (NFR-01)

---

### 2. Domain Models Module (`domain-models/`)

**Responsibility**: Define business objects and validation rules for transactions, accounts, categories, and reports.

**Sub-components**:

#### 2.1 Transaction Domain
- Model: `Transaction` (immutable)
- Validators: `validateTransactionInput()`, `validateAmount()`, `validateDate()`
- Serializers: `toFireflyIIIFormat()`, `fromFireflyIIIResponse()`
- Business Logic: Transaction type rules, account consistency

#### 2.2 Account Domain
- Model: `Account` (immutable)
- Validators: `validateAccountInput()`
- Serializers: Account conversion
- Business Logic: Balance calculations, account type constraints

#### 2.3 Category Domain
- Model: `Category` (immutable)
- Validators: Category input validation
- Serializers: Category conversion
- Business Logic: Spending aggregation by category

#### 2.4 Report Domain
- Model: `Report` (read-only analytics data)
- Validators: Report parameter validation
- Serializers: Report data conversion
- Business Logic: Spending trend analysis, budget comparison

**Key Features**:
- Pure domain logic (no I/O, no side effects) → Property-Based Testing suitable
- Immutable models for predictability
- Centralized validation (SB-03)
- Serialization round-trips covered by PBT

---

### 3. Secure Storage Module (`storage/`)

**Responsibility**: Abstract platform-specific secure and local storage behind unified interfaces.

**Interfaces (Ports)**:

#### 3.1 SecureStorage (Port)
```typescript
interface ISecureStorage {
  setToken(key: string, value: string): Promise<void>;
  getToken(key: string): Promise<string | null>;
  removeToken(key: string): Promise<void>;
  clear(): Promise<void>;
}
```

**Adapters**:
- `KeychainSecureStorage` (iOS) — Keychain framework
- `KeystoreSecureStorage` (Android) — Android Keystore
- `SessionStorageAdapter` (Web) — Browser sessionStorage
- `KeyringSecureStorage` (CLI) — OS keyring via keytar

#### 3.2 LocalSettings (Port)
```typescript
interface ILocalSettings {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
}
```

**Adapters**:
- `AsyncStorageAdapter` (Mobile) — React Native AsyncStorage
- `LocalStorageAdapter` (Web) — Browser localStorage
- `JSONConfigAdapter` (CLI) — `~/.config/luminescence/config.json`

**Key Features**:
- Tokens never stored in non-secure locations (SB-02, NFR-02)
- Platform-appropriate mechanisms for each client (CA-06)
- Fail-closed if storage unavailable (NFR-07)

---

### 4. MobX Stores Module (`stores/`)

**Responsibility**: Centralized reactive state management with automatic change tracking.

**Components**:

#### 4.1 AuthStore
- **State**: isConfigured, baseURL, isTokenValid
- **Methods**: configureServer(), logout(), validateToken()
- **Responsibility**: Authentication state, token freshness, configuration validation
- **Security**: Collaborates with SecureStorage; never logs tokens (SB-04)

#### 4.2 TransactionStore
- **State**: transactions[], isLoading, error
- **Methods**: loadTransactions(), createTransaction(), updateTransaction(), deleteTransaction()
- **Responsibility**: Transaction CRUD and list state
- **Reactivity**: Auto-updates UI when transactions[] changes

#### 4.3 AccountStore
- **State**: accounts[], isLoading, error
- **Methods**: loadAccounts(), selectAccount()
- **Responsibility**: Account data and selection state

#### 4.4 CategoryStore
- **State**: categories[], isLoading, error
- **Methods**: loadCategories()
- **Responsibility**: Category list and filtering

#### 4.5 ReportStore
- **State**: reports[], selectedPeriod, isLoading
- **Methods**: loadReport(), selectPeriod()
- **Responsibility**: Report data and period selection

#### 4.6 UIStore
- **State**: isModalOpen, activeTab, formData
- **Methods**: openModal(), closeModal(), switchTab(), updateFormData()
- **Responsibility**: Local UI state (does not persist between sessions)

**Key Features**:
- Automatic subscriber notification (SwiftUI-like)
- No manual setState calls (MobX handles it)
- Separation of concerns: Auth, domain stores, UI store
- Security Baseline compliance: Auth store isolated (NFR-06)

---

### 5. Error Handling Module (`errors/`)

**Responsibility**: Centralized error categorization and user-friendly messaging.

**Components**:

#### 5.1 Error Types
- `APIError` — HTTP status code + message
- `NetworkError` — Connection failure
- `ValidationError` — User input invalid
- `StorageError` — Local/secure storage failure
- `AuthError` — Token invalid/expired

#### 5.2 Error Categorization
- Map error to category (network vs auth vs validation)
- Extract safe message for user (no tokens, paths, internals)
- Determine retry-ability

#### 5.3 Retry Middleware
- Optional middleware clients apply
- Exponential backoff (configurable)
- Max retry attempts (default 3)
- Non-idempotent operations not retried automatically (US-08, SB-04)

**Key Features**:
- User-friendly error messages (FR-14, US-08)
- Secrets never logged (SB-04, NFR-03)
- Safe for CLI scripting: deterministic error codes (AC7-03)

---

## Platform-Specific Adapter Components

### Mobile Client Adapters (React Native)

**Secure Storage Adapter**:
- Wraps Keychain (iOS) / Keystore (Android)
- Implements `ISecureStorage` interface

**Local Settings Adapter**:
- Wraps AsyncStorage
- Implements `ILocalSettings` interface

**HTTP Adapter** (optional):
- Wraps React Native fetch or axios
- Adds mobile-specific request headers

### Web Client Adapters (SPA)

**Secure Storage Adapter**:
- Wraps sessionStorage (cleared on tab close)
- Implements `ISecureStorage` interface
- Never uses localStorage for tokens (SB-02)

**Local Settings Adapter**:
- Wraps localStorage
- Implements `ILocalSettings` interface

**HTTP Adapter** (optional):
- Wraps native fetch
- Adds CORS headers, browser-specific handling

### CLI Adapters (Node.js)

**Secure Storage Adapter**:
- Wraps OS keyring (keytar library)
- Implements `ISecureStorage` interface

**Local Settings Adapter**:
- Wraps JSON config at `~/.config/luminescence/config.json`
- Implements `ILocalSettings` interface

**CLI Framework Adapter**:
- Wraps Commander.js
- Supports both interactive and scriptable modes (US-07)

---

## Design Validation

### Security Baseline Compliance
- ✅ SB-01: Non-sensitive settings use platform storage
- ✅ SB-02: Tokens only in secure storage (or sessionStorage for Web)
- ✅ SB-03: Client-side validation in domain-models
- ✅ SB-04: Error messages redact secrets
- ✅ SB-05: Defense-in-depth via component isolation

### Property-Based Testing Alignment
- ✅ PBT-REQ-01: Domain models & serialization suitable for PBT
- ✅ PBT-REQ-02: Validators model realistic domain constraints
- ✅ PBT-REQ-03: Stores use example-based tests for critical flows

### Component Responsibilities
- Each component has a single, clear responsibility
- Ports provide abstraction for testing and platform adaptation
- Security-critical logic isolated (Auth, Secure Storage)
- Domain logic decoupled from I/O and platform concerns
