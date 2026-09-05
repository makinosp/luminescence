# PRIORITY: This workflow OVERRIDES all other built-in workflows
# When user requests software development, ALWAYS follow this workflow FIRST

# OpenSpec Workflow for luminescence

This project uses **OpenSpec** (https://github.com/Fission-AI/OpenSpec) for spec-driven development.

## Quick Reference

| Command | Purpose |
|---------|---------|
| `/opsx:explore` | Optional: Think through a fuzzy idea with the AI before committing |
| `/opsx:propose <change>` | Create a change: proposal → specs → design → tasks |
| `/opsx:apply` | Implement tasks, checking them off |
| `/opsx:archive` | Merge delta specs into main specs, move change to archive |

## Workflow Loop

```
1. EXPLORE (optional)    →  /opsx:explore "I want to add X but unsure how"
2. PROPOSE               →  /opsx:propose "add feature X"
   - AI drafts proposal.md, specs/, design.md, tasks.md
   - You review and adjust
3. APPLY                 →  /opsx:apply
   - AI works through tasks.md, checking off items
   - Update artifacts as you learn
4. ARCHIVE               →  /opsx:archive
   - Delta specs merge into openspec/specs/
   - Change folder moves to openspec/changes/archive/
```

## Key Principles

- **Fluid not rigid** — No phase gates. Work on what makes sense.
- **Iterative not waterfall** — Learn as you build, refine as you go.
- **Easy not complex** — Lightweight setup, minimal ceremony.
- **Brownfield-first** — Works with existing codebases, not just greenfield.
- **Enablers, not gates** — Artifact dependencies show what's possible, not what you must do next.

## Project Structure

```
openspec/
├── config.yaml           # Project context, rules, operation guidance
├── specs/                # Source of truth: current system behavior
│   ├── auth/
│   ├── accounts/
│   ├── categories/
│   ├── transactions/
│   ├── reports/
│   ├── storage/
│   └── cli/
└── changes/              # Proposed modifications (one folder per change)
    ├── add-feature-x/
    │   ├── proposal.md   # Why and what
    │   ├── specs/        # Delta specs (ADDED/MODIFIED/REMOVED)
    │   ├── design.md     # How (technical approach)
    │   ├── tasks.md      # Implementation checklist
    │   └── .openspec.yaml
    └── archive/          # Completed changes (preserved for history)
```

## Spec Format

Specs live in `openspec/specs/<domain>/spec.md` and contain:

- **Purpose** — High-level description of the domain
- **Requirements** — Behavior the system SHALL/MUST/SHOULD have
- **Scenarios** — Concrete Given/When/Then examples (testable)

Use RFC 2119 keywords: **SHALL/MUST** (absolute), **SHOULD** (recommended), **MAY** (optional).

## Change Artifacts

Each change in `openspec/changes/<name>/` contains:

1. **proposal.md** — Intent, scope (in/out), approach
2. **specs/** — Delta specs describing what's changing
3. **design.md** — Technical approach, architecture decisions, file changes
4. **tasks.md** — Hierarchical checklist (1.1, 1.2, 2.1, ...)
5. **.openspec.yaml** — Optional metadata (schema, retire_capabilities, etc.)

## Delta Specs

Delta specs describe changes relative to current specs:

```markdown
## ADDED Requirements
### Requirement: New Feature
The system SHALL...

## MODIFIED Requirements
### Requirement: Existing Feature
The system SHALL... (changed behavior)

## REMOVED Requirements
### Requirement: Deprecated Feature
(Description of what's removed)
```

## Configuration

Project context is in `openspec/config.yaml`:
- Tech stack: TypeScript (ESM), Node.js ≥20, pnpm ≥9
- Monorepo: `@luminescence/core`, `@luminescence/cli`
- Key deps: mobx, vitest, fast-check, oxlint/oxfmt
- Architecture: Clean architecture, DDD, MobX stores
- Security: Tokens in platform keyring, TLS 1.2+
- Testing: Unit tests + property-based tests (fast-check)

## Common Tasks

### Start a new feature
```
/opsx:propose "add dark mode toggle"
```

### Work on an existing change
```
/opsx:apply
```

### Complete a change
```
/opsx:archive
```

### Understand existing code before changing
```
/opsx:explore "How does transaction creation work?"
```

## AI Tool Commands

OpenSpec installed commands for:
- **GitHub Copilot**: `/opsx:propose`, `/opsx:apply`, `/opsx:archive`, `/opsx:explore`
- **Claude Code**: `/opsx:propose`, `/opsx:apply`, `/opsx:archive`, `/opsx:explore`
- **Amazon Q Developer**: `@opsx-propose`, `@opsx-apply`, `@opsx-archive`, `@opsx-explore`
- **Kiro**: `/opsx-propose`, `/opsx-apply`, `/opsx-archive`, `/opsx-explore`

Restart your IDE after `openspec init` or `openspec update` for commands to take effect.

## Useful Links

- [OpenSpec Documentation](https://github.com/Fission-AI/OpenSpec/blob/main/docs/README.md)
- [Getting Started](https://github.com/Fission-AI/OpenSpec/blob/main/docs/getting-started.md)
- [Core Concepts](https://github.com/Fission-AI/OpenSpec/blob/main/docs/concepts.md)
- [Workflows](https://github.com/Fission-AI/OpenSpec/blob/main/docs/workflows.md)
- [Commands Reference](https://github.com/Fission-AI/OpenSpec/blob/main/docs/commands.md)
- [Customization](https://github.com/Fission-AI/OpenSpec/blob/main/docs/customization.md)
