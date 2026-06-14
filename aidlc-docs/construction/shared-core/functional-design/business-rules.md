# Shared Core - Business Rules

## 1. Transaction Type Rules

### 1.1 Transaction Type Definitions

| Type | Description | Source Account | Destination Account | Amount Sign |
|------|-------------|---------------|--------------------|----|
| **Deposit** | Money coming in | Revenue account | Asset account | Positive (+) |
| **Withdrawal** | Money going out | Asset account | Expense account | Negative (−) |
| **Transfer** | Money between accounts | Asset account | Asset account | Neutral (0) |

### 1.2 Strict Account Pairing (Clarification Q3: A)

Every transaction type requires both a source (`fromAccountId`) and destination (`toAccountId`) account. The account types must match the transaction type:

```
DEPOSIT:     fromAccount.type === 'revenue'  AND toAccount.type === 'asset'
WITHDRAWAL:  fromAccount.type === 'asset'    AND toAccount.type === 'expense'
TRANSFER:    fromAccount.type === 'asset'    AND toAccount.type === 'asset' AND fromAccount.id !== toAccount.id
```

**Validation rule**: If account types do not match the transaction type, a `ValidationError` is returned with field-level errors on `fromAccountId` and/or `toAccountId`.

### 1.3 Transfer-Specific Rules

- **Distinct accounts**: `fromAccountId` and `toAccountId` must be different. A transfer from account A to account A is invalid.
- **Same currency**: Both accounts must share the same `currencyCode`. Cross-currency transfers are not supported in the current baseline.
- **No category**: Transfers typically do not have a category assignment. If provided, it is accepted but may be ignored by Firefly III.

---

## 2. Amount Validation Rules

### 2.1 Precision (Clarification Q1: C)

- Amounts are positive numbers with **up to 2 decimal places**.
- `50`, `50.5`, `50.50` are all valid.
- `50.555` is invalid (more than 2 decimal places).
- Negative amounts and zero are rejected.

### 2.2 Sign Convention

- All transaction amounts are stored as **positive numbers**.
- The sign is determined by the transaction type:
  - Deposits → money increases (positive net)
  - Withdrawals → money decreases (negative net)
  - Transfers → neutral (no net change in total wealth)

### 2.3 Upper Bound

- No domain-level upper bound is enforced.
- The Firefly III API may impose its own limits; these are surfaced as `APIError` responses.

### 2.4 Currency Handling

- Each account has its own `currencyCode` (ISO 4217).
- For transfers, both accounts must share the same currency.
- Currency conversion is **out of scope** for the current baseline.

---

## 3. Date Validation Rules

### 3.1 Basic Rules (Clarification Q2: C)

- Date must be a valid `Date` object.
- Date must be after `1970-01-01`.
- **Future dates are allowed** but produce a **validation warning** (not an error).
- The warning message: `"This transaction is dated in the future. Please confirm this is intentional."`

### 3.2 Transaction Type Date Constraints

| Transaction Type | Future Date | Notes |
|-----------------|-------------|-------|
| Deposit | Allowed (with warning) | Future-dated deposits may represent scheduled income |
| Withdrawal | Allowed (with warning) | Future-dated withdrawals may represent scheduled bills |
| Transfer | Allowed (with warning) | Future-dated transfers may represent planned moves |

### 3.3 Report Date Constraints

- Report `startDate` must be before `endDate`.
- Report date range must not exceed 5 years.
- Reports for future periods return empty data (no error).

---

## 4. Account Type Constraints

### 4.1 Account Types

| Type | Description | Can Be Source For | Can Be Destination For |
|------|-------------|-------------------|----------------------|
| **Asset** | Bank accounts, savings | Withdrawal, Transfer | Deposit, Transfer |
| **Liability** | Credit cards, loans | — | — |
| **Revenue** | Income sources | Deposit | — |
| **Expense** | Expense categories | — | Withdrawal |

### 4.2 Active Account Requirement

- Only **active** accounts (`isActive === true`) can participate in transactions.
- Inactive accounts appear in list views but cannot be selected for new transactions.

### 4.3 Account Deletion

- Accounts with associated transactions cannot be deleted (Firefly III constraint).
- The API client surfaces this as an `APIError` with an appropriate message.

---

## 5. Category Assignment Rules

### 5.1 Optional Assignment

- Category assignment is **optional** for all transaction types.
- Transactions without a category are treated as "uncategorized" in reports.

### 5.2 Category Validation

- If `categoryId` is provided, it must be a non-empty string.
- The category must exist in the user's Firefly III instance.
- Invalid category IDs are caught by the API and surfaced as `APIError`.

### 5.3 Category Deletion

- If a category is deleted in Firefly III, transactions previously assigned to it become "uncategorized."
- The client handles this gracefully by displaying "Uncategorized" in reports.

---

## 6. Report Period and Aggregation Rules

### 6.1 Period Presets (Clarification Q7: C — Hybrid)

| Preset | Description | Date Range Calculation |
|--------|-------------|----------------------|
| `current_month` | Current calendar month | 1st of current month → last day of current month |
| `last_month` | Previous calendar month | 1st of previous month → last day of previous month |
| `last_3_months` | Last 3 calendar months | 1st of (current month - 2) → last day of current month |
| `custom` | User-specified range | User provides `startDate` and `endDate` |

### 6.2 Aggregation Rules

- **Income**: Sum of all `deposit` transactions within the period.
- **Expenses**: Sum of all `withdrawal` transactions within the period.
- **Net Cashflow**: `totalIncome - totalExpenses`.
- **Category Breakdown**: Only withdrawals are counted. Deposits and transfers are excluded.
- **Percentage**: `(categorySpent / totalExpenses) * 100`, rounded to 2 decimal places.
- **Sorting**: Category breakdown sorted by `totalSpent` descending.

### 6.3 Transfer Handling in Reports

- Transfers are **excluded** from income/expense calculations.
- A transfer from Asset A to Asset B does not change the user's total wealth.
- Transfers may appear in a separate "Transfer" section in detailed reports (future enhancement).

### 6.4 Client-Side vs Server-Side (Clarification Q7: C)

- **Standard reports** (spending overview, income vs expenses): Use Firefly III's built-in report API endpoints.
- **Custom queries** (ad-hoc date ranges, specific category analysis): Calculate client-side from transaction data.
- The `ReportService` abstracts this distinction from the UI layer.

---

## 7. Validation Error Rules (Clarification Q8: A)

### 7.1 Field-Level Errors

All validation errors are returned as a `Map<field, message>`:

```typescript
// Example: Invalid transaction input
const result = validateTransactionInput({
  type: 'withdrawal',
  amount: -50,
  description: '',
  date: new Date(),
  fromAccountId: '1',
});

// result.errors:
// Map {
//   'amount' → 'Amount must be greater than zero',
//   'description' → 'Description is required',
// }
```

### 7.2 Error Message Guidelines

- Messages are **user-friendly** and **actionable**.
- Messages do **not** expose internal details (field types, regex patterns, etc.).
- Messages are in **English** (per project conventions).
- Field names in error maps use **camelCase** to match input data structure.

### 7.3 Validation Error Fields

| Field | Validation | Error Message |
|-------|-----------|---------------|
| `type` | Must be deposit/withdrawal/transfer | `"Transaction type must be deposit, withdrawal, or transfer"` |
| `amount` | Positive, max 2 decimals | `"Amount must be greater than zero"` / `"Amount must have at most 2 decimal places"` |
| `description` | Required, max 1000 chars | `"Description is required"` / `"Description must be 1000 characters or fewer"` |
| `date` | Valid date, after 1970 | `"A valid date is required"` / `"Date must be after 1970-01-01"` |
| `fromAccountId` | Required, non-empty | `"Source account is required"` |
| `toAccountId` | Required for transfers | `"Destination account is required for transfers"` |
| `categoryId` | Optional, non-empty if provided | `"Category ID must be a non-empty string if provided"` |
| `budgetId` | Optional, non-empty if provided | `"Budget ID must be a non-empty string if provided"` |
| `tags` | Optional, array of strings | `"Tags must be an array of strings"` |

---

## 8. Business Invariants Summary

| # | Invariant | Enforced By |
|---|-----------|-------------|
| INV-01 | Transaction amount is always positive | `validateAmount()` |
| INV-02 | Transaction type determines account pairing | `validateTransactionInput()` + `TRANSACTION_ACCOUNT_REQUIREMENTS` |
| INV-03 | Transfers require two distinct asset accounts | `validateTransactionInput()` |
| INV-04 | Future dates produce warnings, not errors | `getDateWarning()` |
| INV-05 | All domain models are immutable | TypeScript `readonly` + `Object.freeze()` |
| INV-06 | Validation errors are field-level | `ValidationResult.errors` Map |
| INV-07 | Transfers excluded from income/expense reports | `calculateSpendingOverview()` |
| INV-08 | Only active accounts can participate in transactions | `canBeWithdrawalSource()` / `canBeDepositDestination()` |
| INV-09 | Category assignment is optional | `validateTransactionInput()` |
| INV-10 | Report date range ≤ 5 years | `validateDateRange()` |
