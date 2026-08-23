# Migration from aidlc-workflows to OpenSpec

## Summary

Migrated the luminescence project from **aidlc-workflows** (phased, rigid, 30+ documentation files) to **OpenSpec** (lightweight, delta-based, change-centric) on 2026-08-19.

## What Was Done

### 1. Archived Historical Documents

- Moved `aidlc-docs/` → `aidlc-docs-archive/` (preserved all historical context)
- Contains: requirements, user stories, application design, construction plans, audit log, state tracking

### 2. Installed OpenSpec

- Added `@fission-ai/openspec@^1.9.0` to root `package.json` devDependencies
- Added npm scripts: `openspec:init`, `openspec:update`
- Ran `pnpm install` to install locally (no global install)

### 3. Initialized OpenSpec

- Ran `npx openspec init` — created `openspec/` structure and AI tool commands
- Configured for: GitHub Copilot, Claude Code, Kiro (Amazon Q Developer also detected)
- Default schema: `spec-driven` (proposal → specs → design → tasks)

### 4. Configured Project Context

Created `openspec/config.yaml` with:

- Project context (monorepo, tech stack, architecture, security, testing)
- Per-artifact rules (proposal, specs, design, tasks)
- Per-operation guidance (apply, archive)

### 5. Created Domain Specs (7 domains)

Converted aidlc artifacts into OpenSpec behavioral specs:

| Domain          | Source                                                                      | File                                  |
| --------------- | --------------------------------------------------------------------------- | ------------------------------------- |
| `auth/`         | FR-03,04,05,06,07,08,14 + NFR-01,02,03,04,06,07 + US-01 + SB-01,02,03,04,05 | `openspec/specs/auth/spec.md`         |
| `accounts/`     | FR-10 + US-04                                                               | `openspec/specs/accounts/spec.md`     |
| `categories/`   | FR-11 + US-05                                                               | `openspec/specs/categories/spec.md`   |
| `transactions/` | FR-09 + US-02,03                                                            | `openspec/specs/transactions/spec.md` |
| `reports/`      | FR-12 + US-06                                                               | `openspec/specs/reports/spec.md`      |
| `storage/`      | FR-06,07,13 + NFR-02,06,07 + SB-01,02 + components.md storage module        | `openspec/specs/storage/spec.md`      |
| `cli/`          | FR-17 + US-07 + components.md CLI adapters                                  | `openspec/specs/cli/spec.md`          |

Each spec contains:

- **Purpose** — High-level domain description
- **Requirements** — Behavior using RFC 2119 keywords (SHALL/MUST/SHOULD/MAY)
- **Scenarios** — Concrete Given/When/Then examples (testable)

### 6. Updated AGENTS.md

Replaced aidlc-workflows instructions with OpenSpec workflow reference.

## Key Design Decisions

| Decision                             | Rationale                                                                          |
| ------------------------------------ | ---------------------------------------------------------------------------------- |
| **Preserve aidlc-docs as archive**   | Valuable historical context for decisions made                                     |
| **Delta-first migration**            | Bootstrap change adds all specs as deltas (not done yet — Phase 3)                 |
| **Package-based domains**            | Maps to existing structure: `core/` domains + `cli/`                               |
| **Default `spec-driven` schema**     | Standard workflow: proposal → specs → design → tasks                               |
| **Single `openspec/` at repo root**  | Monorepo-friendly                                                                  |
| **Extensions integrated into specs** | Security Baseline → `auth/`, `storage/` specs; Property-Based Testing → task items |

## Next Steps (Phase 3-5)

### Phase 3: Bootstrap Change — SKIPPED

Domain specs were created directly in `openspec/specs/` (they serve as the source of truth). A bootstrap change with identical delta specs would cause merge conflicts on archive, so this phase was intentionally skipped.

### Phase 4: Configuration Updates — COMPLETE

- [x] `AGENTS.md` / `CLAUDE.md` replaced with OpenSpec workflow (symlinks removed)
- [x] `.aidlc-rule-details` symlink removed
- [x] `.vendor/aidlc-workflows` git submodule removed (from disk and git index)
- [x] `.gitmodules` removed
- [x] `.amazonq/aws-aidlc-rule-details`, `.amazonq/rules/aws-aidlc-rules` removed
- [x] `.kiro/aws-aidlc-rule-details`, `.kiro/steering/aws-aidlc-rules` removed

### Phase 5: Validation — COMPLETE

- [x] `openspec validate --specs` — 7 passed, 0 failed
- [x] `openspec list --specs` — all 7 domains listed with correct requirement counts
- [x] `openspec doctor` — OpenSpec root ok
- [x] `openspec show auth` — spec renders correctly
- [x] `pnpm build` — all packages build successfully
- [x] `pnpm test` — all 23 tests pass
- [x] No aidlc references in active codebase (only in archive and migration docs)

## Verification Checklist

- [x] `aidlc-docs/` archived to `aidlc-docs-archive/`
- [x] `@fission-ai/openspec` installed locally
- [x] `openspec init` completed successfully
- [x] `openspec/config.yaml` created with project context
- [x] 7 domain specs created in `openspec/specs/`
- [x] `AGENTS.md` / `CLAUDE.md` updated to OpenSpec workflow
- [x] Bootstrap change skipped (specs already in place as source of truth)
- [x] All aidlc artifacts removed (symlink, submodule, rule details)
- [x] `openspec validate --specs` passes (7/7)
- [x] Build and tests pass after migration

## References

- [OpenSpec Documentation](https://github.com/Fission-AI/OpenSpec/blob/main/docs/README.md)
- [Existing Projects Guide](https://github.com/Fission-AI/OpenSpec/blob/main/docs/existing-projects.md)
- [Core Concepts](https://github.com/Fission-AI/OpenSpec/blob/main/docs/concepts.md)
- [Customization](https://github.com/Fission-AI/OpenSpec/blob/main/docs/customization.md)
