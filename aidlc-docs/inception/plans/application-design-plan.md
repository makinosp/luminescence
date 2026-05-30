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

[Answer]: 

### Question 2
How should the shared core be packaged and consumed by each client?

A) **Monorepo (npm workspaces / Turborepo)** — All packages in one repository with workspace-level dependency management. Simpler coordination and shared tooling.
B) **Separate npm packages published to a registry** — Each client consumes shared core as an external dependency. Cleaner boundaries but higher overhead for iteration.
C) **Git submodules** — Shared core as a git submodule included by each client. Simple but harder to manage versioning.
D) **Other** (please describe after [Answer]: tag below)

[Answer]: 

### Question 3
What state management approach should the Mobile and Web clients use?

A) **Zustand** — Lightweight, minimal boilerplate, works well with React/React Native. Simple global store.
B) **TanStack Query (React Query)** — Server-state focused with caching, background refetching, and optimistic updates. Pairs well with a lightweight local state solution.
C) **Redux Toolkit** — Full-featured with devtools, middlewares, and standardized patterns. Higher boilerplate but mature ecosystem.
D) **Jotai / Recoil (atomic state)** — Atomic, composable state primitives. Flexible but less established patterns for server state.
E) **Other** (please describe after [Answer]: tag below)

[Answer]: 

### Question 4
How should the CLI client handle HTTP communication and terminal interaction?

A) **Node.js built-in fetch (undici) + Commander.js** — Native fetch for HTTP, Commander for CLI framework. Minimal dependencies, modern Node.js.
B) **Axios + Ink (React-based CLI)** — Axios for HTTP, Ink for React-based terminal UI. Richer interactivity but heavier.
C) **Got + Commander.js** — Got library with more features than native fetch, Commander for CLI. Good balance of features and simplicity.
D) **Other** (please describe after [Answer]: tag below)

[Answer]: 

### Question 5
How should API error handling and retry logic be structured?

A) **Centralized API client interceptor** — Shared HTTP layer with automatic retry on 5xx/network errors, centralized error categorization. All clients inherit consistent behavior.
B) **Per-client error handling** — Shared core provides raw API methods; each client implements its own error handling and retry strategy. More flexibility but duplication risk.
C) **Shared error types + optional retry middleware** — Shared core defines error types; retry logic is implemented as optional middleware layers that clients can compose. Hybrid approach.
D) **Other** (please describe after [Answer]: tag below)

[Answer]: 

### Question 6
What component grouping strategy should be used for organizing the shared core?

A) **By domain feature** — Group by business concepts (transactions/, accounts/, categories/, reports/, auth/). Co-locates related logic and types.
B) **By architectural layer** — Group by technical role (api-client/, domain-models/, storage/, validation/, ui-models/). Traditional layering.
C) **Hybrid** — Top-level by architectural layer, within each layer by domain feature. Balanced organization.
D) **Other** (please describe after [Answer]: tag below)

[Answer]:
