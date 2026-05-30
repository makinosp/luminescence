# Unit of Work Plan

## Overview
Decompose the Luminescence multi-client TypeScript suite into manageable units of work for the CONSTRUCTION PHASE.

**Architecture Summary**: Monorepo with 4 packages — `packages/core` (shared library), `packages/mobile` (React Native), `packages/web` (React SPA), `packages/cli` (Node.js CLI).

**Mandatory Artifacts**:
- [x] Generate `aidlc-docs/inception/application-design/unit-of-work.md` with unit definitions and responsibilities
- [x] Generate `aidlc-docs/inception/application-design/unit-of-work-dependency.md` with dependency matrix
- [x] Generate `aidlc-docs/inception/application-design/unit-of-work-story-map.md` mapping stories to units
- [x] Validate unit boundaries and dependencies
- [x] Ensure all stories are assigned to units

---

## Step 1: Story Grouping

Stories [US-01 through US-11] describe features across all three clients:

| Story | Description                        | Affected Clients |
| ----- | ---------------------------------- | ---------------- |
| US-01 | View transaction list              | Mobile, Web, CLI |
| US-02 | Search & filter transactions       | Mobile, Web, CLI |
| US-03 | Create, edit, delete transactions  | Mobile, Web, CLI |
| US-04 | View accounts & balances           | Mobile, Web, CLI |
| US-05 | Manage categories                  | Mobile, Web, CLI |
| US-06 | Financial reports                  | Mobile, Web, CLI |
| US-07 | CLI interactive & scriptable modes | CLI              |
| US-08 | Error handling & user feedback     | Mobile, Web, CLI |
| US-09 | Configure server connection        | Mobile, Web, CLI |
| US-10 | Responsive mobile interface        | Mobile           |
| US-11 | Offline capability awareness       | Mobile           |

**Observation**: Most stories span all three clients via the shared core. Only US-07 (CLI modes), US-10 (responsive mobile), and US-11 (offline) are client-specific. This suggests a natural 4-unit decomposition: Shared Core + 3 client packages.

**Question 1 — Story-to-unit affinity**:
How should stories be grouped into development units?

A) **Shared Core first, then clients in parallel** — Implement shared core (all shared logic) as Unit 1, then implement all three clients simultaneously as parallel units. Shared story implementation is complete before client-specific work begins.
B) **Feature-by-feature across all packages** — Each unit delivers a vertical slice through all layers (core + one or all clients). For example, Unit 1 = Authentication (core auth + all client config screens), Unit 2 = Transactions (core + all client transaction screens), etc.
C) **Core first, then one client at a time** — Shared core (Unit 1), then Mobile (Unit 2), Web (Unit 3), CLI (Unit 4). Each client unit includes both the shared core dependency and client-specific implementation.
D) **Other** (please describe after [Answer]: tag below)

[Answer]: A

**Question 2 — Inter-unit dependency management**:
How should units that depend on the shared core interact with it during development?

A) **Workspace protocol (npm workspaces)** — Shared core is package.json `"@luminescence/core": "workspace:*"` in each client package. Clients always use the local core source; lock file pins exact version.
B) **Bundled copy** — Each client gets a build snapshot of shared core at the start of its unit. Updates to core require re-syncing.
C) **Separate versioned releases** — Shared core is independently versioned (0.1.0, 0.2.0, etc.) and published; each client declares a semver range.

[Answer]: A

---

## Step 3: Team Alignment

**Observation**: This appears to be a solo project (single developer). Team alignment questions are less critical but still relevant for understanding future-proofing.

**Question 3 — Future team/ownership model**:
How do you anticipate the team scaling?

A) **Solo throughout** — Single developer on all packages; no need to split ownership.
B) **Maybe add contributors later** — Design units to be assignable to separate developers in the future. Unit boundaries should be clean and independently buildable.
C) **Multiple maintainers from start** — Each client package has a dedicated owner. Core is shared across all.

[Answer]: B

---

## Step 4: Technical Considerations

**Question 4 — Client build order**:
If executing one client at a time, which client should be implemented first?

A) **Mobile (React Native) first** — Most complex platform (native storage, offline awareness, responsive UI). Hardest first de-risks the architecture.
B) **Web (React SPA) first** — Fastest iteration loop (HMR, browser devtools). Quickest to validate the shared core API surfaces.
C) **CLI first** — Simplest UI (terminal output). Fastest way to validate core functionality end-to-end before investing in graphical clients.
D) **All clients in parallel** — Start core, then branch out to all three clients simultaneously. Requires multi-tasking but validates port interfaces across all platforms at once.

[Answer]: C

---

## Step 5: Code Organization (Greenfield)

**Question 5 — Monorepo tooling**:
What monorepo tool/workspace manager should be used?

A) **pnpm workspaces** — Fast, strict dependency resolution, `.pnpmfile.cjs` for custom hooks. Excellent for multi-package TypeScript projects.
B) **npm workspaces** — Built-in, no extra tooling. Simpler but slower and less strict than pnpm.
C) **Turborepo** — Build caching, parallel task execution, dependency graph awareness. Adds complexity but useful for large monorepos.
D) **Yarn workspaces** — Mature ecosystem, `.yarnrc.yml` configuration. Good but slower adoption than pnpm in 2026.

[Answer]: A

---

## Instructions
1. Fill in [Answer]: tags above with your chosen option (e.g., `[Answer]: A`)
2. For "Other" options, describe your preferred approach after the tag
3. After completing all answers, I'll review for ambiguities and ask follow-ups if needed
