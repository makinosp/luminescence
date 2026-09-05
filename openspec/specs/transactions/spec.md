# Transactions Specification

## Purpose

Transaction management for Firefly III — listing, searching, filtering, creating, editing, and deleting transactions. Core financial data operations.

## Requirements

### Requirement: Transaction List Display

The system SHALL display a paginated list of transactions with date, description, amount, and category.

#### Scenario: Transaction list (Mobile/Web)

- GIVEN the user is authenticated and navigates to the transaction list
- WHEN the list loads
- THEN transactions are displayed with date, description, amount, and category
- AND the list is sorted by date descending by default
- AND pagination is supported for large transaction sets

#### Scenario: Transaction list (CLI)

- GIVEN the user is authenticated and runs `luminescence transactions list`
- WHEN the command executes
- THEN a formatted table of recent transactions is displayed
- AND `--limit`, `--offset`, `--start`, `--end` flags control pagination and date filtering
- AND `--format table|json|csv` controls output format for scriptable usage

#### Scenario: Empty transaction list

- GIVEN no transactions match the current filter
- WHEN the list is displayed
- THEN a helpful empty state message is shown (Mobile/Web) or "No transactions found" (CLI exits with code 0)

### Requirement: Transaction Search and Filter

The system SHALL allow filtering transactions by date range, category, account, amount range, and description text.

#### Scenario: Date range filter

- GIVEN the user applies a date range filter
- WHEN the filter is applied
- THEN only transactions within the date range are displayed

#### Scenario: Category filter

- GIVEN the user selects a category filter
- WHEN the filter is applied
- THEN only transactions in that category are displayed

#### Scenario: Account filter

- GIVEN the user selects an account filter
- WHEN the filter is applied
- THEN only transactions for that account are displayed

#### Scenario: Amount range filter

- GIVEN the user specifies a minimum and/or maximum amount
- WHEN the filter is applied
- THEN only transactions within the amount range are displayed

#### Scenario: Description text search

- GIVEN the user enters search text
- WHEN the search is applied
- THEN only transactions with matching description text are displayed

#### Scenario: Combined filters

- GIVEN the user applies multiple filters simultaneously
- WHEN the filters are applied
- THEN only transactions matching ALL filters are displayed (AND logic)

#### Scenario: Filter persistence

- GIVEN the user has applied filters
- WHEN the user navigates away and returns within the same session
- THEN the filter state is preserved
- BUT filter state is NOT persisted between sessions

### Requirement: Transaction Creation

The system SHALL allow creating new transactions with required and optional fields.

#### Scenario: Create transaction (Mobile/Web)

- GIVEN the user is authenticated and chooses to create a transaction
- WHEN the user provides required fields (amount, description, transaction type, date) and optional fields (category, account, budget, tags, notes)
- THEN the transaction is submitted to the Firefly III API
- AND on success, a confirmation with the created transaction details is shown

#### Scenario: Create transaction (CLI)

- GIVEN the user is authenticated and runs `luminescence transactions create --amount 50.00 --description "Groceries" --type withdrawal`
- WHEN the command executes
- THEN the transaction is created and the result is displayed
- AND if required flags are omitted, the CLI prompts interactively for missing values

#### Scenario: Transaction type validation

- GIVEN the user creates a withdrawal transaction with a future date
- WHEN the user submits
- THEN a validation error is shown (withdrawals cannot have future dates)

#### Scenario: Negative amount rejected

- GIVEN the user enters a negative amount
- WHEN the user submits
- THEN a validation error is shown with a clear explanation

#### Scenario: Empty description rejected

- GIVEN the user leaves description empty
- WHEN the user submits
- THEN a validation error is shown

### Requirement: Transaction Editing

The system SHALL allow editing existing transactions.

#### Scenario: Edit transaction (Mobile/Web)

- GIVEN the user is viewing a transaction
- WHEN the user chooses to edit it
- THEN a pre-populated form is presented with current values
- AND the user can modify any field
- AND on submit, changes are persisted via the API

#### Scenario: Edit transaction (CLI)

- GIVEN the user runs `luminescence transactions update --id <id> --amount 75.00`
- WHEN the command executes
- THEN only the specified fields are updated
- AND the updated transaction is displayed

#### Scenario: Partial update

- GIVEN the user updates only the description of a transaction
- WHEN the update is submitted
- THEN only the description is changed; other fields remain unchanged

### Requirement: Transaction Deletion

The system SHALL allow deleting transactions with confirmation.

#### Scenario: Delete transaction (Mobile/Web)

- GIVEN the user is viewing a transaction
- WHEN the user chooses to delete it
- THEN a confirmation dialog is shown
- AND on confirmation, the transaction is deleted via the API
- AND the user is returned to the transaction list

#### Scenario: Delete transaction (CLI)

- GIVEN the user runs `luminescence transactions delete --id <id>`
- WHEN the command executes
- THEN interactive confirmation is required unless `--force` flag is provided
- AND on confirmation, the transaction is deleted

### Requirement: Input Validation Before API Submission

The system SHALL validate transaction input client-side before API submission.

#### Scenario: Client-side validation catches errors

- GIVEN the user enters invalid transaction data
- WHEN the user attempts to submit
- THEN validation errors are shown immediately without API call
- AND specific field-level errors are displayed

### Requirement: Error Handling for Transaction Operations

The system SHALL handle API errors gracefully for transaction operations.

#### Scenario: Network error during mutation

- GIVEN a network failure during create/update/delete
- WHEN the operation fails
- THEN a user-friendly error is shown with retry option (Mobile/Web) or non-zero exit code (CLI)
- AND no optimistic update occurs; UI waits for API confirmation

#### Scenario: API validation error

- GIVEN the Firefly III API returns a validation error
- WHEN the error is received
- THEN the specific validation error is displayed to the user

#### Scenario: Authentication failure

- GIVEN the stored token is invalid or expired
- WHEN a transaction operation is attempted
- THEN the auth failure is handled per the Auth specification
