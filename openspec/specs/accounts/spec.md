# Accounts Specification

## Purpose

Account management for Firefly III — viewing accounts, balances, types, and filtering. Provides read-only access to account data from the Firefly III API.

## Requirements

### Requirement: Account List Display

The system SHALL display a list of all Firefly III accounts with name, type, and current balance.

#### Scenario: Account list (Mobile/Web)

- GIVEN the user is authenticated and navigates to the accounts view
- WHEN the account list loads
- THEN all accounts are displayed with name, type (asset, liability, revenue, expense), and current balance
- AND accounts are shown in a card or list view with visual indicators for account type

#### Scenario: Account list (CLI)

- GIVEN the user is authenticated and runs `luminescence accounts list`
- WHEN the command executes
- THEN a formatted table of accounts is displayed with name, type, and balance
- AND the `--type` flag filters by account type (asset, liability, revenue, expense)
- AND the `--format table|json|csv` flag controls output format

#### Scenario: Empty account list

- GIVEN the user has no accounts in Firefly III
- WHEN the account list is requested
- THEN an empty state message is shown (Mobile/Web) or "No accounts found" (CLI)
- AND no error is displayed

### Requirement: Account Detail View

The system SHALL display detailed information for a selected account.

#### Scenario: Account detail (Mobile/Web)

- GIVEN the user selects an account from the list
- WHEN the detail view loads
- THEN the account's balance, currency, and recent transactions are displayed

#### Scenario: Account detail (CLI)

- GIVEN the user runs `luminescence accounts show --id <id>`
- WHEN the command executes
- THEN the account's details including balance, currency, and recent transactions are displayed

### Requirement: Account Type Filtering

The system SHALL allow filtering accounts by type.

#### Scenario: Filter by asset accounts

- GIVEN the user wants to see only asset accounts
- WHEN the user applies the asset filter (Mobile/Web) or uses `--type asset` (CLI)
- THEN only accounts of type "asset" are displayed

#### Scenario: Filter by liability accounts

- GIVEN the user wants to see only liability accounts
- WHEN the user applies the liability filter
- THEN only accounts of type "liability" are displayed

### Requirement: Account Data Freshness

The system SHALL fetch fresh account data from the API on user request.

#### Scenario: Pull-to-refresh (Mobile)

- GIVEN the user is viewing the account list
- WHEN the user pulls to refresh
- THEN the latest account data is fetched from the Firefly III API

#### Scenario: Refresh button (Web)

- GIVEN the user is viewing the account list
- WHEN the user clicks the refresh button
- THEN the latest account data is fetched from the API

#### Scenario: CLI always fresh

- GIVEN the user runs `luminescence accounts list`
- WHEN the command executes
- THEN fresh data is always fetched from the API (no local caching for CLI)

### Requirement: Error Handling for Account Operations

The system SHALL handle API errors gracefully for account operations.

#### Scenario: API unavailable

- GIVEN the Firefly III API is unreachable
- WHEN the user requests account data
- THEN a user-friendly error is shown with retry option (Mobile/Web) or non-zero exit code with error message (CLI)
- AND no stack traces or internal details are exposed

#### Scenario: Authentication failure during account fetch

- GIVEN the stored token is invalid or expired
- WHEN the user requests account data
- THEN the auth failure is detected and handled per the Auth specification
