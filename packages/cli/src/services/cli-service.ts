import {
  AuthenticationService,
  TransactionService,
  AccountService,
  CategoryService,
  ValidationService,
  FireflyIIIClient,
  AuthStore,
  TransactionStore,
  AccountStore,
  CategoryStore,
} from '@luminescence/core';
import { CSVFormatter } from '../formatters/csv-formatter.js';
import { JSONFormatter } from '../formatters/json-formatter.js';
import { TableFormatter } from '../formatters/table-formatter.js';
import type { JSONConfigAdapter } from '../storage/json-config-adapter.js';
import type { KeyringAdapter } from '../storage/keyring-adapter.js';

export interface CLIOptions {
  format?: string;
  limit?: string;
  category?: string;
}

export class CLIService {
  private authService: AuthenticationService;
  private transactionService: TransactionService;
  private accountService: AccountService;
  private categoryService: CategoryService;
  private client: FireflyIIIClient;

  constructor(keyring: KeyringAdapter, config: JSONConfigAdapter) {
    const validationService = new ValidationService();
    const authStore = new AuthStore();
    const transactionStore = new TransactionStore();
    const accountStore = new AccountStore();
    const categoryStore = new CategoryStore();

    this.client = new FireflyIIIClient();
    this.authService = new AuthenticationService(keyring, config, this.client, validationService, authStore);
    this.transactionService = new TransactionService(this.client, validationService, transactionStore);
    this.accountService = new AccountService(this.client, accountStore);
    this.categoryService = new CategoryService(this.client, categoryStore, this.transactionService);
  }

  async configure(options: { url?: string; token?: string }): Promise<number> {
    try {
      const url = options.url ?? (await this.prompt('Firefly III URL: '));
      const token = options.token ?? (await this.prompt('API Token: '));

      await this.authService.configureServer(url, token);
      console.log('✓ Configuration saved successfully');
      return 0;
    } catch (error) {
      console.error(`✗ Configuration failed: ${error instanceof Error ? error.message : String(error)}`);
      return 1;
    }
  }

  async logout(): Promise<number> {
    try {
      await this.authService.logout();
      console.log('✓ Logged out successfully');
      return 0;
    } catch (error) {
      console.error(`✗ Logout failed: ${error instanceof Error ? error.message : String(error)}`);
      return 1;
    }
  }

  async listTransactions(options: CLIOptions): Promise<number> {
    try {
      const transactions = await this.transactionService.getTransactions();

      const formatter = this.getFormatter(options.format ?? 'table');
      console.log(formatter.formatTransactions(transactions));
      return 0;
    } catch (error) {
      console.error(`✗ Failed to list transactions: ${error instanceof Error ? error.message : String(error)}`);
      return 1;
    }
  }

  async showTransaction(id: string, options: CLIOptions): Promise<number> {
    try {
      const transaction = await this.transactionService.getTransaction(id);

      if (!transaction) {
        console.error(`✗ Transaction not found: ${id}`);
        return 1;
      }

      const formatter = this.getFormatter(options.format ?? 'table');
      console.log(formatter.formatTransaction(transaction));
      return 0;
    } catch (error) {
      console.error(`✗ Failed to show transaction: ${error instanceof Error ? error.message : String(error)}`);
      return 1;
    }
  }

  async listAccounts(options: CLIOptions): Promise<number> {
    try {
      const accounts = await this.accountService.getAccounts();

      const formatter = this.getFormatter(options.format ?? 'table');
      console.log(formatter.formatAccounts(accounts));
      return 0;
    } catch (error) {
      console.error(`✗ Failed to list accounts: ${error instanceof Error ? error.message : String(error)}`);
      return 1;
    }
  }

  async listCategories(options: CLIOptions): Promise<number> {
    try {
      const categories = await this.categoryService.getCategories();

      const formatter = this.getFormatter(options.format ?? 'table');
      console.log(formatter.formatCategories(categories));
      return 0;
    } catch (error) {
      console.error(`✗ Failed to list categories: ${error instanceof Error ? error.message : String(error)}`);
      return 1;
    }
  }

  private getFormatter(format: string): BaseFormatter {
    switch (format.toLowerCase()) {
      case 'json':
        return new JSONFormatter();
      case 'csv':
        return new CSVFormatter();
      case 'table':
      default:
        return new TableFormatter();
    }
  }

  private async prompt(message: string): Promise<string> {
    process.stdout.write(message);
    return new Promise((resolve) => {
      process.stdin.resume();
      process.stdin.setEncoding('utf8');
      process.stdin.once('data', (data: string) => {
        process.stdin.pause();
        resolve(data.trim());
      });
    });
  }
}
