# Unit of Work — Story Mapping

## Story-to-Unit Matrix

| Story     | Description                       | Core Logic                                                                  | CLI UI                                        | Web UI                     | Mobile UI                             |
| --------- | --------------------------------- | --------------------------------------------------------------------------- | --------------------------------------------- | -------------------------- | ------------------------------------- |
| **US-01** | View transaction list             | ✅ Transaction model, API client, TransactionStore, TransactionService       | ✅ `transactions list` command                 | ✅ Transaction list page    | ✅ Transaction list screen             |
| **US-02** | Search & filter transactions      | ✅ Filter params, TransactionStore pagination, ValidationService             | ✅ `--from-date`, `--category` flags           | ✅ Filter panel UI          | ✅ Filter modal UI                     |
| **US-03** | Create, edit, delete transactions | ✅ Transaction validators, serializers, Mutation API calls, TransactionStore | ✅ `transactions create` interactive           | ✅ Create/edit form         | ✅ Create/edit form                    |
| **US-04** | View accounts & balances          | ✅ Account model, AccountStore, AccountService, API client                   | ✅ `accounts list` command                     | ✅ Account list page        | ✅ Account list screen                 |
| **US-05** | Manage categories                 | ✅ Category model, CategoryStore, CategoryService, API client                | ✅ `categories list` command                   | ✅ Category management page | ✅ Category management screen          |
| **US-06** | Financial reports                 | ✅ Report model, ReportStore, ReportService, Trend calculation               | ✅ `report spending-overview` command          | ✅ Report page with charts  | ✅ Report screen                       |
| **US-07** | CLI interactive & scriptable      | ✅ CLIService, Exit codes, Output formatting                                 | ✅ Commander.js, --format, interactive prompts | —                          | —                                     |
| **US-08** | Error handling & user feedback    | ✅ Error types, ErrorHandlingService, getUserMessage(), retry middleware     | ✅ Error exit codes, user messages             | ✅ Toast / inline error UI  | ✅ Toast / inline error UI             |
| **US-09** | Configure server connection       | ✅ AuthStore, AuthenticationService, ValidationService, Storage interfaces   | ✅ `configure` command                         | ✅ Settings page            | ✅ Settings screen                     |
| **US-10** | Responsive mobile interface       | —                                                                           | —                                             | —                          | ✅ Mobile-first layout, gestures       |
| **US-11** | Offline capability awareness      | ✅ Offline detection state (UIStore), connectivity check                     | —                                             | —                          | ✅ Offline banner, cached data display |

## Story Distribution Summary

| Unit               | Primary Stories                                                                                                                       | Secondary (UI) Stories    |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| **1. Shared Core** | US-01 (logic), US-02 (filter), US-03 (validate), US-04 (account), US-05 (category), US-06 (report), US-08 (error types), US-09 (auth) | —                         |
| **2. CLI**         | US-07 (interactive + scriptable)                                                                                                      | US-01~US-06, US-08, US-09 |
| **3. Web**         | —                                                                                                                                     | US-01~US-06, US-08, US-09 |
| **4. Mobile**      | US-10, US-11                                                                                                                          | US-01~US-06, US-08, US-09 |

## Notes

- **No story duplication**: Core logic is implemented once in Unit 1 and consumed by all clients
- **Client units only implement**: UI rendering, platform adapters, CLI commands
- **US-07** is the only story whose primary implementation is in a client unit (CLI)
- **US-10** and **US-11** are the only stories whose sole implementation is in a single client unit (Mobile)
- All other stories have their core logic in Unit 1 and UI in the respective client units
