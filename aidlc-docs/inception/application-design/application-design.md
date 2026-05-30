# Application Design

## Architecture Overview

Luminescence is a multi-client TypeScript application suite for Firefly III with a shared core library and platform-specific clients (Mobile/React Native, Web/SPA, CLI).

### Architecture Pattern: Ports & Adapters (Hexagonal)

The shared core defines interfaces (ports) for platform-specific functionality. Each client implements adapters for its platform:

```
┌─────────────────────────────────────────────────────────────┐
│                    SHARED CORE                              │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Domain Models & Business Logic            │  │
│  │  - Transactions, Accounts, Categories, Reports     │  │
│  │  - Validation, Serialization, Domain Rules         │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ▲                                   │
│         ┌────────────────┼────────────────┐                │
│         │                │                │                │
│  ┌──────┴─────┐  ┌──────┴──────┐  ┌─────┴──────┐         │
│  │ API Client │  │   Storage   │  │ Error      │         │
│  │  (Port)    │  │   (Port)    │  │ Types      │         │
│  └────────────┘  └─────────────┘  └────────────┘         │
└──────────────────────┬──────────────────┬──────────────────┘
                       │                  │
        ┌──────────────┼──────────────────┼──────────────┐
        │              │                  │              │
   ┌────▼────┐  ┌─────▼────┐    ┌───────▼────┐  ┌────▼────┐
   │ Mobile  │  │   Web    │    │    CLI     │  │ MobX    │
   │Adapter  │  │ Adapter  │    │  Adapter   │  │Stores   │
   └─────────┘  └──────────┘    └────────────┘  └─────────┘
   (Keychain)   (SessionStore)  (Keyring)      (Reactive UI)
```

### Packaging Structure: Monorepo

Single npm workspace with multiple packages:

```
luminescence/
├── packages/
│   ├── core/                    # Shared core library
│   │   ├── src/
│   │   │   ├── api-client/      # Firefly III HTTP client
│   │   │   ├── domain-models/   # Business objects
│   │   │   ├── storage/         # Secure/local storage interfaces
│   │   │   ├── stores/          # MobX reactive stores
│   │   │   ├── errors/          # Error types & handlers
│   │   │   └── validation/      # Domain validation
│   │   └── package.json
│   ├── mobile/                  # React Native iOS/Android
│   │   └── package.json
│   ├── web/                     # Web SPA
│   │   └── package.json
│   └── cli/                     # Node.js CLI
│       └── package.json
├── package.json                 # Workspace root
└── pnpm-workspace.yaml          # pnpm workspaces config
```

### State Management: MobX + Domain Stores

MobX provides SwiftUI-like reactivity with automatic change tracking:

- **Reactive Stores**: TransactionStore, AccountStore, CategoryStore, ReportStore, AuthStore, UIStore
- **Automatic Re-render**: Components automatically re-render when observed properties change
- **Unified API**: Consistent store API across Mobile, Web, and CLI
- **Security Layering**: Auth and SecureStorage stores isolated for NFR-06 compliance

### Platform Adapters

**Mobile (iOS/Android)**:
- Secure storage: Keychain (iOS) / Keystore (Android)
- Non-sensitive settings: AsyncStorage
- HTTP: React Native fetch or axios

**Web**:
- Secure storage: sessionStorage (browser session only, cleared on tab close)
- Non-sensitive settings: localStorage
- HTTP: native fetch

**CLI**:
- Secure storage: OS keyring (via keytar or equivalent)
- Non-sensitive settings: JSON config file at `~/.config/luminescence/config.json`
- HTTP: native Node.js fetch + Commander.js CLI framework

### Error Handling & Retry Strategy

**Shared Core Defines**:
- Error types: APIError, NetworkError, ValidationError, StorageError, AuthError
- Error categorization and user-friendly messages
- Optional retry middleware (clients choose to apply)

**Per-Client Application**:
- Mobile/Web: Apply retry middleware for transient errors
- CLI: Optional `--retry` flag; script can implement own retry logic
- Security: All error messages redact tokens, paths, and internal details (SB-04, US-08)

### Component Grouping: Hybrid Layer Strategy

**Architectural Layers** (top-level):
```
├── api-client/            # Firefly III HTTP communication
│   ├── types.ts
│   ├── client.ts
│   └── error-handler.ts
├── domain-models/         # Business objects & types
│   ├── transaction/
│   ├── account/
│   ├── category/
│   └── report/
├── storage/               # Secure & local storage abstraction
│   ├── secure-storage.ts  # Port interface
│   ├── local-settings.ts  # Port interface
│   └── error-types.ts
├── stores/                # MobX reactive state management
│   ├── auth-store.ts      # Authentication & token
│   ├── transaction-store.ts
│   ├── account-store.ts
│   ├── category-store.ts
│   ├── report-store.ts
│   └── ui-store.ts        # Local UI state
└── errors/                # Centralized error handling
    ├── error-types.ts
    ├── error-categorization.ts
    └── retry-middleware.ts
```

**Within Each Layer**: Domain features are grouped for better visibility:
- `domain-models/transaction/` → Transaction model, validators, serializers
- `domain-models/account/` → Account model, account-specific logic
- `stores/` → One store per business domain

### Extension Compliance

**Security Baseline (Full Enforcement)**:
- SB-01: Non-sensitive settings in AsyncStorage (Mobile) / localStorage (Web) / JSON config (CLI)
- SB-02: Tokens in secure storage only (Keychain/Keystore/Keyring/sessionStorage)
- SB-03: Client-side URL & input validation before API submission
- SB-04: Error messages and logs redact secrets
- SB-05: Defense-in-depth: validation + secure storage + fail-closed error handling

**Property-Based Testing (Partial Enforcement)**:
- PBT-REQ-01: Apply to pure domain logic and serialization round-trips
- PBT-REQ-02: Use fast-check with realistic domain constraints
- PBT-REQ-03: Complement (not replace) example-based tests for critical flows

## Key Design Decisions

| Decision                                | Rationale                                                                                                             |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Ports & Adapters**                    | Enforces security separation (NFR-06); maximizes testability; supports Property-Based Testing                         |
| **Monorepo**                            | Enables rapid cross-client iteration; shared dependency management; unified lock file (NFR-08)                        |
| **MobX Stores**                         | SwiftUI-like reactivity; automatic change tracking; unified API across platforms; supports Security Baseline layering |
| **Shared Error Types + Optional Retry** | Balances DRY principle with per-client flexibility; enforces SB-04 in shared code; each client chooses retry strategy |
| **Hybrid Layer Organization**           | Top-level layers enforce Security Baseline isolation; domain features within layers improve code visibility           |

## Next Phases

1. **Units Generation**: Decompose into testable units of work (Shared Core, Mobile, Web, CLI)
2. **Functional Design** (per-unit): Detailed domain logic and data flow
3. **NFR Design** (per-unit): Security patterns, error handling, test setup
4. **Code Generation**: Implement all units with full test coverage
