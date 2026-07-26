#!/usr/bin/env node

import { Command } from 'commander';
import { CLIService } from './services/cli-service.js';
import { JSONConfigAdapter } from './storage/json-config-adapter.js';
import { KeyringAdapter } from './storage/keyring-adapter.js';

async function main(): Promise<void> {
  const program = new Command();
  const keyring = new KeyringAdapter();
  const config = new JSONConfigAdapter();
  const cliService = new CLIService(keyring, config);

  program.name('luminescence').description('CLI client for Firefly III').version('0.1.0');

  // Authentication commands
  program
    .command('configure')
    .description('Configure Firefly III server connection')
    .option('-u, --url <url>', 'Firefly III server URL')
    .option('-t, --token <token>', 'API token (will be stored securely)')
    .action(async (options) => {
      const exitCode = await cliService.configure(options);
      process.exit(exitCode);
    });

  program
    .command('logout')
    .description('Remove stored credentials')
    .action(async () => {
      const exitCode = await cliService.logout();
      process.exit(exitCode);
    });

  // Transaction commands
  program
    .command('transactions')
    .description('List transactions')
    .option('-l, --limit <number>', 'Limit number of results', '50')
    .option('-f, --format <format>', 'Output format: table, json, csv', 'table')
    .option('--category <name>', 'Filter by category')
    .action(async (options) => {
      const exitCode = await cliService.listTransactions(options);
      process.exit(exitCode);
    });

  program
    .command('transaction <id>')
    .description('Show transaction details')
    .option('-f, --format <format>', 'Output format: json, table', 'table')
    .action(async (id, options) => {
      const exitCode = await cliService.showTransaction(id, options);
      process.exit(exitCode);
    });

  program
    .command('create')
    .description('Create a new transaction')
    .option('-t, --type <type>', 'Transaction type: deposit, withdrawal, transfer')
    .option('-a, --amount <amount>', 'Transaction amount')
    .option('-d, --description <description>', 'Transaction description')
    .option('--date <date>', 'Transaction date (YYYY-MM-DD)')
    .option('--from-account <id>', 'Source account ID')
    .option('--to-account <id>', 'Destination account ID')
    .option('-c, --category <id>', 'Category ID')
    .option('-f, --format <format>', 'Output format: table, json, csv', 'table')
    .action(async (options) => {
      const exitCode = await cliService.createTransaction(options);
      process.exit(exitCode);
    });

  program
    .command('update <id>')
    .description('Update an existing transaction')
    .option('-t, --type <type>', 'Transaction type: deposit, withdrawal, transfer')
    .option('-a, --amount <amount>', 'Transaction amount')
    .option('-d, --description <description>', 'Transaction description')
    .option('--date <date>', 'Transaction date (YYYY-MM-DD)')
    .option('--from-account <id>', 'Source account ID')
    .option('--to-account <id>', 'Destination account ID')
    .option('-c, --category <id>', 'Category ID')
    .option('-f, --format <format>', 'Output format: table, json, csv', 'table')
    .action(async (id, options) => {
      const exitCode = await cliService.updateTransaction(id, options);
      process.exit(exitCode);
    });

  program
    .command('delete <id>')
    .description('Delete a transaction')
    .option('--force', 'Skip confirmation prompt')
    .action(async (id, options) => {
      const exitCode = await cliService.deleteTransaction(id, options);
      process.exit(exitCode);
    });

  // Report commands
  program
    .command('reports <type>')
    .description('Financial reports: spending, income-expenses, trend')
    .option('-p, --period <period>', 'Report period: current_month, last_month, last_3_months, custom', 'current_month')
    .option('--start <date>', 'Start date for custom period (YYYY-MM-DD)')
    .option('--end <date>', 'End date for custom period (YYYY-MM-DD)')
    .option('-m, --months <number>', 'Number of months for trend analysis', '6')
    .option('-f, --format <format>', 'Output format: table, json, csv', 'table')
    .action(async (type, options) => {
      let exitCode: number;
      switch (type) {
        case 'spending':
          exitCode = await cliService.reportSpending(options);
          break;
        case 'income-expenses':
          exitCode = await cliService.reportIncomeExpenses(options);
          break;
        case 'trend':
          exitCode = await cliService.reportTrend(options);
          break;
        default:
          console.error(`✗ Unknown report type: ${type}. Use: spending, income-expenses, trend`);
          exitCode = 1;
      }
      process.exit(exitCode);
    });

  // Account commands
  program
    .command('accounts')
    .description('List accounts')
    .option('-f, --format <format>', 'Output format: table, json, csv', 'table')
    .action(async (options) => {
      const exitCode = await cliService.listAccounts(options);
      process.exit(exitCode);
    });

  // Category commands
  program
    .command('categories')
    .description('List categories')
    .option('-f, --format <format>', 'Output format: table, json, csv', 'table')
    .action(async (options) => {
      const exitCode = await cliService.listCategories(options);
      process.exit(exitCode);
    });

  await program.parseAsync(process.argv);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(2);
});
