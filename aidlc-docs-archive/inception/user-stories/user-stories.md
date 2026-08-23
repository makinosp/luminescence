# User Stories

## US-01: Firefly III Server Configuration and Authentication

| Attribute        | Description                                      |
| ---------------- | ------------------------------------------------ |
| **Title**        | Connect to Firefly III Server and Begin Using It |
| **Persona**      | P1, P2, P3, P4                                   |
| **Related FR**   | FR-03, FR-04, FR-05, FR-08, FR-14                |
| **Related NFR**  | NFR-01, NFR-03, NFR-06, NFR-07                   |
| **Priority**     | Must have                                        |
| **Story Points** | 5                                                |

**As a** user of the Luminescence client suite,
**I want to** configure the Firefly III server base URL and authenticate using a personal access token,
**so that** I can securely connect to my Firefly III instance and start managing my finances.

### Acceptance Criteria

**AC1-01: Initial configuration (Mobile/Web)**

- Given I am running the client for the first time, when I open the application, then I am presented with a configuration screen prompting for the server base URL and personal access token.
- The server base URL field validates that the input is a well-formed HTTPS URL before submission.
- The personal access token field masks the input visually (password field).

**AC1-02: Initial configuration (CLI)**

- Given I run the CLI with no existing configuration, when I run the `luminescence configure` command interactively, then I am prompted for the server base URL and personal access token.
- The CLI also supports `--base-url` and `--token` flags for non-interactive (scriptable) configuration.

**AC1-03: Connection validation**

- Given I have entered the server base URL and token, when I confirm the configuration, then the client attempts a connectivity check against the Firefly III API `/about` endpoint.
- If the connection succeeds, I am shown a success message and the configuration is persisted.
- If the connection fails, I am shown a user-friendly error message (without exposing stack traces or internal details) and I remain on the configuration screen.

**AC1-04: Configuration persistence**

- Given I have successfully configured the client, when I close and reopen the application, then I should not be asked to re-enter the configuration.
- The server base URL is stored in platform-appropriate non-sensitive storage (mobile: AsyncStorage; web: localStorage; CLI: config file at `~/.config/luminescence/config.json`).
- The personal access token is stored only in platform-appropriate secure storage (mobile: Keychain/Keystore; web: sessionStorage; CLI: OS keyring via `keytar` or equivalent).

**AC1-05: Configuration update**

- Given I have an existing configuration, when I choose to update the server base URL or token, then the client validates the new values and re-validates connectivity before persisting.

**AC1-06: Fail-closed on missing/invalid configuration**

- Given no valid configuration exists, when I attempt any authenticated operation, then the client redirects me to the configuration flow (Mobile/Web) or displays an error with instructions to run `luminescence configure` (CLI).
- Error messages do not expose token values, internal paths, or framework details.

---

## US-02: Transaction List Display and Search

| Attribute        | Description                         |
| ---------------- | ----------------------------------- |
| **Title**        | Display and Search Transaction List |
| **Persona**      | P1, P2, P3                          |
| **Related FR**   | FR-09                               |
| **Related NFR**  | NFR-10, NFR-11, NFR-12              |
| **Priority**     | Must have                           |
| **Story Points** | 8                                   |

**As a** user,
**I want to** view a list of my financial transactions with search and filter capabilities,
**so that** I can quickly find specific transactions and review my financial activity.

### Acceptance Criteria

**AC2-01: Transaction list (Mobile/Web)**

- Given I am authenticated, when I navigate to the transaction list view, then I am shown a paginated list of transactions with date, description, amount, and category.
- The list is sorted by date in descending order by default.
- Pull-to-refresh (Mobile) or refresh button (Web) fetches the latest data from the API.

**AC2-02: Transaction list (CLI)**

- Given I am authenticated, when I run `luminescence transactions list`, then I am shown a formatted table of recent transactions.
- The command supports `--limit`, `--offset`, `--start`, `--end` flags for pagination and date filtering.
- Output format flags `--format table|json|csv` are supported for scriptable usage.

**AC2-03: Search and filter**

- Given I am viewing the transaction list, when I apply search criteria (date range, category, account, amount range, description text), then the list is filtered to show only matching transactions.
- Filter state is preserved during the session but not persisted between sessions.

**AC2-04: Empty state**

- Given I have no transactions matching the current filter, when the list is empty, then I am shown a helpful empty state message rather than a blank screen or error.
- CLI: `luminescence transactions list` with no results exits with code 0 and prints "No transactions found."

**AC2-05: Error state**

- Given the API is unavailable or returns an error, when I request the transaction list, then I am shown a user-friendly error message with a retry option (Mobile/Web) or non-zero exit code with error message (CLI).
- Stack traces, internal paths, and token values are never exposed.

---

## US-03: Transaction Creation, Editing, and Deletion

| Attribute        | Description                           |
| ---------------- | ------------------------------------- |
| **Title**        | Create, Edit, and Delete Transactions |
| **Persona**      | P1, P2, P3                            |
| **Related FR**   | FR-09, FR-14                          |
| **Related NFR**  | NFR-04, NFR-06, NFR-10, NFR-11        |
| **Priority**     | Must have                             |
| **Story Points** | 8                                     |

**As a** user,
**I want to** create new transactions, edit existing ones, and delete transactions,
**so that** I can keep my financial records accurate and up to date.

### Acceptance Criteria

**AC3-01: Create transaction**

- Given I am authenticated, when I create a new transaction with required fields (amount, description, transaction type, date), then the transaction is submitted to the Firefly III API and I am shown a success confirmation with the created transaction details.
- Optional fields (category, account, budget, tags, notes) are supported.

**AC3-02: Create transaction (CLI)**

- Given I am authenticated, when I run `luminescence transactions create --amount 50.00 --description "Groceries" --type withdrawal`, then the transaction is created and the result is displayed.
- The CLI supports interactive prompting when required flags are omitted.

**AC3-03: Input validation**

- Given I am creating or editing a transaction, when I submit invalid data (negative amount, empty description, future date as withdrawal, etc.), then I am shown a validation error with a clear explanation of the issue.
- Client-side validation catches errors before API submission where feasible.

**AC3-04: Edit transaction**

- Given I am viewing a transaction, when I choose to edit it, then I am presented with a pre-populated form (Mobile/Web) or prompted for changed fields (CLI) and the changes are persisted via the API.

**AC3-05: Delete transaction**

- Given I am viewing a transaction, when I choose to delete it, then I am asked for confirmation before the deletion is submitted.
- After deletion, I am returned to the transaction list.
- CLI: `luminescence transactions delete --id <id>` requires `--force` or interactive confirmation.

**AC3-06: Error handling**

- Given the API operation fails (network error, validation error from server), when I attempt any mutation, then I am shown a user-friendly error with the specific reason.
- The optimistic update is not used; the UI waits for API confirmation before updating local state.

---

## US-04: Account Information View

| Attribute        | Description              |
| ---------------- | ------------------------ |
| **Title**        | View Account Information |
| **Persona**      | P1, P2, P3               |
| **Related FR**   | FR-10                    |
| **Related NFR**  | NFR-10                   |
| **Priority**     | Must have                |
| **Story Points** | 5                        |

**As a** user,
**I want to** view my Firefly III accounts and their balances,
**so that** I can monitor my financial accounts in one place.

### Acceptance Criteria

**AC4-01: Account list**

- Given I am authenticated, when I navigate to the accounts view, then I am shown a list of all accounts with name, type (asset, liability, revenue, expense), and current balance.
- Mobile/Web: card or list view with visual indicators for account type.
- CLI: `luminescence accounts list --type asset` with tabular output and `--format` flag.

**AC4-02: Account detail**

- Given I select an account, when I view its details, then I am shown the account's balance, currency, and recent transactions associated with that account.
- CLI: `luminescence accounts show --id <id>`.

**AC4-03: Account filtering**

- Given I have many accounts, when I filter by account type, then only matching accounts are displayed.

---

## US-05: Expense Category Management

| Attribute        | Description               |
| ---------------- | ------------------------- |
| **Title**        | Manage Expense Categories |
| **Persona**      | P1, P2, P3                |
| **Related FR**   | FR-11                     |
| **Related NFR**  | NFR-10                    |
| **Priority**     | Should have               |
| **Story Points** | 5                         |

**As a** user,
**I want to** view and manage expense categories,
**so that** I can organize my transactions into meaningful groups for analysis.

### Acceptance Criteria

**AC5-01: Category list**

- Given I am authenticated, when I navigate to the categories view, then I am shown a list of all categories with the count of transactions and total spending per category.
- CLI: `luminescence categories list [--spent]` with aggregated spending data.

**AC5-02: Category transactions**

- Given I select a category, when I view its details, then I am shown all transactions assigned to that category.

---

## US-06: Financial Report Viewing

| Attribute        | Description                                  |
| ---------------- | -------------------------------------------- |
| **Title**        | Display Financial Reports and Visualizations |
| **Persona**      | P1, P2                                       |
| **Related FR**   | FR-12                                        |
| **Priority**     | Should have                                  |
| **Story Points** | 8                                            |

**As a** user,
**I want to** view financial reports and spending visualizations,
**so that** I can understand my spending patterns and make informed budgeting decisions.

### Acceptance Criteria

**AC6-01: Spending overview**

- Given I am authenticated, when I navigate to the reports view, then I am shown a dashboard with spending by category, spending over time, and income vs. expenses.

**AC6-02: Period selection**

- Given I am viewing reports, when I select a date range (current month, last month, last 3 months, custom range), then the report data refreshes for the selected period.

**AC6-03: Visualization (Web only)**

- Given I am on the Web client, when I view reports, then charts and graphs (pie chart for category breakdown, line chart for spending over time) are rendered.

**AC6-04: CLI reporting**

- Given I am on the CLI, when I run `luminescence reports spending --period monthly`, then I am shown a textual summary with formatted tables and basic ASCII indicators (where feasible).

---

## US-07: CLI Interactive and Scriptable Operations

| Attribute        | Description                          |
| ---------------- | ------------------------------------ |
| **Title**        | Use CLI Interactively and Scriptably |
| **Persona**      | P3                                   |
| **Related FR**   | FR-17                                |
| **Priority**     | Must have                            |
| **Story Points** | 8                                    |

**As a** CLI user,
**I want to** use both interactive prompts and non-interactive flag-based commands,
**so that** I can manually explore data or automate tasks in shell scripts and cron jobs.

### Acceptance Criteria

**AC7-01: Interactive mode**

- Given I run a command without all required flags, then the CLI prompts interactively for missing values.
- Interactive mode supports tab completion for known values (categories, account IDs) where feasible.

**AC7-02: Scriptable mode**

- Given I provide all required flags, then the CLI completes the operation without any prompts and exits with appropriate exit codes (0 for success, 1 for user error, 2 for API/network error).
- Output formats include `--format table|json|csv` for pipeline integration.

**AC7-03: Exit codes**

- All CLI commands follow predictable exit code conventions for script consumption.

---

## US-08: Clear Feedback from Error States

| Attribute        | Description                                   |
| ---------------- | --------------------------------------------- |
| **Title**        | Receive Clear User Feedback When Errors Occur |
| **Persona**      | P1, P2, P3, P4                                |
| **Related FR**   | FR-14                                         |
| **Related NFR**  | NFR-03, NFR-04, NFR-05, NFR-07                |
| **Priority**     | Must have                                     |
| **Story Points** | 5                                             |

**As a** user,
**I want to** receive clear, actionable feedback when errors occur,
**so that** I can understand what went wrong and how to fix it without being exposed to sensitive technical details.

### Acceptance Criteria

**AC8-01: Error categories**

- Given an error occurs, when the system detects it, then it categorizes the error as one of: network error, authentication failure, API validation error, server error, or unknown error.
- Each category has a specific, user-friendly message.

**AC8-02: Retry capability**

- Given a transient error (network timeout, server 5xx), when the error occurs, then the user is offered a retry option (Mobile/Web button, CLI `--retry` flag or re-run).

**AC8-03: Secure error messages**

- Error messages never include: stack traces, internal paths, token values, framework names, or internal IP addresses.

---

## US-09: Platform-Specific Secure Credential Storage

| Attribute        | Description                                 |
| ---------------- | ------------------------------------------- |
| **Title**        | Store Credentials Securely on Each Platform |
| **Persona**      | P1, P2, P3                                  |
| **Related FR**   | FR-06, FR-07                                |
| **Related NFR**  | NFR-02, NFR-03, NFR-06                      |
| **Priority**     | Must have                                   |
| **Story Points** | 5                                           |

**As a** user,
**I want** my personal access token to be stored securely on each platform,
**so that** unauthorized parties cannot access my Firefly III data even if my device is compromised.

### Acceptance Criteria

**AC9-01: Mobile secure storage**

- Given I am using the mobile client, when my personal access token is saved, then it is stored using platform secure storage (iOS Keychain / Android Keystore) only.
- AsyncStorage is used exclusively for non-sensitive settings (base URL, UI preferences).

**AC9-02: Web session storage**

- Given I am using the web client, when my personal access token is stored, then it is stored in sessionStorage only (cleared when the browser tab is closed).
- The token is never persisted to localStorage or cookies.

**AC9-03: CLI keyring storage**

- Given I am using the CLI, when my personal access token is saved, then it is stored using the OS keyring service via `keytar` or equivalent.
- The config file only stores the server base URL and a reference to the keyring entry, never the token itself.

---

## US-10: Shared Core Feature Delivery Across All Clients

| Attribute        | Description                                 |
| ---------------- | ------------------------------------------- |
| **Title**        | Use Common Core Features Across All Clients |
| **Persona**      | P1, P2, P3                                  |
| **Related FR**   | FR-02, FR-15                                |
| **Related NFR**  | NFR-10, NFR-11                              |
| **Priority**     | Must have                                   |
| **Story Points** | 13                                          |

**As a** developer / the project,
**I want** all three clients (Mobile, Web, CLI) to share a common core of API client, type definitions, and business logic,
**so that** the Firefly III feature set is consistent across platforms and code duplication is minimized.

### Acceptance Criteria

**AC10-01: Shared core package**

- A shared TypeScript core package (`@luminescence/core`) contains all Firefly III API client code, data models, type definitions, validation logic, and pure business logic.
- All three client applications depend on this shared core package.

**AC10-02: Consistent feature set**

- The same set of API operations (transactions CRUD, accounts list, categories list, reports) is exposed through the shared core to all clients.
- Platform-specific adaptations are limited to UI rendering, input handling, and storage mechanisms.

**AC10-03: Property-based testing on core**

- Pure transformation logic (serialization/deserialization, validation, date calculations) in the shared core is covered by property-based tests using fast-check.
- Example-based tests cover critical user flows for each client.

---

## US-00: Epic / Technical Stories (Cross-Functional Non-Functional Requirements)

| Attribute        | Description                                                       |
| ---------------- | ----------------------------------------------------------------- |
| **Title**        | Project Foundation and Non-Functional Requirements Implementation |
| **Persona**      | N/A (technical)                                                   |
| **Related FR**   | FR-01, FR-02                                                      |
| **Related NFR**  | NFR-08, NFR-09, NFR-10, NFR-11, NFR-12, NFR-13                    |
| **Priority**     | Must have                                                         |
| **Story Points** | 8                                                                 |

**As a** developer,
**I want to** establish the project foundation including monorepo structure, build tooling, dependency management, and testing infrastructure,
**so that** the project is maintainable, reproducible, and verifiable.

### Acceptance Criteria

**AC00-01: Monorepo structure**

- The project is organized as a monorepo with a shared core package and three client application packages.
- Package manager lock files are committed.
- Dependencies are pinned to exact versions.

**AC00-02: TypeScript configuration**

- A root `tsconfig.json` with strict settings is used across all packages.
- Shared `tsconfig.base.json` provides common compiler options.

**AC00-03: Testing infrastructure**

- Jest (or Vitest) is configured as the test runner.
- fast-check is configured for property-based testing.
- Test commands are available for the entire repository and per-package.

**AC00-04: Linting and formatting**

- ESLint with TypeScript rules and Prettier for consistent formatting.
- Pre-commit hooks (husky/lint-staged) enforce code quality.

**AC00-05: CI compatibility**

- Build, lint, and test commands are designed to run in CI environments without interactive prompts.
- All commands produce non-zero exit codes on failure for CI integration.
