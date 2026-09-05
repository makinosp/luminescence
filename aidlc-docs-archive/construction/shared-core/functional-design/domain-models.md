# Shared Core - Domain Models & Business Logic

## 1. Transaction Domain Model

### 1.1 Core Type Definitions

```typescript
/**
 * Transaction type enum per Firefly III API.
 * Clarification Q3 Answer A: Strict account pairing enforced.
 */
export type TransactionType = "deposit" | "withdrawal" | "transfer";

/**
 * Transaction type display labels for UI rendering.
 */
export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
    deposit: "Deposit",
    withdrawal: "Withdrawal",
    transfer: "Transfer",
};

/**
 * Transaction type determines the sign of netAmount().
 * Deposits → positive (money coming in)
 * Withdrawals → negative (money going out)
 * Transfers → neutral (money moving between accounts)
 */
export const TRANSACTION_TYPE_SIGN: Record<TransactionType, 1 | -1 | 0> = {
    deposit: 1,
    withdrawal: -1,
    transfer: 0,
};
```

### 1.2 Transaction Interface (Immutable)

```typescript
/**
 * Immutable Transaction domain model.
 * All properties are readonly to enforce immutability.
 * Created via factory functions, never mutated directly.
 */
export interface Transaction {
    readonly id: string;
    readonly type: TransactionType;
    readonly amount: number; // Positive decimal, max 2 decimal places (Clarification Q1: C)
    readonly description: string; // 1-1000 chars
    readonly date: Date; // Transaction date (Clarification Q2: C, future dates allowed with warning)
    readonly fromAccountId: string; // Source account ID (always required)
    readonly toAccountId?: string; // Destination account ID (required for transfers)
    readonly categoryId?: string; // Optional category assignment
    readonly budgetId?: string; // Optional budget assignment
    readonly tags: readonly string[]; // Immutable tag list
    readonly createdAt: Date; // Firefly III creation timestamp
    readonly updatedAt: Date; // Firefly III update timestamp
}
```

### 1.3 Transaction Type Account Requirements

Per Clarification Q3 Answer A — Strict account pairing:

```typescript
/**
 * Account requirements per transaction type.
 * Used by ValidationService to enforce business rules.
 */
export const TRANSACTION_ACCOUNT_REQUIREMENTS: Record<
    TransactionType,
    {
        fromRequired: boolean;
        toRequired: boolean;
        fromAccountTypes: string[];
        toAccountTypes: string[];
    }
> = {
    deposit: {
        fromRequired: true,
        toRequired: true,
        fromAccountTypes: ["revenue"], // Revenue account as source
        toAccountTypes: ["asset"], // Asset account as destination
    },
    withdrawal: {
        fromRequired: true,
        toRequired: true,
        fromAccountTypes: ["asset"], // Asset account as source
        toAccountTypes: ["expense"], // Expense account as destination
    },
    transfer: {
        fromRequired: true,
        toRequired: true,
        fromAccountTypes: ["asset"], // Asset account as source
        toAccountTypes: ["asset"], // Asset account as destination
    },
};
```

### 1.4 Transaction Validators (Pure Functions — PBT-Suitable)

```typescript
/**
 * Validation result type used across all validators.
 */
export interface ValidationResult {
    readonly isValid: boolean;
    readonly errors: ReadonlyMap<string, string>; // field → error message
}

/**
 * Creates an empty successful validation result.
 */
export function validResult(): ValidationResult {
    return { isValid: true, errors: new Map() };
}

/**
 * Creates a failed validation result with field-level errors.
 */
export function invalidResult(errors: Map<string, string>): ValidationResult {
    return { isValid: false, errors };
}

/**
 * Amount validation rules (Clarification Q1: C):
 * - Must be positive (> 0)
 * - Maximum 2 decimal places
 * - No upper bound enforced at domain level (API may impose limits)
 */
export function validateAmount(amount: unknown): ValidationResult {
    const errors = new Map<string, string>();

    if (typeof amount !== "number" || isNaN(amount)) {
        errors.set("amount", "Amount must be a valid number");
        return invalidResult(errors);
    }

    if (amount <= 0) {
        errors.set("amount", "Amount must be greater than zero");
    }

    // Check decimal precision: multiply by 100 and check if integer
    const scaled = Math.round(amount * 100);
    if (Math.abs(scaled / 100 - amount) > 1e-10) {
        errors.set("amount", "Amount must have at most 2 decimal places");
    }

    return errors.size > 0 ? invalidResult(errors) : validResult();
}

/**
 * Description validation rules:
 * - Required (non-empty after trimming)
 * - Maximum 1000 characters
 */
export function validateDescription(description: unknown): ValidationResult {
    const errors = new Map<string, string>();

    if (typeof description !== "string") {
        errors.set("description", "Description is required");
        return invalidResult(errors);
    }

    const trimmed = description.trim();
    if (trimmed.length === 0) {
        errors.set("description", "Description is required");
    } else if (trimmed.length > 1000) {
        errors.set("description", "Description must be 1000 characters or fewer");
    }

    return errors.size > 0 ? invalidResult(errors) : validResult();
}

/**
 * Date validation rules (Clarification Q2: C):
 * - Must be a valid Date object
 * - Future dates allowed but produce a warning (not an error)
 * - Date must not be before 1970-01-01
 */
export function validateDate(date: unknown): ValidationResult {
    const errors = new Map<string, string>();

    if (!(date instanceof Date) || isNaN(date.getTime())) {
        errors.set("date", "A valid date is required");
        return invalidResult(errors);
    }

    const epoch = new Date("1970-01-01T00:00:00Z");
    if (date < epoch) {
        errors.set("date", "Date must be after 1970-01-01");
    }

    return errors.size > 0 ? invalidResult(errors) : validResult();
}

/**
 * Warning result for non-blocking validation issues.
 */
export interface ValidationWarning {
    readonly field: string;
    readonly message: string;
}

/**
 * Check if a date is in the future and should produce a warning.
 */
export function getDateWarning(date: Date): ValidationWarning | null {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const txDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (txDate > today) {
        return {
            field: "date",
            message: "This transaction is dated in the future. Please confirm this is intentional.",
        };
    }
    return null;
}

/**
 * Transaction type validation:
 * - Must be one of: 'deposit', 'withdrawal', 'transfer'
 */
export function validateTransactionType(type: unknown): ValidationResult {
    const errors = new Map<string, string>();
    const validTypes: string[] = ["deposit", "withdrawal", "transfer"];

    if (typeof type !== "string" || !validTypes.includes(type)) {
        errors.set("type", "Transaction type must be deposit, withdrawal, or transfer");
    }

    return errors.size > 0 ? invalidResult(errors) : validResult();
}

/**
 * Comprehensive transaction input validation.
 * Combines all field-level validators per Clarification Q8 Answer A (field-level errors).
 */
export function validateTransactionInput(input: {
    type?: unknown;
    amount?: unknown;
    description?: unknown;
    date?: unknown;
    fromAccountId?: unknown;
    toAccountId?: unknown;
    categoryId?: unknown;
    budgetId?: unknown;
    tags?: unknown;
}): ValidationResult {
    const errors = new Map<string, string>();

    // Type validation
    const typeResult = validateTransactionType(input.type);
    if (!typeResult.isValid) {
        typeResult.errors.forEach((msg, field) => errors.set(field, msg));
    }

    // Amount validation
    const amountResult = validateAmount(input.amount);
    if (!amountResult.isValid) {
        amountResult.errors.forEach((msg, field) => errors.set(field, msg));
    }

    // Description validation
    const descResult = validateDescription(input.description);
    if (!descResult.isValid) {
        descResult.errors.forEach((msg, field) => errors.set(field, msg));
    }

    // Date validation
    const dateResult = validateDate(input.date);
    if (!dateResult.isValid) {
        dateResult.errors.forEach((msg, field) => errors.set(field, msg));
    }

    // Account ID validation
    if (typeof input.fromAccountId !== "string" || input.fromAccountId.trim().length === 0) {
        errors.set("fromAccountId", "Source account is required");
    }

    // Transfer requires destination account
    if (input.type === "transfer") {
        if (typeof input.toAccountId !== "string" || input.toAccountId.trim().length === 0) {
            errors.set("toAccountId", "Destination account is required for transfers");
        }
    }

    // Optional field validation
    if (input.categoryId !== undefined && input.categoryId !== null) {
        if (typeof input.categoryId !== "string" || input.categoryId.trim().length === 0) {
            errors.set("categoryId", "Category ID must be a non-empty string if provided");
        }
    }

    if (input.budgetId !== undefined && input.budgetId !== null) {
        if (typeof input.budgetId !== "string" || input.budgetId.trim().length === 0) {
            errors.set("budgetId", "Budget ID must be a non-empty string if provided");
        }
    }

    if (input.tags !== undefined && input.tags !== null) {
        if (
            !Array.isArray(input.tags) ||
            !input.tags.every((t: unknown) => typeof t === "string")
        ) {
            errors.set("tags", "Tags must be an array of strings");
        }
    }

    return errors.size > 0 ? invalidResult(errors) : validResult();
}
```

### 1.5 Transaction Business Logic (Pure Functions — PBT-Suitable)

```typescript
/**
 * Calculate the net amount considering transaction type.
 * Deposits → positive, Withdrawals → negative, Transfers → 0 (neutral).
 */
export function netAmount(transaction: Transaction): number {
    return transaction.amount * TRANSACTION_TYPE_SIGN[transaction.type];
}

/**
 * Check if the transaction is a withdrawal.
 */
export function isWithdrawal(transaction: Transaction): boolean {
    return transaction.type === "withdrawal";
}

/**
 * Check if the transaction is a deposit.
 */
export function isDeposit(transaction: Transaction): boolean {
    return transaction.type === "deposit";
}

/**
 * Check if the transaction is a transfer.
 */
export function isTransfer(transaction: Transaction): boolean {
    return transaction.type === "transfer";
}

/**
 * Check if the transaction involves a specific account.
 */
export function involvesAccount(transaction: Transaction, accountId: string): boolean {
    return transaction.fromAccountId === accountId || transaction.toAccountId === accountId;
}

/**
 * Get the counterpart account ID for a transaction.
 * For deposits: fromAccount is revenue, toAccount is asset → counterpart is toAccount
 * For withdrawals: fromAccount is asset, toAccount is expense → counterpart is fromAccount
 * For transfers: returns the "other" account
 */
export function getCounterpartAccountId(
    transaction: Transaction,
    accountId: string,
): string | undefined {
    if (transaction.fromAccountId === accountId) {
        return transaction.toAccountId;
    }
    if (transaction.toAccountId === accountId) {
        return transaction.fromAccountId;
    }
    return undefined;
}
```

---

## 2. Account Domain Model

### 2.1 Core Type Definitions

```typescript
/**
 * Account type enum per Firefly III API.
 */
export type AccountType = "asset" | "liability" | "revenue" | "expense";

/**
 * Account type display labels.
 */
export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
    asset: "Asset",
    liability: "Liability",
    revenue: "Revenue",
    expense: "Expense",
};
```

### 2.2 Account Interface (Immutable)

```typescript
/**
 * Immutable Account domain model.
 */
export interface Account {
    readonly id: string;
    readonly name: string; // Account display name
    readonly type: AccountType; // Account type classification
    readonly currencyCode: string; // ISO 4217 currency code (e.g., 'USD', 'EUR')
    readonly balance: number; // Current balance in account currency
    readonly isActive: boolean; // Whether the account is active
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
```

### 2.3 Account Validators (Pure Functions — PBT-Suitable)

```typescript
/**
 * Account name validation:
 * - Required, non-empty after trimming
 * - Maximum 255 characters
 */
export function validateAccountName(name: unknown): ValidationResult {
    const errors = new Map<string, string>();

    if (typeof name !== "string") {
        errors.set("name", "Account name is required");
        return invalidResult(errors);
    }

    const trimmed = name.trim();
    if (trimmed.length === 0) {
        errors.set("name", "Account name is required");
    } else if (trimmed.length > 255) {
        errors.set("name", "Account name must be 255 characters or fewer");
    }

    return errors.size > 0 ? invalidResult(errors) : validResult();
}

/**
 * Account type validation.
 */
export function validateAccountType(type: unknown): ValidationResult {
    const errors = new Map<string, string>();
    const validTypes: string[] = ["asset", "liability", "revenue", "expense"];

    if (typeof type !== "string" || !validTypes.includes(type)) {
        errors.set("type", "Account type must be asset, liability, revenue, or expense");
    }

    return errors.size > 0 ? invalidResult(errors) : validResult();
}

/**
 * Currency code validation (ISO 4217).
 * Validates format: 3 uppercase letters.
 */
export function validateCurrencyCode(code: unknown): ValidationResult {
    const errors = new Map<string, string>();

    if (typeof code !== "string" || !/^[A-Z]{3}$/.test(code)) {
        errors.set(
            "currencyCode",
            "Currency code must be a valid ISO 4217 code (3 uppercase letters)",
        );
    }

    return errors.size > 0 ? invalidResult(errors) : validResult();
}
```

### 2.4 Account Business Logic (Pure Functions — PBT-Suitable)

```typescript
/**
 * Check if the account is an asset account (has balance tracking).
 */
export function isAssetAccount(account: Account): boolean {
    return account.type === "asset";
}

/**
 * Check if the account is a liability account.
 */
export function isLiabilityAccount(account: Account): boolean {
    return account.type === "liability";
}

/**
 * Check if the account can be used as a source for withdrawals.
 */
export function canBeWithdrawalSource(account: Account): boolean {
    return account.type === "asset" && account.isActive;
}

/**
 * Check if the account can be used as a destination for deposits.
 */
export function canBeDepositDestination(account: Account): boolean {
    return account.type === "asset" && account.isActive;
}

/**
 * Check if the account can participate in transfers.
 */
export function canParticipateInTransfer(account: Account): boolean {
    return account.type === "asset" && account.isActive;
}
```

---

## 3. Category Domain Model

### 3.1 Core Type Definitions

```typescript
/**
 * Immutable Category domain model.
 */
export interface Category {
    readonly id: string;
    readonly name: string; // Category display name
    readonly description?: string; // Optional description
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
```

### 3.2 Category Validators (Pure Functions — PBT-Suitable)

```typescript
/**
 * Category name validation:
 * - Required, non-empty after trimming
 * - Maximum 255 characters
 */
export function validateCategoryName(name: unknown): ValidationResult {
    const errors = new Map<string, string>();

    if (typeof name !== "string") {
        errors.set("name", "Category name is required");
        return invalidResult(errors);
    }

    const trimmed = name.trim();
    if (trimmed.length === 0) {
        errors.set("name", "Category name is required");
    } else if (trimmed.length > 255) {
        errors.set("name", "Category name must be 255 characters or fewer");
    }

    return errors.size > 0 ? invalidResult(errors) : validResult();
}
```

### 3.3 Category Business Logic (Pure Functions — PBT-Suitable)

```typescript
/**
 * Group transactions by category ID.
 * Returns a Map of categoryId → Transaction[].
 * Transactions without a category are grouped under key 'uncategorized'.
 */
export function groupTransactionsByCategory(
    transactions: readonly Transaction[],
): ReadonlyMap<string, readonly Transaction[]> {
    const groups = new Map<string, Transaction[]>();

    for (const tx of transactions) {
        const key = tx.categoryId ?? "uncategorized";
        const existing = groups.get(key);
        if (existing) {
            existing.push(tx);
        } else {
            groups.set(key, [tx]);
        }
    }

    return groups;
}

/**
 * Calculate total spending by category.
 * Only includes withdrawals (negative net amount).
 * Returns a Map of categoryId → total spent (positive number).
 */
export function calculateSpendingByCategory(
    transactions: readonly Transaction[],
): ReadonlyMap<string, number> {
    const spending = new Map<string, number>();

    for (const tx of transactions) {
        if (!isWithdrawal(tx)) continue;

        const key = tx.categoryId ?? "uncategorized";
        const current = spending.get(key) ?? 0;
        spending.set(key, current + tx.amount);
    }

    return spending;
}
```

---

## 4. Report Domain Model

### 4.1 Core Type Definitions

```typescript
/**
 * Report period presets (Clarification Q7: C — Hybrid approach).
 */
export type ReportPeriod = "current_month" | "last_month" | "last_3_months" | "custom";

/**
 * Custom date range for reports.
 */
export interface DateRange {
    readonly startDate: Date;
    readonly endDate: Date;
}

/**
 * Spending overview report data.
 */
export interface SpendingOverview {
    readonly period: ReportPeriod;
    readonly dateRange: DateRange;
    readonly totalIncome: number;
    readonly totalExpenses: number;
    readonly netCashflow: number;
    readonly categoryBreakdown: readonly CategorySpending[];
}

/**
 * Category spending breakdown item.
 */
export interface CategorySpending {
    readonly categoryId: string;
    readonly categoryName: string;
    readonly totalSpent: number;
    readonly percentage: number; // 0-100
    readonly transactionCount: number;
}

/**
 * Income vs expenses report data.
 */
export interface IncomeVsExpensesReport {
    readonly period: ReportPeriod;
    readonly dateRange: DateRange;
    readonly income: number;
    readonly expenses: number;
    readonly netCashflow: number;
}

/**
 * Trend data point.
 */
export interface TrendDataPoint {
    readonly month: string; // YYYY-MM format
    readonly income: number;
    readonly expenses: number;
    readonly netCashflow: number;
}

/**
 * Trend analysis report.
 */
export interface TrendAnalysis {
    readonly months: number;
    readonly dataPoints: readonly TrendDataPoint[];
    readonly overallDirection: "increasing" | "decreasing" | "stable";
    readonly volatility: "low" | "medium" | "high";
}
```

### 4.2 Report Validators (Pure Functions — PBT-Suitable)

```typescript
/**
 * Date range validation:
 * - startDate must be before endDate
 * - Range must not exceed 5 years
 * - Dates must be valid
 */
export function validateDateRange(startDate: unknown, endDate: unknown): ValidationResult {
    const errors = new Map<string, string>();

    if (!(startDate instanceof Date) || isNaN(startDate.getTime())) {
        errors.set("startDate", "Start date must be a valid date");
    }

    if (!(endDate instanceof Date) || isNaN(endDate.getTime())) {
        errors.set("endDate", "End date must be a valid date");
    }

    if (errors.size > 0) return invalidResult(errors);

    if (startDate >= endDate) {
        errors.set("dateRange", "Start date must be before end date");
    }

    const fiveYearsMs = 5 * 365 * 24 * 60 * 60 * 1000;
    if (endDate.getTime() - startDate.getTime() > fiveYearsMs) {
        errors.set("dateRange", "Date range must not exceed 5 years");
    }

    return errors.size > 0 ? invalidResult(errors) : validResult();
}

/**
 * Report period validation.
 */
export function validateReportPeriod(period: unknown): ValidationResult {
    const errors = new Map<string, string>();
    const validPeriods: string[] = ["current_month", "last_month", "last_3_months", "custom"];

    if (typeof period !== "string" || !validPeriods.includes(period)) {
        errors.set("period", "Period must be current_month, last_month, last_3_months, or custom");
    }

    return errors.size > 0 ? invalidResult(errors) : validResult();
}
```

### 4.3 Report Business Logic (Pure Functions — PBT-Suitable)

```typescript
/**
 * Calculate the date range for a preset period.
 */
export function calculatePresetDateRange(
    period: "current_month" | "last_month" | "last_3_months",
): DateRange {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (period) {
        case "current_month": {
            const start = new Date(today.getFullYear(), today.getMonth(), 1);
            const end = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
            return { startDate: start, endDate: end };
        }
        case "last_month": {
            const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            const end = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);
            return { startDate: start, endDate: end };
        }
        case "last_3_months": {
            const start = new Date(today.getFullYear(), today.getMonth() - 2, 1);
            const end = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
            return { startDate: start, endDate: end };
        }
    }
}

/**
 * Calculate spending overview from transactions and categories.
 * Pure function suitable for property-based testing.
 */
export function calculateSpendingOverview(
    transactions: readonly Transaction[],
    categories: readonly Category[],
    dateRange: DateRange,
): SpendingOverview {
    // Filter transactions within date range
    const filtered = transactions.filter(
        (tx) => tx.date >= dateRange.startDate && tx.date <= dateRange.endDate,
    );

    let totalIncome = 0;
    let totalExpenses = 0;

    for (const tx of filtered) {
        if (isDeposit(tx)) {
            totalIncome += tx.amount;
        } else if (isWithdrawal(tx)) {
            totalExpenses += tx.amount;
        }
        // Transfers are neutral — not counted in income/expenses
    }

    // Build category breakdown
    const spendingByCategory = calculateSpendingByCategory(filtered);
    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

    const categoryBreakdown: CategorySpending[] = [];
    spendingByCategory.forEach((spent, categoryId) => {
        const name = categoryMap.get(categoryId) ?? "Uncategorized";
        const percentage = totalExpenses > 0 ? (spent / totalExpenses) * 100 : 0;
        const count = filtered.filter(
            (tx) => (tx.categoryId ?? "uncategorized") === categoryId && isWithdrawal(tx),
        ).length;

        categoryBreakdown.push({
            categoryId,
            categoryName: name,
            totalSpent: spent,
            percentage: Math.round(percentage * 100) / 100, // 2 decimal places
            transactionCount: count,
        });
    });

    // Sort by total spent descending
    categoryBreakdown.sort((a, b) => b.totalSpent - a.totalSpent);

    return {
        period: "custom",
        dateRange,
        totalIncome,
        totalExpenses,
        netCashflow: totalIncome - totalExpenses,
        categoryBreakdown: Object.freeze(categoryBreakdown),
    };
}
```

---

## 5. Entity Relationships Summary

```
┌─────────────────────────────────────────────────────────────┐
│                    Entity Relationships                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Transaction ──1:1──→ Account (fromAccountId)              │
│  Transaction ──0:1──→ Account (toAccountId)                 │
│  Transaction ──0:1──→ Category (categoryId)                 │
│  Transaction ──0:1──→ Budget (budgetId) [future]            │
│  Transaction ──1:N──→ Tags (string[])                       │
│                                                              │
│  Account ──1:1──→ Currency (ISO 4217 code)                  │
│                                                              │
│  Report ──N:N──→ Transaction (via aggregation)              │
│  Report ──N:1──→ DateRange (period)                         │
│  Report ──N:N──→ Category (via breakdown)                   │
│                                                              │
│  Constraints:                                                │
│  - Transaction type determines account requirements          │
│  - Transfers require two distinct asset accounts             │
│  - Deposits: revenue → asset                                 │
│  - Withdrawals: asset → expense                              │
│  - Amount is always positive (sign determined by type)      │
│  - Category assignment is optional                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Immutability Constraints

| Entity               | Immutability    | Mutation Strategy           |
| -------------------- | --------------- | --------------------------- |
| **Transaction**      | Fully immutable | New instance via factory    |
| **Account**          | Fully immutable | New instance via factory    |
| **Category**         | Fully immutable | New instance via factory    |
| **Report**           | Read-only data  | Recalculated from source    |
| **ValidationResult** | Fully immutable | New instance per validation |

All domain models are immutable. "Updates" create new instances rather than mutating existing ones. This ensures:

- Predictable state management with MobX
- Safe for property-based testing
- No accidental side effects across store references

---

## 7. PBT-Suitable Pure Functions Summary

The following pure functions are candidates for property-based testing (PBT-REQ-01):

| Function                      | Module                 | PBT Strategy                                    |
| ----------------------------- | ---------------------- | ----------------------------------------------- |
| `validateAmount`              | Transaction validators | Generate random numbers, verify precision rule  |
| `validateDescription`         | Transaction validators | Generate random strings, verify length rule     |
| `validateDate`                | Transaction validators | Generate random dates, verify range rule        |
| `validateTransactionInput`    | Transaction validators | Generate random inputs, verify error map        |
| `validateAccountName`         | Account validators     | Generate random strings, verify length rule     |
| `validateCurrencyCode`        | Account validators     | Generate random strings, verify ISO 4217 format |
| `validateDateRange`           | Report validators      | Generate random date pairs, verify ordering     |
| `netAmount`                   | Transaction logic      | Verify sign matches type                        |
| `calculateSpendingOverview`   | Report logic           | Verify totals match sum of transactions         |
| `groupTransactionsByCategory` | Category logic         | Verify all transactions accounted for           |
| `calculateSpendingByCategory` | Category logic         | Verify only withdrawals counted                 |
| `calculatePresetDateRange`    | Report logic           | Verify date math for each preset                |
