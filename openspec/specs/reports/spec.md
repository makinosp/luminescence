# Reports Specification

## Purpose

Financial reporting and visualization for Firefly III — spending overviews, category breakdowns, income vs expenses, trend analysis, and period selection.

## Requirements

### Requirement: Spending Overview Dashboard

The system SHALL display a spending overview dashboard with key metrics.

#### Scenario: Spending overview (Mobile/Web)

- GIVEN the user is authenticated and navigates to the reports view
- WHEN the dashboard loads
- THEN spending by category, spending over time, and income vs expenses are displayed
- AND data reflects the currently selected period

#### Scenario: Spending overview (CLI)

- GIVEN the user is authenticated and runs `luminescence reports spending --period monthly`
- WHEN the command executes
- THEN a textual summary with formatted tables and basic ASCII indicators is displayed

### Requirement: Period Selection

The system SHALL allow users to select a date range for reports.

#### Scenario: Predefined periods

- GIVEN the user is viewing reports
- WHEN the user selects "current month", "last month", or "last 3 months"
- THEN the report data refreshes for the selected period

#### Scenario: Custom date range

- GIVEN the user is viewing reports
- WHEN the user specifies a custom start and end date
- THEN the report data refreshes for the custom range
- AND validation ensures start date is before end date

#### Scenario: Period persistence

- GIVEN the user selects a period
- WHEN the user navigates away and returns within the same session
- THEN the selected period is preserved

### Requirement: Spending by Category Breakdown

The system SHALL display spending broken down by category.

#### Scenario: Category breakdown (Mobile/Web)

- GIVEN the user is viewing reports
- WHEN the category breakdown is displayed
- THEN each category shows amount spent and percentage of total
- AND categories are sorted by amount descending

#### Scenario: Category breakdown (CLI)

- GIVEN the user runs `luminescence reports categories --period monthly`
- WHEN the command executes
- THEN a table of categories with amounts and percentages is displayed

### Requirement: Income vs Expenses Comparison

The system SHALL compare income versus expenses for the selected period.

#### Scenario: Income vs expenses (Mobile/Web)

- GIVEN the user is viewing reports
- WHEN the income vs expenses view is displayed
- THEN total income, total expenses, and net cashflow are shown
- AND a visual indicator shows whether cashflow is positive or negative

#### Scenario: Income vs expenses (CLI)

- GIVEN the user runs `luminescence reports cashflow --period monthly`
- WHEN the command executes
- Then income, expenses, and net are displayed in a formatted table

### Requirement: Spending Trend Analysis

The system SHALL analyze spending trends over multiple months.

#### Scenario: Trend analysis (Mobile/Web)

- GIVEN the user is viewing reports
- WHEN the trend analysis is displayed
- THEN spending trends over the last N months are shown (increasing/decreasing/volatility)

#### Scenario: Trend analysis (CLI)

- GIVEN the user runs `luminescence reports trends --months 6`
- WHEN the command executes
- Then trend data is displayed in a formatted table

### Requirement: Visualizations (Web Only)

The system SHALL render charts and graphs for reports on the Web client.

#### Scenario: Pie chart for category breakdown

- GIVEN the user is on the Web client viewing reports
- WHEN the category breakdown is displayed
- THEN a pie chart visualizes spending by category

#### Scenario: Line chart for spending over time

- GIVEN the user is on the Web client viewing reports
- WHEN the spending over time view is displayed
- Then a line chart shows spending trends

### Requirement: Error Handling for Report Operations

The system SHALL handle API errors gracefully for report operations.

#### Scenario: API unavailable

- GIVEN the Firefly III API is unreachable
- WHEN the user requests report data
- THEN a user-friendly error is shown with retry option (Mobile/Web) or non-zero exit code (CLI)

#### Scenario: Invalid period

- GIVEN the user specifies an invalid period (e.g., end before start)
- WHEN the report is requested
- THEN a validation error is shown with a clear explanation

#### Scenario: Authentication failure

- GIVEN the stored token is invalid or expired
- WHEN a report operation is attempted
- THEN the auth failure is handled per the Auth specification
