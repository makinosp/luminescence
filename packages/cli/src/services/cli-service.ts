import type { CreateTransactionInput, TransactionType, ReportPeriod, DateRange } from '@luminescence/core';
import type { JSONConfigAdapter } from '../storage/json-config-adapter.js';
import type { KeyringAdapter } from '../storage/keyring-adapter.js';
import {
  AuthenticationService,
  TransactionService,
  AccountService,
  CategoryService,
  ReportService,
  ValidationService,
  FireflyIIIClient,
  AuthStore,
  TransactionStore,
  AccountStore,
  CategoryStore,
  ReportStore,
} from '@luminescence/core';
import { CSVFormatter } from '../formatters/csv-formatter.js';
import { JSONFormatter } from '../formatters/json-formatter.js';
import { TableFormatter } from '../formatters/table-formatter.js';

export interface CLIOptions {
  format?: string;
  limit?: string;
  category?: string;
}

export interface CreateOptions {
  type?: string;
  amount?: string;
  description?: string;
  date?: string;
  fromAccount?: string;
  toAccount?: string;
  category?: string;
  budget?: string;
  tags?: string;
  format?: string;
}

export interface UpdateOptions {
  type?: string;
  amount?: string;
  description?: string;
  date?: string;
  fromAccount?: string;
  toAccount?: string;
  category?: string;
  budget?: string;
  tags?: string;
  format?: string;
}

export interface DeleteOptions {
  force?: boolean;
}

export interface ReportOptions {
  period?: string;
  start?: string;
  end?: string;
  months?: string;
  format?: string;
}

export class CLIService {
  private authService: AuthenticationService;
  private transactionService: TransactionService;
  private accountService: AccountService;
  private categoryService: CategoryService;
  private reportService: ReportService;
  private client: FireflyIIIClient;

  constructor(keyring: KeyringAdapter, config: JSONConfigAdapter) {
    const validationService = new ValidationService();
    const authStore = new AuthStore();
    const transactionStore = new TransactionStore();
    const accountStore = new AccountStore();
    const categoryStore = new CategoryStore();
    const reportStore = new ReportStore();

    this.client = new FireflyIIIClient();
    this.authService = new AuthenticationService(keyring, config, this.client, validationService, authStore);
    this.transactionService = new TransactionService(this.client, validationService, transactionStore);
    this.accountService = new AccountService(this.client, accountStore);
    this.categoryService = new CategoryService(this.client, categoryStore, this.transactionService);
    this.reportService = new ReportService(this.client, validationService, reportStore, this.transactionService, this.categoryService);
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

  async createTransaction(options: CreateOptions): Promise<number> {
    try {
      const type = options.type ?? (await this.prompt('Transaction type (deposit/withdrawal/transfer): '));
      const amountStr = options.amount ?? (await this.prompt('Amount: '));
      const description = options.description ?? (await this.prompt('Description: '));
      const dateStr = options.date ?? (await this.prompt('Date (YYYY-MM-DD): '));
      const fromAccount = options.fromAccount ?? (await this.prompt('From account ID: '));
      const toAccount = options.toAccount ?? (await this.promptOptional('To account ID (optional): '));
      const categoryId = options.category ?? (await this.promptOptional('Category ID (optional): '));

      const amount = parseFloat(amountStr);
      const date = new Date(dateStr);

      const input: CreateTransactionInput = {
        type: type as TransactionType,
        amount,
        description,
        date,
        fromAccountId: fromAccount,
      };

      if (toAccount) input.toAccountId = toAccount;
      if (categoryId) input.categoryId = categoryId;

      const transaction = await this.transactionService.createTransaction(input);
      const formatter = this.getFormatter(options.format ?? 'table');
      console.log('✓ Transaction created successfully');
      console.log(formatter.formatTransaction(transaction));
      return 0;
    } catch (error) {
      console.error(`✗ Failed to create transaction: ${error instanceof Error ? error.message : String(error)}`);
      return 1;
    }
  }

  async updateTransaction(id: string, options: UpdateOptions): Promise<number> {
    try {
      if (!id) {
        console.error('✗ Transaction ID is required');
        return 1;
      }

      const input: Partial<CreateTransactionInput> = {};

      if (options.type) input.type = options.type as TransactionType;
      if (options.amount) input.amount = parseFloat(options.amount);
      if (options.description) input.description = options.description;
      if (options.date) input.date = new Date(options.date);
      if (options.fromAccount) input.fromAccountId = options.fromAccount;
      if (options.toAccount) input.toAccountId = options.toAccount;
      if (options.category) input.categoryId = options.category;

      if (Object.keys(input).length === 0) {
        console.error('✗ No fields to update. Provide at least one field flag.');
        return 1;
      }

      const transaction = await this.transactionService.updateTransaction(id, input);
      const formatter = this.getFormatter(options.format ?? 'table');
      console.log('✓ Transaction updated successfully');
      console.log(formatter.formatTransaction(transaction));
      return 0;
    } catch (error) {
      console.error(`✗ Failed to update transaction: ${error instanceof Error ? error.message : String(error)}`);
      return 1;
    }
  }

  async reportSpending(options: ReportOptions): Promise<number> {
    try {
      const period = (options.period ?? 'current_month') as ReportPeriod;
      const customRange = this.parseCustomRange(options);

      const overview = await this.reportService.getSpendingOverview(period, customRange);

      const formatter = this.getFormatter(options.format ?? 'table');
      console.log(formatter.formatSpendingOverview(overview));
      return 0;
    } catch (error) {
      console.error(`✗ Failed to generate spending report: ${error instanceof Error ? error.message : String(error)}`);
      return 1;
    }
  }

  async reportIncomeExpenses(options: ReportOptions): Promise<number> {
    try {
      const period = (options.period ?? 'current_month') as ReportPeriod;
      const customRange = this.parseCustomRange(options);

      const report = await this.reportService.getIncomeVsExpenses(period, customRange);

      const formatter = this.getFormatter(options.format ?? 'table');
      console.log(formatter.formatIncomeVsExpenses(report));
      return 0;
    } catch (error) {
      console.error(`✗ Failed to generate income vs expenses report: ${error instanceof Error ? error.message : String(error)}`);
      return 1;
    }
  }

  async reportTrend(options: ReportOptions): Promise<number> {
    try {
      const months = parseInt(options.months ?? '6', 10);

      const analysis = await this.reportService.getTrendAnalysis(months);

      const formatter = this.getFormatter(options.format ?? 'table');
      console.log(formatter.formatTrendAnalysis(analysis));
      return 0;
    } catch (error) {
      console.error(`✗ Failed to generate trend analysis: ${error instanceof Error ? error.message : String(error)}`);
      return 1;
    }
  }

  async deleteTransaction(id: string, options: DeleteOptions): Promise<number> {
    try {
      if (!id) {
        console.error('✗ Transaction ID is required');
        return 1;
      }

      if (!options.force) {
        const confirmed = await this.prompt(`Are you sure you want to delete transaction ${id}? (yes/no): `);
        if (confirmed.toLowerCase() !== 'yes') {
          console.log('Deletion cancelled.');
          return 0;
        }
      }

      await this.transactionService.deleteTransaction(id);
      console.log('✓ Transaction deleted successfully');
      return 0;
    } catch (error) {
      console.error(`✗ Failed to delete transaction: ${error instanceof Error ? error.message : String(error)}`);
      return 1;
    }
  }

  private getFormatter(format: string): JSONFormatter | CSVFormatter | TableFormatter {
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

  private parseCustomRange(options: ReportOptions): DateRange | undefined {
    if (options.start && options.end) {
      return { startDate: new Date(options.start), endDate: new Date(options.end) };
    }
    return undefined;
  }

  private async promptOptional(message: string): Promise<string | undefined> {
    process.stdout.write(message);
    return new Promise((resolve) => {
      process.stdin.resume();
      process.stdin.setEncoding('utf8');
      process.stdin.once('data', (data: string) => {
        process.stdin.pause();
        const trimmed = data.trim();
        resolve(trimmed.length > 0 ? trimmed : undefined);
      });
    });
  }
}
