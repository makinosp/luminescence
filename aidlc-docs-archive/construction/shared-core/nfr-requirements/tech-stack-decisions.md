# Shared Core - Tech Stack Decisions

## Unit Context

- **Unit**: Unit 1 - Shared Core (`packages/core`)
- **Package Manager**: pnpm (workspace root)
- **Build Tool**: tsc (TypeScript compiler) + tsconfig for strictness

---

## 1. Language: TypeScript

### 1.1 Version

- **Target**: TypeScript 5.4+ (latest stable at time of development)
- **Module System**: ESM (`"type": "module"`)
- **Module Resolution**: `"bundler"` (compatible with pnpm, Vite, Node ESM)

### 1.2 Strictness Configuration

Clarification Q7 Answer A: Maximum strictness.

```jsonc
{
    "compilerOptions": {
        // Base strict mode
        "strict": true,

        // Additional strict flags (Q7: A)
        "noUncheckedIndexedAccess": true, // Array/object index access includes undefined
        "exactOptionalPropertyTypes": true, // Distinguish undefined from missing property
        "noImplicitReturns": true, // All code paths must return a value

        // Supporting flags
        "target": "ES2022",
        "module": "ESNext",
        "moduleResolution": "bundler",
        "declaration": true,
        "declarationMap": true,
        "sourceMap": true,
        "outDir": "./dist",
        "rootDir": "./src",
        "esModuleInterop": true,
        "skipLibCheck": true,
        "forceConsistentCasingInFileNames": true,
        "resolveJsonModule": true,
        "isolatedModules": true,
        "noEmit": false,
    },
    "include": ["src/**/*"],
    "exclude": ["**/*.test.ts", "**/*.spec.ts", "**/__tests__/**", "dist"],
}
```

### 1.3 Rationale

- `noUncheckedIndexedAccess`: Prevents a class of runtime errors common in financial calculations (e.g., accessing `accounts[0]` without null check).
- `exactOptionalPropertyTypes`: Critical for domain models where `{ amount: undefined }` and `{}` have different semantics (e.g., partial updates vs. new creation).
- `noImplicitReturns`: Ensures all function paths are explicit, reducing bugs in error handling branches.
- These flags add strictness at the cost of more explicit code — acceptable for a greenfield project where correctness is paramount (financial data).

---

## 2. State Management: MobX

### 2.1 Version

- **MobX**: 6.x (latest stable)
- **mobx-state-tree**: Not used — plain MobX with interfaces for simplicity

### 2.2 Rationale

- Selected in Application Design (Q3 Answer B).
- Reactive stores with `makeObservable` / `makeAutoObservable`.
- `computed` properties for derived data (category totals, monthly summaries).
- `action` methods for state mutations.
- `flow` for async operations (API calls).

### 2.3 Store Update Model

- Clarification Q2 Answer C: Simple concurrent handling, last-write-wins.
- Clarification Q5 Answer B: Up to 1,000 items per view, computed properties for derived data.
- Clarification Q6 Answer C (Functional Design): Manual refresh — stores hold data until user triggers refresh.

---

## 3. Testing: Vitest + fast-check

### 3.1 Test Runner: Vitest

- **Version**: 1.x (latest stable)
- **Rationale**: Native ESM support, TypeScript support out of the box, compatible with Vite ecosystem, fast HMR.

### 3.2 Property-Based Testing: fast-check

- **Version**: 3.x (latest stable)
- **Rationale**: NFR-12 mandates fast-check. Mature library, excellent TypeScript support, integrated with Vitest.
- **Scope** (Clarification Q4 Answer A): Full — all pure functions.

### 3.3 Test Configuration

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        globals: true,
        environment: "node",
        include: ["src/**/*.test.ts"],
        coverage: {
            provider: "v8",
            reporter: ["text", "lcov"],
            include: ["src/**/*.ts"],
            exclude: ["src/**/*.test.ts", "src/**/*.d.ts"],
        },
    },
});
```

### 3.4 Test Organization

```
packages/core/src/
├── domain-models/
│   ├── transaction/
│   │   ├── transaction.ts
│   │   ├── transaction.test.ts          // Example-based tests
│   │   ├── transaction.properties.ts    // Property-based tests
│   │   └── validators.ts
│   │       └── validators.properties.ts // PBT for validators
├── services/
│   ├── authentication-service.ts
│   └── authentication-service.test.ts
└── ...
```

---

## 4. HTTP Client: native fetch

### 4.1 Selection

Clarification Q8 Answer A: native fetch.

### 4.2 Rationale

- Zero additional dependencies — aligns with Security Baseline SB-05 (defense in depth).
- Supported on: React Native 2024+, Node.js 18+, all modern browsers.
- Retry middleware is implemented separately (Functional Design), making built-in retry redundant.
- Smallest bundle size for the web client.

### 4.3 Implementation Pattern

```typescript
// packages/core/src/api-client/fetch-adapter.ts
export class FetchAdapter implements IHTTPAdapter {
    async request<T>(config: RequestConfig): Promise<T> {
        const response = await fetch(config.url, {
            method: config.method,
            headers: config.headers,
            body: config.data ? JSON.stringify(config.data) : undefined,
            signal: config.signal, // AbortController for timeout
        });
        // ... error handling, response parsing
    }
}
```

---

## 5. Linting & Formatting

### 5.1 Linter: ESLint

- **Version**: 9.x (flat config)
- **Config**: `@typescript-eslint` strict rules + security-focused rules
- **Key Rules**:
    - `@typescript-eslint/no-explicit-any`: error (prevent loss of type safety)
    - `@typescript-eslint/no-unsafe-member-access`: error
    - `@typescript-eslint/strict-boolean-expressions`: error
    - `no-console`: warn (use structured logging instead)

### 5.2 Formatter: Prettier

- **Version**: 3.x
- **Config**: Single quotes, trailing commas, 2-space indent, 100 char line width

---

## 6. Package Dependencies Summary

### 6.1 Runtime Dependencies

| Package | Version | Purpose                   |
| ------- | ------- | ------------------------- |
| `mobx`  | ^6.13   | Reactive state management |

### 6.2 Dev Dependencies

| Package       | Version | Purpose                       |
| ------------- | ------- | ----------------------------- |
| `typescript`  | ^5.4    | Type checking and compilation |
| `vitest`      | ^1.6    | Test runner                   |
| `fast-check`  | ^3.4    | Property-based testing        |
| `eslint`      | ^9.1    | Linting                       |
| `prettier`    | ^3.2    | Formatting                    |
| `@types/node` | ^20.14  | Node.js type definitions      |

### 6.3 Zero Runtime Dependencies Goal

- The shared core aims for **minimal runtime dependencies**.
- Only `mobx` is required at runtime.
- All other functionality (HTTP, storage, validation) is implemented directly or through port interfaces.
- This reduces supply chain attack surface and simplifies dependency management.

---

## 7. Build Output

### 7.1 Output Structure

```
packages/core/dist/
├── index.js              # ESM entry point
├── index.d.ts            # Type declarations
├── api-client/
│   ├── firefly-client.js
│   └── firefly-client.d.ts
├── domain-models/
│   ├── transaction/
│   │   ├── transaction.js
│   │   └── transaction.d.ts
│   └── ...
└── ...
```

### 7.2 Package.json Exports

```jsonc
{
    "name": "@luminescence/core",
    "version": "0.1.0",
    "type": "module",
    "main": "./dist/index.js",
    "types": "./dist/index.d.ts",
    "exports": {
        ".": {
            "types": "./dist/index.d.ts",
            "import": "./dist/index.js",
        },
    },
    "scripts": {
        "build": "tsc",
        "dev": "tsc --watch",
        "test": "vitest run",
        "test:watch": "vitest",
        "test:coverage": "vitest run --coverage",
        "lint": "eslint src/",
        "format": "prettier --write src/",
    },
    "dependencies": {
        "mobx": "^6.13.0",
    },
}
```
