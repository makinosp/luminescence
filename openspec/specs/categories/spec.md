# Categories Specification

## Purpose

Expense category management for Firefly III — viewing categories, transaction counts, spending totals, and category-based transaction filtering.

## Requirements

### Requirement: Category List Display

The system SHALL display a list of all Firefly III categories with transaction counts and spending totals.

#### Scenario: Category list (Mobile/Web)

- GIVEN the user is authenticated and navigates to the categories view
- WHEN the category list loads
- THEN all categories are displayed with name, transaction count, and total spending
- AND categories are sorted by total spending descending by default

#### Scenario: Category list (CLI)

- GIVEN the user is authenticated and runs `luminescence categories list`
- WHEN the command executes
- THEN a formatted table of categories is displayed with name, transaction count, and total spending
- AND the `--spent` flag includes aggregated spending data
- AND the `--format table|json|csv` flag controls output format

#### Scenario: Empty category list

- GIVEN the user has no categories in Firefly III
- WHEN the category list is requested
- THEN an empty state message is shown (Mobile/Web) or "No categories found" (CLI)

### Requirement: Category Transaction View

The system SHALL display all transactions assigned to a selected category.

#### Scenario: Category transactions (Mobile/Web)

- GIVEN the user selects a category from the list
- WHEN the category detail view loads
- THEN all transactions assigned to that category are displayed
- AND transactions are sorted by date descending

#### Scenario: Category transactions (CLI)

- GIVEN the user runs `luminescence categories transactions --id <id>`
- WHEN the command executes
- THEN all transactions for that category are displayed in a formatted table
- AND the `--format` flag controls output format

### Requirement: Category Data Freshness

The system SHALL fetch fresh category data from the API on user request.

#### Scenario: Pull-to-refresh (Mobile)

- GIVEN the user is viewing the category list
- WHEN the user pulls to refresh
- THEN the latest category data is fetched from the Firefly III API

#### Scenario: Refresh button (Web)

- GIVEN the user is viewing the category list
- WHEN the user clicks the refresh button
- THEN the latest category data is fetched from the API

#### Scenario: CLI always fresh

- GIVEN the user runs `luminescence categories list`
- WHEN the command executes
- THEN fresh data is always fetched from the API

### Requirement: Error Handling for Category Operations

The system SHALL handle API errors gracefully for category operations.

#### Scenario: API unavailable

- GIVEN the Firefly III API is unreachable
- WHEN the user requests category data
- THEN a user-friendly error is shown with retry option (Mobile/Web) or non-zero exit code with error message (CLI)

#### Scenario: Authentication failure

- GIVEN the stored token is invalid or expired
- WHEN the user requests category data
- THEN the auth failure is detected and handled per the Auth specification
