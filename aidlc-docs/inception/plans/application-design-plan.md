# Application Design Plan

## Overview
Design the high-level component architecture for the Luminescence multi-client TypeScript suite: shared core library + Mobile (React Native), Web (SPA), and CLI clients.

## Design Artifacts to Generate
- [ ] Generate `components.md` — Component definitions and high-level responsibilities
- [ ] Generate `component-methods.md` — Method signatures and interfaces
- [ ] Generate `services.md` — Service definitions and orchestration patterns
- [ ] Generate `component-dependency.md` — Dependency relationships and communication patterns
- [ ] Generate `application-design.md` — Consolidated design document

## Clarifying Questions

### Question 1
What architecture pattern should the shared core use to expose platform-specific functionality (secure storage, HTTP client, clipboard, etc.)?

A) **Ports & Adapters (Hexagonal Architecture)** — Define interfaces (ports) in shared core; each client implements adapters for its platform. Maximizes testability and separation.
B) **Template Method / Strategy Pattern** — Shared core provides base classes with hooks; platforms override specific methods. Simpler but tighter coupling.
C) **Dependency Injection Container** — Shared core defines abstract services; each platform registers its implementations via a DI container. Flexible but adds DI overhead.
D) **Facade Pattern** — Shared core provides a unified API that internally delegates to platform-specific modules resolved at build time via conditional imports. Simple but less runtime flexibility.
E) **Other** (please describe after [Answer]: tag below)

[Answer]: A

**Rationale**: Security Baseline (NFR-06) requires "isolating security-critical logic into dedicated modules." Ports & Adapters pattern provides the strongest enforcement: shared core defines interfaces (ports), and each platform (Mobile/Web/CLI) implements adapters. This maximizes testability and aligns with Property-Based Testing requirements.

### Question 2
How should the shared core be packaged and consumed by each client?

A) **Monorepo (npm workspaces / Turborepo)** — All packages in one repository with workspace-level dependency management. Simpler coordination and shared tooling.
B) **Separate npm packages published to a registry** — Each client consumes shared core as an external dependency. Cleaner boundaries but higher overhead for iteration.
C) **Git submodules** — Shared core as a git submodule included by each client. Simple but harder to manage versioning.
D) **Other** (please describe after [Answer]: tag below)

[Answer]: A

**Rationale**: Given the need for frequent iteration on the shared core across three clients, Monorepo (npm workspaces/Turborepo) is optimal. Dependency management remains unified, enabling coordinated changes across clients. Aligns with NFR-08 (lock file commits, pinned dependencies). No immediate need for separate package publication, so a simple Monorepo structure is recommended.

### Question 3
What state management approach should the Mobile and Web clients use?

A) **Zustand** — Lightweight, minimal boilerplate, works well with React/React Native. Simple global store.
B) **TanStack Query (React Query)** — Server-state focused with caching, background refetching, and optimistic updates. Pairs well with a lightweight local state solution.
C) **Redux Toolkit** — Full-featured with devtools, middlewares, and standardized patterns. Higher boilerplate but mature ecosystem.
D) **Jotai / Recoil (atomic state)** — Atomic, composable state primitives. Flexible but less established patterns for server state.
E) **Other** (please describe after [Answer]: tag below)

[Answer]: E — MobX

**Rationale**: Adopting a reactive programming paradigm similar to SwiftUI ensures consistent state management architecture across Mobile and Web clients. MobX's automatic tracking mechanism automatically detects state changes and triggers component re-renders, resulting in intuitive and maintainable code. Unified management of local UI state and server-sourced data state with clear expression of complex state transitions. Security Baseline (NFR-06) security-critical logic isolation can be enforced through explicit stratification in MobX stores.

### Question 4
How should the CLI client handle HTTP communication and terminal interaction?

A) **Node.js built-in fetch (undici) + Commander.js** — Native fetch for HTTP, Commander for CLI framework. Minimal dependencies, modern Node.js.
B) **Axios + Ink (React-based CLI)** — Axios for HTTP, Ink for React-based terminal UI. Richer interactivity but heavier.
C) **Got + Commander.js** — Got library with more features than native fetch, Commander for CLI. Good balance of features and simplicity.
D) **Other** (please describe after [Answer]: tag below)

[Answer]: A

**Rationale**: CLIs prioritize lightweight implementations. Current stable Node.js supports native fetch without `--experimental-fetch`, reducing additional dependencies. Commander.js is the most widely-used CLI framework, enabling simple implementation of both interactive and scriptable modes (US-07). Ink is dependency-heavy and over-engineered for a CLI primarily outputting tables and JSON/CSV formats.

### Question 5
How should API error handling and retry logic be structured?

A) **Centralized API client interceptor** — Shared HTTP layer with automatic retry on 5xx/network errors, centralized error categorization. All clients inherit consistent behavior.
B) **Per-client error handling** — Shared core provides raw API methods; each client implements its own error handling and retry strategy. More flexibility but duplication risk.
C) **Shared error types + optional retry middleware** — Shared core defines error types; retry logic is implemented as optional middleware layers that clients can compose. Hybrid approach.
D) **Other** (please describe after [Answer]: tag below)

[Answer]: C

**Rationale**: To satisfy both SB-04 (excluding secrets from logs) and US-08 (user-friendly error messages by category), the shared core should centrally define error types, with each client selectively incorporating retry middleware as needed. Mandatory automatic retry (option A) is unsafe for write operations; delegating entirely to clients (option B) may compromise consistency with Security Baseline NFR-06 (security-critical logic isolation).

### Question 6
What component grouping strategy should be used for organizing the shared core?

A) **By domain feature** — Group by business concepts (transactions/, accounts/, categories/, reports/, auth/). Co-locates related logic and types.
B) **By architectural layer** — Group by technical role (api-client/, domain-models/, storage/, validation/, ui-models/). Traditional layering.
C) **Hybrid** — Top-level by architectural layer, within each layer by domain feature. Balanced organization.
D) **Other** (please describe after [Answer]: tag below)

[Answer]: C

**Rationale**: Security Baseline (NFR-06) requires "isolating authentication, API access, secure storage, and configuration management into dedicated modules." This mandates layer-based separation, while domain feature grouping (transactions, accounts, categories, reports) is equally important for code clarity. A hybrid strategy—architectural layers at the top level (api-client/, domain-models/, storage/, auth/) with domain features nested beneath—optimally balances security requirements with reduced cognitive load for developers.
