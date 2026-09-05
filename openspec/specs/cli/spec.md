# CLI Specification

## Purpose

Command-line interface for Firefly III — interactive and scriptable operations for transactions, accounts, categories, reports, and configuration. Built with Commander.js.

## Requirements

### Requirement: Command Structure

The system SHALL provide a structured CLI with subcommands for each domain.

#### Scenario: Main command groups

- GIVEN the user runs `luminescence --help`
- WHEN the help is displayed
- THEN the following subcommands are shown: `configure`, `transactions`, `accounts`, `categories`, `reports`

#### Scenario: Subcommand help

- GIVEN the user runs `luminescence transactions --help`
- WHEN the help is displayed
- THEN subcommands `list`, `create`, `update`, `delete`, `show` are shown with their flags

### Requirement: Configuration Command

The system SHALL provide a `configure` command for initial setup and reconfiguration.

#### Scenario: Interactive configuration

- GIVEN the user runs `luminescence configure` with no existing config
- WHEN the command runs interactively
- THEN the user is prompted for server base URL and personal access token
- AND connectivity is validated against Firefly III `/about` endpoint
- AND on success, configuration is persisted

#### Scenario: Non-interactive configuration

- GIVEN the user runs `luminescence configure --base-url https://firefly.example.com --token pat_123`
- WHEN the command executes
- THEN the provided values are validated and connectivity is tested
- AND on success, configuration is persisted without prompts

#### Scenario: Reconfiguration

- GIVEN the user has existing configuration
- WHEN the user runs `luminescence configure`
- THEN the user is prompted for new values (with current values as defaults)
- AND connectivity is re-validated before persisting

### Requirement: Interactive and Scriptable Modes

The system SHALL support both interactive prompting and non-interactive flag-based usage.

#### Scenario: Interactive mode for missing flags

- GIVEN the user runs `luminescence transactions create --amount 50.00` (missing description and type)
- WHEN the command executes
- THEN the CLI prompts interactively for the missing required values
- AND tab completion is supported for known values (categories, account IDs) where feasible

#### Scenario: Scriptable mode with all flags

- GIVEN the user runs `luminescence transactions create --amount 50.00 --description "Groceries" --type withdrawal --category food --account checking`
- WHEN the command executes
- THEN the operation completes without any prompts
- AND exits with appropriate exit code (0 for success)

#### Scenario: Interactive mode opt-out

- GIVEN the user wants to force non-interactive mode
- WHEN the user sets `--no-interactive` flag or `LUMINESCENCE_NON_INTERACTIVE=1` env var
- THEN missing required flags cause an error instead of prompting

### Requirement: Output Formats

The system SHALL support multiple output formats for scriptable usage.

#### Scenario: Table format (default)

- GIVEN the user runs `luminescence transactions list`
- WHEN the command executes
- THEN output is a formatted table (default)

#### Scenario: JSON format

- GIVEN the user runs `luminescence transactions list --format json`
- WHEN the command executes
- THEN output is valid JSON array of transaction objects

#### Scenario: CSV format

- GIVEN the user runs `luminescence transactions list --format csv`
- WHEN the command executes
- Then output is CSV with headers

#### Scenario: Format applies to all list commands

- GIVEN the user runs `luminescence accounts list --format json`
- WHEN the command executes
- THEN output is JSON (similarly for categories, reports)

### Requirement: Exit Codes

The system SHALL use predictable exit codes for script consumption.

#### Exit Code Convention

- `0` — Success
- `1` — User error (invalid flags, validation failure, missing config)
- `2` — API/network error (server unreachable, API error response)
- `3` — Authentication error (invalid/expired token)
- `4` — Storage error (keyring unavailable, config file unreadable)

#### Scenario: Success exit code

- GIVEN a command completes successfully
- WHEN the command exits
- THEN exit code is 0

#### Scenario: Validation error exit code

- GIVEN the user provides invalid flags (e.g., negative amount)
- WHEN the command exits
- THEN exit code is 1

#### Scenario: Network error exit code

- GIVEN the Firefly III API is unreachable
- WHEN the command exits
- THEN exit code is 2

#### Scenario: Auth error exit code

- GIVEN the stored token is invalid or expired
- WHEN the command exits
- THEN exit code is 3

### Requirement: Transaction Commands

The system SHALL provide full CRUD operations for transactions.

#### Scenario: List transactions

- GIVEN the user runs `luminescence transactions list [--limit N] [--offset N] [--start DATE] [--end DATE] [--format FMT]`
- WHEN the command executes
- THEN a paginated, filtered list is displayed in the specified format

#### Scenario: Create transaction

- GIVEN the user runs `luminescence transactions create --amount N --description STR --type withdrawal|deposit|transfer [--category ID] [--account ID] [--date DATE] [--format FMT]`
- WHEN the command executes
- THEN the transaction is created and displayed in the specified format

#### Scenario: Show transaction

- GIVEN the user runs `luminescence transactions show --id ID [--format FMT]`
- WHEN the command executes
- THEN the transaction details are displayed

#### Scenario: Update transaction

- GIVEN the user runs `luminescence transactions update --id ID [--amount N] [--description STR] [--type TYPE] [--category ID] [--account ID] [--date DATE] [--format FMT]`
- WHEN the command executes
- THEN only specified fields are updated and the result is displayed

#### Scenario: Delete transaction

- GIVEN the user runs `luminescence transactions delete --id ID [--force] [--format FMT]`
- WHEN the command executes
- THEN confirmation is required unless `--force` is provided
- AND on confirmation, the transaction is deleted

### Requirement: Account Commands

The system SHALL provide account listing and detail commands.

#### Scenario: List accounts

- GIVEN the user runs `luminescence accounts list [--type asset|liability|revenue|expense] [--format FMT]`
- WHEN the command executes
- Then accounts are displayed, optionally filtered by type

#### Scenario: Show account

- GIVEN the user runs `luminescence accounts show --id ID [--format FMT]`
- WHEN the command executes
- Then account details with balance and recent transactions are displayed

### Requirement: Category Commands

The system SHALL provide category listing and transaction filtering.

#### Scenario: List categories

- GIVEN the user runs `luminescence categories list [--spent] [--format FMT]`
- WHEN the command executes
- Then categories are displayed with optional spending aggregation

#### Scenario: Category transactions

- GIVEN the user runs `luminescence categories transactions --id ID [--format FMT]`
- WHEN the command executes
- Then all transactions for that category are displayed

### Requirement: Report Commands

The system SHALL provide report generation commands.

#### Scenario: Spending report

- GIVEN the user runs `luminescence reports spending --period current_month|last_month|last_3_months|custom [--start DATE] [--end DATE] [--format FMT]`
- WHEN the command executes
- Then spending overview is displayed

#### Scenario: Cashflow report

- GIVEN the user runs `luminescence reports cashflow --period PERIOD [--format FMT]`
- WHEN the command executes
- Then income vs expenses is displayed

#### Scenario: Category spending report

- GIVEN the user runs `luminescence reports categories --period PERIOD [--format FMT]`
- WHEN the command executes
- Then spending by category is displayed

#### Scenario: Trends report

- GIVEN the user runs `luminescence reports trends --months N [--format FMT]`
- WHEN the command executes
- Then spending trend analysis is displayed

### Requirement: Error Handling and User Feedback

The system SHALL provide clear, actionable error messages.

#### Scenario: Missing configuration

- GIVEN no valid configuration exists
- WHEN any authenticated command is run
- THEN an error is displayed with instructions to run `luminescence configure`
- AND exit code is 1

#### Scenario: Network error

- GIVEN the API is unreachable
- WHEN a command is run
- THEN a user-friendly message is shown (e.g., "Unable to connect to Firefly III server at https://...")
- AND exit code is 2

#### Scenario: Authentication error

- GIVEN the token is invalid or expired
- WHEN a command is run
- THEN an error indicates authentication failure with reconfiguration instructions
- AND exit code is 3

#### Scenario: Validation error

- GIVEN the user provides invalid input
- WHEN a command is run
- THEN a specific validation error is shown (e.g., "Amount must be positive", "Date must be in YYYY-MM-DD format")
- AND exit code is 1

### Requirement: Global Flags

The system SHALL support global flags for common options.

#### Scenario: Verbose output

- GIVEN the user runs any command with `--verbose`
- WHEN the command executes
- Then additional debug information is logged to stderr

#### Scenario: Config file override

- GIVEN the user runs any command with `--config /path/to/config.json`
- WHEN the command executes
- Then the specified config file is used instead of the default location

#### Scenario: Base URL override

- GIVEN the user runs any command with `--base-url https://...`
- WHEN the command executes
- Then the provided base URL overrides the configured one for that command only
