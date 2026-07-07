# Component Dependencies

## Dependency Graph

### Shared Core Component Dependencies

```
┌─────────────────────────────────────────────────────────────┐
│                   SHARED CORE LIBRARY                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Highest Level (Orchestration)                              │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Service Layer                          │   │
│  │  - AuthenticationService                            │   │
│  │  - TransactionService                               │   │
│  │  - AccountService                                   │   │
│  │  - CategoryService                                  │   │
│  │  - ReportService                                    │   │
│  │  - ValidationService                                │   │
│  │  - ErrorHandlingService                             │   │
│  └─────┬──────────────────────────────────────────┬───┘   │
│        │                                          │        │
│  ┌─────▼─────────┬──────────────┬────────────┬──┴───┐    │
│  │               │              │            │      │    │
│  │  Middle Layer │              │            │      │    │
│  │  ─────────────┴──────────────┴────────────┴──────┘    │
│  │                                                      │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │   │
│  │  │ API Client   │  │ MobX Stores  │  │ Error     │ │   │
│  │  │              │  │              │  │ Handling  │ │   │
│  │  │ Port:        │  │ - AuthStore  │  │           │ │   │
│  │  │ IFirefly     │  │ - Trans...   │  │ Error     │ │   │
│  │  │ IIIClient    │  │ - Account... │  │ Types &   │ │   │
│  │  │              │  │ - Category.. │  │ Categoriz │ │   │
│  │  │ Adapters:    │  │ - ReportS... │  │ -ation    │ │   │
│  │  │ Native fetch │  │ - UIStore    │  │ - Retry   │ │   │
│  │  │ (Web, CLI)   │  │              │  │ Middleware│ │   │
│  │  │ Axios (Mobile)   │              │  │           │ │   │
│  │  └──────┬───────┘  └──────┬───────┘  └─────┬─────┘ │   │
│  │         │                 │                │       │   │
│  └─────────┼─────────────────┼────────────────┼───────┘   │
│            │                 │                │           │
│  ┌─────────▼─────────────────▼────────────────▼───────┐   │
│  │          Low Level (Domain & Infrastructure)       │   │
│  │  ─────────────────────────────────────────────────  │   │
│  │                                                    │   │
│  │  ┌──────────────────┐  ┌──────────────────────┐ │   │
│  │  │ Domain Models    │  │ Storage Layer        │ │   │
│  │  │                  │  │                      │ │   │
│  │  │ - Transaction    │  │ Port:                │ │   │
│  │  │   - Validators   │  │ - ISecureStorage     │ │   │
│  │  │   - Serializers  │  │ - ILocalSettings     │ │   │
│  │  │ - Account        │  │                      │ │   │
│  │  │ - Category       │  │ Adapters:            │ │   │
│  │  │ - Report         │  │ - Keychain (iOS)     │ │   │
│  │  │                  │  │ - Keystore (Android) │ │   │
│  │  │ (Pure domain     │  │ - SessionStore (Web) │ │   │
│  │  │  logic, no I/O)  │  │ - Keyring (CLI)      │ │   │
│  │  │                  │  │ - AsyncStorage       │ │   │
│  │  │                  │  │ - localStorage       │ │   │
│  │  │                  │  │ - JSON config        │ │   │
│  │  └──────────────────┘  └──────────────────────┘ │   │
│  │                                                    │   │
│  └────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Dependency Matrix

### Service Layer Dependencies

| Service                   | Depends On                                                                                         | Purpose                                |
| ------------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------- |
| **AuthenticationService** | IFireflyIIIClient, ISecureStorage, ILocalSettings, AuthStore, ValidationService                    | Token management, connectivity check   |
| **TransactionService**    | IFireflyIIIClient, TransactionStore, ValidationService, ErrorHandlingService, Transaction (domain) | CRUD operations, validation            |
| **AccountService**        | IFireflyIIIClient, AccountStore, Account (domain)                                                  | Account queries, filtering             |
| **CategoryService**       | IFireflyIIIClient, CategoryStore, TransactionService                                               | Category queries, spending aggregation |
| **ReportService**         | IFireflyIIIClient, ReportStore, TransactionService, CategoryService                                | Report generation, trend analysis      |
| **ValidationService**     | Transaction, Account, Category (validators only)                                                   | Input sanitization                     |
| **ErrorHandlingService**  | None (pure functions)                                                                              | Error categorization, messaging        |

### Component Dependencies

| Component                    | Depends On                                       | Reason                                |
| ---------------------------- | ------------------------------------------------ | ------------------------------------- |
| **AuthStore**                | ISecureStorage, ILocalSettings                   | Token & URL persistence               |
| **TransactionStore**         | IFireflyIIIClient, Transaction (domain)          | Load/update transactions              |
| **AccountStore**             | IFireflyIIIClient, Account (domain)              | Load accounts                         |
| **CategoryStore**            | IFireflyIIIClient, Category (domain)             | Load categories                       |
| **ReportStore**              | IFireflyIIIClient                                | Load report data                      |
| **UIStore**                  | None (local state only)                          | UI state management                   |
| **IFireflyIIIClient (impl)** | ISecureStorage (for token), ErrorHandlingService | Token retrieval, error categorization |
| **Transaction (validators)** | None (pure)                                      | Domain validation only                |
| **Account (validators)**     | None (pure)                                      | Domain validation only                |

---

## Communication Patterns

### 1. Service → Component → Store

**Example**: TransactionService.createTransaction()

```
1. TransactionService.createTransaction(input)
   │
   ├─→ ValidationService.validateTransactionInput(input)
   │   └─→ Transaction.validateTransactionInput() [pure]
   │       Returns: { isValid, errors? }
   │
   ├─→ IFireflyIIIClient.createTransaction(input)
   │   └─→ Makes HTTP POST request
   │       Returns: Transaction object from API
   │
   ├─→ ErrorHandlingService.categorizeError() [on error]
   │   └─→ Returns: Error category & user message
   │
   └─→ TransactionStore.createTransaction(transaction)
       └─→ @action mutation: adds to transactions[]
           Triggers: Automatic re-render (MobX)
```

### 2. Component (UI) → Store (Observable)

**Example**: React component using MobX store

```
export const TransactionList = observer(() => {
  const store = useContext(TransactionStoreContext);

  // Component subscribes to changes
  return (
    <div>
      {store.transactions.map(t => <TransactionRow key={t.id} tx={t} />)}
    </div>
  );
});

// When store.transactions changes (via service.createTransaction):
// 1. MobX detects mutation
// 2. Component automatically re-renders
// 3. UI shows new transaction
```

### 3. Platform Adapter Pattern

**Example**: Secure Storage Adapter

```
Service Layer:
  AuthenticationService.configureServer(baseURL, token)
    │
    ├─→ ISecureStorage.setToken("ff3-token", token)
    │
    └─→ Implementation (Platform-specific):

    ┌──────────────────────────────────────────────┐
    │ Mobile:                                      │
    │ KeychainSecureStorage.setToken()             │
    │   └─→ Keychain.set() (iOS)                   │
    │   └─→ Keystore.put() (Android)               │
    │                                              │
    │ Web:                                         │
    │ SessionStorageAdapter.setToken()             │
    │   └─→ sessionStorage.setItem()               │
    │                                              │
    │ CLI:                                         │
    │ KeyringSecureStorage.setToken()              │
    │   └─→ keytar.setPassword()                   │
    └──────────────────────────────────────────────┘
```

### 4. Error Propagation Pattern

**Example**: Error handling with retry

```
TransactionService.createTransaction()
  │
  ├─→ IFireflyIIIClient.createTransaction()
  │   │
  │   └─→ fetch() fails → Throws APIError
  │       │
  │       ├─→ ErrorHandlingService.categorizeError()
  │       │   └─→ Returns: { category: 'network', isRetryable: true }
  │       │
  │       └─→ If retryable && attempts < 3:
  │           └─→ Wait (exponential backoff)
  │           └─→ Retry request
  │
  └─→ If finally fails:
      └─→ ErrorHandlingService.getUserMessage(category)
          └─→ "Unable to connect. Check your internet."
          └─→ UI displays message (no secrets exposed)
```

---

## Data Flow Patterns

### 1. Configuration Flow

```
User Input (URL, Token)
  ↓
AuthenticationService.configureServer()
  ↓
├─ Validation: ValidationService.validateServerURL()
├─ Validation: ValidationService.validateToken()
├─ Connectivity: IFireflyIIIClient.validateConnectivity()
├─ Storage: ISecureStorage.setToken()
├─ Storage: ILocalSettings.set(baseURL)
└─ State: AuthStore.configureServer()
  ↓
AuthStore observable changes
  ↓
UI components (observer) auto-update
```

### 2. Transaction Display Flow

```
User navigates to Transactions screen
  ↓
TransactionService.getTransactions() [fired by useEffect/reaction]
  ↓
IFireflyIIIClient.getTransactions()
  ↓
TransactionStore.loadTransactions() [@action mutation]
  ↓
TransactionStore.transactions[] changes
  ↓
React component (observer) auto-re-renders
  ↓
UI displays transaction list
```

### 3. Error Handling Flow

```
Any operation fails
  ↓
Error bubbles up to service layer
  ↓
ErrorHandlingService.categorizeError()
  ↓
├─ Categorize: network | auth | validation | api | storage
├─ Log: ErrorHandlingService.logError() [secrets redacted]
└─ Get message: ErrorHandlingService.getUserMessage()
  ↓
UI displays user-friendly message
```

---

## Coupling Analysis

### Low Coupling Areas ✅

- Domain models (Transaction, Account) have no external dependencies
- ValidationService uses only domain model validators
- ErrorHandlingService is purely functional (no state)
- Storage adapters are isolated behind interfaces

### Moderate Coupling Areas ⚠️

- Services depend on multiple components (necessary for orchestration)
- MobX Stores depend on IFireflyIIIClient (needed for data loading)
- AuthenticationService coordinates multiple layers (by design)

### Tight Coupling Avoided ✅

- Domain models don't know about services
- Services don't directly depend on UI components
- Storage adapters don't leak platform concerns to shared core
- Each client (Mobile, Web, CLI) has its own adapter implementations

---

## Dependency Injection Strategy

### Constructor Injection (Services)

```typescript
class TransactionService {
    constructor(
        private client: IFireflyIIIClient,
        private store: TransactionStore,
        private validation: IValidationService,
        private errorHandling: IErrorHandlingService,
    ) {}
}
```

### Context/Provider Injection (React Components)

```typescript
export const TransactionStoreContext = React.createContext<TransactionStore | null>(null);

const useTransactionStore = () => {
    const store = useContext(TransactionStoreContext);
    if (!store) throw new Error("TransactionStore not provided");
    return store;
};
```

### Factory Pattern (Adapters)

```typescript
interface StorageFactory {
    createSecureStorage(): ISecureStorage;
    createLocalSettings(): ILocalSettings;
}

// Platform implementations:
class IOSStorageFactory implements StorageFactory {
    createSecureStorage() {
        return new KeychainSecureStorage();
    }
    createLocalSettings() {
        return new AsyncStorageAdapter();
    }
}
```

---

## Testing Strategy by Dependency Level

### Level 1: Domain Models (No Dependencies)

- **Test**: Pure property-based tests
- Example: `Transaction.validateTransactionInput()` with fast-check
- No mocking needed

### Level 2: Pure Functions (ValidationService, ErrorHandlingService)

- **Test**: Property-based tests + example-based
- Example: `ErrorHandlingService.categorizeError()` for all error types
- No mocking needed

### Level 3: Services (Multiple Dependencies)

- **Test**: Example-based integration tests
- Mock: IFireflyIIIClient, Stores, ValidationService
- Example: TransactionService.createTransaction() with mock client

### Level 4: Stores (External Dependencies)

- **Test**: Example-based with mock IFireflyIIIClient
- Mock: IFireflyIIIClient
- Example: TransactionStore.loadTransactions() → updates state

### Level 5: UI Components (Store Dependencies)

- **Test**: React Testing Library with mock stores
- Mock: All services and stores
- Example: TransactionList renders transactions from store

---

## Summary: Dependency Boundaries

| Boundary                                                                | Purpose                     | Enforcement                 |
| ----------------------------------------------------------------------- | --------------------------- | --------------------------- |
| **Port Interfaces** (IFireflyIIIClient, ISecureStorage, ILocalSettings) | Platform abstraction        | Interface-based DI          |
| **Domain Models**                                                       | Pure business logic         | No external dependencies    |
| **Services**                                                            | Orchestration & composition | Injected dependencies       |
| **Stores**                                                              | Reactive state              | Only domain models + ports  |
| **Adapters**                                                            | Platform-specific           | Implementation per platform |

**Key Principle**: Shared core has zero platform dependencies. All platform concerns are isolated in adapter implementations.
