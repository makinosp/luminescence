# Unit of Work

## Unit Definitions

### Unit 1: Shared Core (`packages/core`)

**Responsibilities**:
- Domain models: Transaction, Account, Category, Report (immutable, pure logic)
- Validators: Amount, description, date, URL, token, transaction input
- Serializers: Firefly III API response parsing, request format conversion
- API Client (IFireflyIIIClient): All HTTP operations against Firefly III REST API
- Storage interfaces (Ports): ISecureStorage, ILocalSettings
- MobX Stores: AuthStore, TransactionStore, AccountStore, CategoryStore, ReportStore, UIStore
- Error Handling: Error types (APIError, NetworkError, ValidationError, StorageError, AuthError), categorization, optional retry middleware
- Services: AuthenticationService, TransactionService, AccountService, CategoryService, ReportService, ValidationService, ErrorHandlingService

**Contains all shared business logic. Zero platform dependencies.**

**Code Organization** (Hybrid Layering per Application Design Q6):
```
packages/core/src/
├── api-client/
│   ├── firefly-client.ts       # IFireflyIIIClient implementation
│   └── adapters/
│       ├── fetch-adapter.ts
│       └── axios-adapter.ts
├── domain-models/
│   ├── transactions/
│   │   ├── transaction.ts
│   │   ├── validators.ts
│   │   └── serializers.ts
│   ├── accounts/
│   │   ├── account.ts
│   │   └── validators.ts
│   ├── categories/
│   │   ├── category.ts
│   │   └── validators.ts
│   └── reports/
│       └── report.ts
├── stores/
│   ├── auth-store.ts
│   ├── transaction-store.ts
│   ├── account-store.ts
│   ├── category-store.ts
│   ├── report-store.ts
│   └── ui-store.ts
├── services/
│   ├── authentication-service.ts
│   ├── transaction-service.ts
│   ├── account-service.ts
│   ├── category-service.ts
│   ├── report-service.ts
│   ├── validation-service.ts
│   └── error-handling-service.ts
├── storage/
│   ├── interfaces/
│   │   ├── secure-storage.ts
│   │   └── local-settings.ts
│   └── adapters/
│       ├── keychain-adapter.ts (iOS)
│       ├── keystore-adapter.ts (Android)
│       ├── session-storage-adapter.ts (Web)
│       ├── keyring-adapter.ts (CLI)
│       ├── async-storage-adapter.ts (Mobile settings)
│       ├── local-storage-adapter.ts (Web settings)
│       └── json-config-adapter.ts (CLI settings)
└── errors/
    ├── error-types.ts
    ├── error-categorization.ts
    └── retry-middleware.ts
```

**Stories Covered**: US-01 through US-09, US-11 (shared logic portions)

---

### Unit 2: CLI Client (`packages/cli`)

**Responsibilities**:
- CLI framework using Commander.js (interactive + scriptable modes)
- KeyringSecureStorage adapter (OS keyring via keytar)
- JSONConfigAdapter for local settings
- Output formatting: table, JSON, CSV (--format flag)
- CLIService: command routing, exit codes (0/1/2)
- Interactive prompts via Commander.js

**Dependencies**: Unit 1 (Shared Core) via `workspace:*`

**Stories Covered**: US-07 (primary), US-01 through US-06, US-08, US-09 (CLI-specific UI)

---

### Unit 3: Web Client (`packages/web`)

**Responsibilities**:
- React SPA with MobX observer components
- SessionStorageAdapter for secure token storage (session scope)
- LocalStorageAdapter for non-sensitive settings (persistent)
- Responsive layout for desktop + tablet
- FetchAdapter (native fetch) for API communication
- Routing: transactions list, create/edit, accounts, categories, reports, settings

**Dependencies**: Unit 1 (Shared Core) via `workspace:*`

**Stories Covered**: US-10 excluded (mobile-specific), US-01 through US-06, US-08, US-09 (Web-specific UI)

---

### Unit 4: Mobile Client (`packages/mobile`)

**Responsibilities**:
- React Native app for iOS and Android
- KeychainSecureStorage adapter (iOS Keychain)
- KeystoreSecureStorage adapter (Android Keystore)
- AsyncStorageAdapter for non-sensitive settings
- Responsive mobile-first UI design
- Offline capability awareness (US-11)
- Axios or React Native fetch for API communication

**Dependencies**: Unit 1 (Shared Core) via `workspace:*`

**Stories Covered**: US-10, US-11 (primary), US-01 through US-06, US-08, US-09 (Mobile-specific UI)

---

## Execution Order

```
Phase 1: Unit 1 — Shared Core
  ↓ (core complete, published via workspace protocol)
Phase 2: Unit 2 — CLI Client (fastest E2E validation)
  ↓ (core validated via CLI)
Phase 3: Unit 3 — Web Client
  ↓ (core stable, UI implementation)
Phase 4: Unit 4 — Mobile Client
  ↓ (all prior validation, most complex UI)
```

Units 2-4 can be developed in parallel if needed, but sequential CLI → Web → Mobile is recommended for risk reduction.
