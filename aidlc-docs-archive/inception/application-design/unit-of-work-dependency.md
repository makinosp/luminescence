# Unit of Work Dependency Matrix

## Dependency Graph

```
┌──────────────────────────────────────────────────────────┐
│                    Unit 1: Shared Core                   │
│  (No internal dependencies — pure business logic)        │
└────────────┬──────────────────────┬──────────────────────┘
             │                      │
             ▼                      ▼
┌────────────────────┐   ┌────────────────────┐
│   Unit 2: CLI      │   │   Unit 3: Web      │
│   Dependency:      │   │   Dependency:      │
│   - Unit 1 (core)  │   │   - Unit 1 (core)  │
│   - keytar (OS)    │   │   - sessionStorage │
│   - Commander.js   │   │   - React          │
└────────────────────┘   └────────────────────┘
             │                      │
             │                      │
             ▼                      ▼
             ┌──────────────────────┐
             │   Unit 4: Mobile     │
             │   Dependency:        │
             │   - Unit 1 (core)    │
             │   - Keychain/Keystore│
             │   - React Native     │
             └──────────────────────┘
```

## Dependency Matrix

| Unit               | Depends On | Nature         | Interface                                 |
| ------------------ | ---------- | -------------- | ----------------------------------------- |
| **1. Shared Core** | None       | Self-contained | Exports via `@luminescence/core`          |
| **2. CLI**         | Unit 1     | Runtime        | `workspace:*` protocol → import from core |
| **3. Web**         | Unit 1     | Runtime        | `workspace:*` protocol → import from core |
| **4. Mobile**      | Unit 1     | Runtime        | `workspace:*` protocol → import from core |

## Shared Dependencies (across all units)

| Dependency        | Version Strategy                     | Notes                                     |
| ----------------- | ------------------------------------ | ----------------------------------------- |
| TypeScript        | workspace root `tsconfig.json`       | Unified config for all packages           |
| MobX              | Shared via core                      | All stores in core; UI components consume |
| ESLint / Prettier | workspace root config                | Single code style across monorepo         |
| Jest / Vitest     | Per-package with workspace root base | Shared test utilities in core             |

## Dependency Rules

1. **No circular dependencies** — Core never depends on any client package
2. **No client-to-client dependencies** — CLI, Web, Mobile are independent of each other
3. **Unidirectional** — All dependency arrows point toward core (inward)
4. **Interface-based** — Clients depend on core interfaces, not concrete implementations (Ports & Adapters)
5. **Lock file** — Single `pnpm-lock.yaml` at workspace root (NFR-08)
