#!/usr/bin/env node

import { Command } from 'commander';
import { CLIService } from './services/cli-service.js';
import { KeyringAdapter } from './storage/keyring-adapter.js';
import { JSONConfigAdapter } from './storage/json-config-adapter.js';

async function main(): Promise<void> {
  const program = new Command();
  const keyring = new KeyringAdapter();
  const config = new JSONConfigAdapter();
  const cliService = new CLIService(keyring, config);

  program
    .name('luminescence')
    .description('CLI client for Firefly III')
    .version('0.1.0');

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
