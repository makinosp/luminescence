# Shared Core - NFR Requirements Plan

## Unit Context

- **Unit**: Unit 1 - Shared Core (`packages/core`)
- **Responsibilities**: Domain models, validators, serializers, API client, storage interfaces, MobX stores, error handling, services
- **Stories Covered**: US-01 through US-09, US-11 (shared logic portions)
- **Dependencies**: None (self-contained, pure business logic)

## Assessment Steps

### Step 1: Analyze Functional Design for NFR Relevance

- [x] Read domain-models.md — pure logic, serialization, validation
- [x] Read api-client-design.md — HTTP client, retry, error hierarchy
- [x] Read storage-design.md — secure storage port, fail-closed behavior
- [x] Read store-design.md — MobX reactive state management
- [x] Read service-design.md — orchestration services
- [x] Read business-rules.md — validation rules, constraints

### Step 2: Identify NFR Categories Applicable to Unit 1

- [x] Security — token handling, secret redaction, fail-closed (SB-01~05, NFR-02, NFR-03, NFR-06, NFR-07)
- [x] Reliability — error handling, retry middleware, storage failure modes
- [x] Performance — API response handling, store update efficiency
- [x] Maintainability — testability, PBT suitability, code organization
- [x] Tech Stack — TypeScript, MobX, fast-check, HTTP library

### Step 3: Generate Clarification Questions

- [x] Created 8 questions covering security, performance, reliability, maintainability, and tech stack

### Step 4: Store Plan

- [x] Saved to aidlc-docs/construction/plans/shared-core-nfr-requirements-plan.md

### Step 5: Collect and Analyze Answers

- [x] All 8 questions answered by user
- [x] No ambiguities detected — all answers are specific and actionable

### Step 6: Generate NFR Requirements Artifacts

- [x] nfr-requirements.md — 7 NFR categories with extension compliance
- [x] tech-stack-decisions.md — TypeScript, MobX, Vitest, fast-check, native fetch, ESLint, Prettier

### Step 7: Present Completion Message

- [ ] Present to user for review

### Step 8: Wait for Explicit Approval

- [ ] Awaiting user approval

### Step 9: Record Approval and Update Progress

- [ ] Update audit.md and aidlc-state.md

---

## Clarification Questions

### Q1: API Response Time Expectations

What is the acceptable response time for Firefly III API operations (e.g., list transactions, create transaction)?

A) **Fast** — Under 500ms for all operations; implement aggressive caching and optimistic updates  
B) **Moderate** — Under 2 seconds for standard operations; implement loading states and basic retry  
C) **Relaxed** — Under 5 seconds acceptable; focus on correctness over speed; minimal caching

**Answer**: B — Moderate (Under 2 seconds for standard operations; implement loading states and basic retry)

---

### Q2: Concurrent API Request Handling

How should the shared core handle concurrent API requests (e.g., user triggers a transaction list while creating a new transaction)?

A) **Queue-based** — Serialize all API requests through a request queue to avoid race conditions  
B) **Optimistic** — Allow concurrent requests; use MobX atomic updates and rollback on conflict  
C) **Simple** — Allow concurrent requests; last-write-wins with no explicit conflict handling

**Answer**: C — Error-only (Return the auth error to the caller; let the client UI decide how to handle it)

---

### Q3: Token Expiration and Refresh Behavior

How should the shared core handle an expired or invalid personal access token during an API call?

A) **Immediate logout** — On any 401 response, clear stored token and force re-authentication  
B) **Single retry** — Retry once on 401 (in case of transient auth issues), then force re-authentication  
C) **Error-only** — Return the auth error to the caller; let the client UI decide how to handle it

**Answer**: A — Full (All pure functions: validators, serializers, domain logic, round-trip serialization, business rule invariants)

---

### Q4: Property-Based Testing Scope

What is the desired scope of property-based testing for the shared core?

A) **Full** — All pure functions: validators, serializers, domain logic, round-trip serialization, business rule invariants  
B) **Core only** — Validators and serializers only; skip business rule invariants  
C) **Minimal** — Only serialization round-trips; rely on example-based tests for everything else

**Answer**: B — Medium (Up to 1,000 items; consider computed properties for derived data)

---

### Q5: MobX Store Update Performance

For transaction/account/category lists, what is the expected maximum number of items that must be rendered in a single view?

A) **Small** — Up to 100 items; no virtualization needed; simple MobX observable arrays  
B) **Medium** — Up to 1,000 items; consider computed properties for derived data  
C) **Large** — Up to 10,000+ items; require pagination at the store level and virtualized rendering support

**Answer**: A — Fail-closed with prompt (Block authenticated operations; prompt user to unlock storage and retry)

---

### Q6: Error Recovery for Storage Failures

When secure storage fails (e.g., keychain locked, keyring unavailable), what is the desired recovery behavior?

A) **Fail-closed with prompt** — Block authenticated operations; prompt user to unlock storage and retry (matches Clarification Q9 answer B)  
B) **Fail-open with warning** — Allow in-memory token usage for the session; warn user that persistence is unavailable  
C) **Graceful degradation** — Fall back to in-memory only; no warning; user re-enters token on next launch

**Answer**: A — Maximum (strict: true plus noUncheckedIndexedAccess, exactOptionalPropertyTypes, noImplicitReturns)

---

### Q7: TypeScript Strictness Level

What level of TypeScript strictness should the shared core enforce?

A) **Maximum** — `strict: true` plus `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitReturns`  
B) **Standard strict** — `strict: true` only (strictNullChecks, noImplicitAny, etc.)  
C) **Relaxed** — `strict: false` with selective strict flags; prioritize development speed

**Answer**: A — native fetch (Use the platform-native fetch API; no additional dependencies)

---

### Q8: HTTP Client Library

Which HTTP client library should the shared core use for API communication?

A) **native fetch** — Use the platform-native fetch API; no additional dependencies (matches Application Design Q4 answer A)  
B) **axios** — Use axios for interceptors, automatic JSON parsing, and broader error handling  
C) **ky** — Use ky (fetch wrapper) for built-in retry, timeout, and hooks with smaller bundle than axios

**Answer**: [Answer]:
