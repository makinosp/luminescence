# Shared Core - NFR Design Plan

## Unit Context
- **Unit**: Unit 1 - Shared Core (`packages/core`)
- **Responsibilities**: Domain models, validators, serializers, API client, storage interfaces, MobX stores, error handling, services
- **NFR Requirements**: 7 categories defined (security, reliability, performance, maintainability, availability, usability, extension compliance)
- **Tech Stack**: TypeScript 5.4+ (max strict), MobX 6.x, Vitest + fast-check, native fetch

## Design Steps

### Step 1: Analyze NFR Requirements for Design Patterns
- [x] Read nfr-requirements.md — 7 NFR categories with specific requirements
- [x] Read tech-stack-decisions.md — TypeScript, MobX, Vitest, fast-check, native fetch
- [x] Read functional design artifacts — existing service, store, API client, error handling patterns
- [x] Identify pattern incorporation points

### Step 2: Identify NFR Design Categories
- [x] Resilience — retry middleware, error recovery, fail-closed behavior
- [x] Security — redaction, token isolation, input validation, module isolation
- [x] Performance — computed properties, pagination, serialization
- [x] Maintainability — PBT test patterns, strict TypeScript, code organization
- [x] Logical Components — error redaction pipeline, validation pipeline, auth gate

### Step 3: Generate Clarification Questions
- [x] Created 8 questions covering resilience, security, performance, maintainability, and logical components

### Step 4: Store Plan
- [x] Saved to aidlc-docs/construction/plans/shared-core-nfr-design-plan.md

### Step 5: Collect and Analyze Answers
- [x] All 8 questions answered by user
- [x] No ambiguities detected — all answers are specific and actionable
- [x] Tech stack note: ESLint replaced with oxlint (Rust-based, fast, React Native + Expo compatible)

### Step 6: Generate NFR Design Artifacts
- [ ] nfr-design-patterns.md
- [ ] logical-components.md

### Step 7: Present Completion Message
- [ ] Present to user for review

### Step 8: Wait for Explicit Approval
- [ ] Awaiting user approval

### Step 9: Record Approval and Update Progress
- [ ] Update audit.md and aidlc-state.md

---

## Clarification Questions

### Q1: Circuit Breaker for API Calls
When the Firefly III server is unreachable after retries, should the shared core implement a circuit breaker pattern to temporarily stop sending requests?

A) **Yes, simple circuit breaker** — After 3 consecutive failures, stop requests for 30 seconds; then allow one probe request  
B) **No circuit breaker** — Let each call fail independently; the client UI handles offline indicators  
C) **Yes, with exponential backoff** — After failures, increase delay between requests exponentially (up to 60s)  

**Answer**: [Answer]: B

---

### Q2: Error Redaction Scope
Should error redaction apply to all error messages including those logged internally for debugging, or only to errors surfaced to the user?

A) **All errors** — Redact sensitive data from ALL error messages, including internal logs (SB-04 strict mode)  
B) **User-facing only** — Internal logs may contain full error details (URLs, stack traces) for debugging; only user-facing messages are redacted  
C) **Configurable** — Redaction level is configurable per environment (strict in development, relaxed in production debugging)  

**Answer**: [Answer]: B

---

### Q3: Token In-Memory Lifetime
After retrieving a token from secure storage, how long should it be held in memory for API calls?

A) **Per-request** — Retrieve token from secure storage for each API call; never cache in memory  
B) **Session cache** — Cache token in memory for the session; refresh only on 401 or logout  
C) **Short-lived cache** — Cache token in memory for 5 minutes; re-fetch from secure storage after expiry  

**Answer**: [Answer]: B

---

### Q4: PBT Test Organization
How should property-based tests be organized relative to the code they test?

A) **Co-located** — `transaction.properties.ts` next to `transaction.ts` in the same directory  
B) **Separate test directory** — All PBT files in a dedicated `__properties__/` directory alongside `__tests__/`  
C) **Single PBT file per module** — One `domain.properties.ts` file per domain module containing all PBT for that module  

**Answer**: [Answer]: B

---

### Q5: MobX Store Error State Granularity
How granular should error states be in MobX stores when an API call fails?

A) **Single error field** — One `error: AppError | null` per store; all error types map to this field  
B) **Per-operation error fields** — Separate error fields per operation: `loadError`, `createError`, `updateError`, `deleteError`  
C) **Error map** — A `Map<operation, AppError>` for fine-grained error tracking per entity and operation  

**Answer**: [Answer]: A

---

### Q6: Validation Pipeline Pattern
How should the validation pipeline be structured for transaction/account/category creation and updates?

A) **Single validator function** — One `validateTransaction()` function that returns all errors at once  
B) **Chain of validators** — Composable validator functions (e.g., `validateAmount().then(validateDate()).then(validateAccounts())`)  
C) **Validation middleware** — Validation as middleware in the service layer; each service composes its own validation chain  

**Answer**: [Answer]: B

---

### Q7: API Client Timeout Configuration
What should be the default timeout for Firefly III API requests?

A) **5 seconds** — Aggressive timeout; fail fast and show error  
B) **10 seconds** — Balanced; accommodates slower self-hosted servers  
C) **30 seconds** — Generous; prioritize successful response over fast failure  
D) **Configurable** — Default 10 seconds, but configurable per-request or globally  

**Answer**: [Answer]: D

---

### Q8: Security Module Boundary
Should the security-critical modules (authentication, secure storage, API client) be enforced at the code level through import restrictions?

A) **Linter import restrictions** — Use `no-restricted-imports` (via oxlint) to prevent non-auth modules from importing auth internals  
B) **Package boundary** — Split security modules into a separate `@luminescence/security` package with explicit exports  
C) **Convention only** — Document the boundary; rely on code review to enforce  

**Answer**: A — Linter import restrictions via oxlint (Rust-based, fast). Note: ESLint replaced with oxlint for speed. oxlint supports `no-restricted-imports` and is compatible with React Native + Expo (runs on Node.js, independent of Hermes runtime).
