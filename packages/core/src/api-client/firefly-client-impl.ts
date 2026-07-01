import type { Account, AccountType } from '../domain-models/accounts/account.js';
import type { Category } from '../domain-models/categories/category.js';
import type { SpendingOverview, IncomeVsExpensesReport, TrendAnalysis } from '../domain-models/reports/report.js';
import type { Transaction } from '../domain-models/transactions/transaction.js';
import type { IHTTPAdapter } from './adapters/fetch-adapter.js';
import type { IFireflyIIIClient, TransactionQueryParams } from './firefly-client.js';
import { createAccount } from '../domain-models/accounts/account.js';
import { createCategory } from '../domain-models/categories/category.js';
import {
  deserializeTransaction,
  deserializeTransactionList,
  serializeCreateTransactionInput,
  type CreateTransactionInput,
  type FireflyIIIPaginatedResponse,
  type FireflyIIITransactionResponse,
} from '../domain-models/transactions/serializers.js';
import { errorHandlingService } from '../errors/error-categorization.js';
import { APIError, NetworkError, AuthError } from '../errors/error-types.js';
import { FetchAdapter } from './adapters/fetch-adapter.js';
import { AuthGate } from './auth-gate.js';
import { HTTPSEnforcer } from './https-enforcer.js';
import { RetryMiddleware } from './retry-middleware.js';
import { TimeoutController } from './timeout-controller.js';

/**
 * Firefly III API client implementation.
 *
 * Composes: HTTPSEnforcer → AuthGate → TimeoutController → RetryMiddleware → FetchAdapter
 *
 * NFR Security §1.5: TLS enforced at configuration time.
 * NFR Reliability §2.2: GET requests retried once on network error.
 * NFR Performance §3.4: Default 10s timeout, configurable per-request.
 */
export class FireflyIIIClient implements IFireflyIIIClient {
  private readonly httpsEnforcer: HTTPSEnforcer;
  private readonly authGate: AuthGate;
  private readonly timeoutController: TimeoutController;
  private readonly retryMiddleware: RetryMiddleware;
  private readonly httpAdapter: IHTTPAdapter;

  constructor(httpAdapter?: IHTTPAdapter) {
    this.httpsEnforcer = new HTTPSEnforcer();
    this.authGate = new AuthGate();
    this.timeoutController = new TimeoutController();
    this.retryMiddleware = new RetryMiddleware();
    this.httpAdapter = httpAdapter ?? new FetchAdapter();
  }

  // =========================================================================
  // Configuration
  // =========================================================================

  setBaseURL(url: string): void {
    this.httpsEnforcer.setBaseURL(url);
  }

  setToken(token: string): void {
    this.authGate.setToken(token);
  }

  // =========================================================================
  // Transactions
  // =========================================================================

  async getTransactions(params?: TransactionQueryParams): Promise<{
    transactions: Transaction[];
    hasMore: boolean;
    nextPage: number | undefined;
  }> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', String(params.page));
    if (params?.limit) queryParams.set('limit', String(params.limit));
    if (params?.startDate) queryParams.set('start', this.formatDate(params.startDate));
    if (params?.endDate) queryParams.set('end', this.formatDate(params.endDate));
    if (params?.accountId) queryParams.set('account_id', params.accountId);
    if (params?.categoryId) queryParams.set('category_id', params.categoryId);

    const path = `/transactions?${queryParams.toString()}`;
    const response = await this.request<FireflyIIIPaginatedResponse<FireflyIIITransactionResponse['data']>>(
      'GET',
      path,
    );

    return deserializeTransactionList(response);
  }

  async getTransaction(id: string): Promise<Transaction> {
    const response = await this.request<FireflyIIITransactionResponse>('GET', `/transactions/${id}`);
    return deserializeTransaction(response);
  }

  async createTransaction(data: CreateTransactionInput): Promise<Transaction> {
    const body = serializeCreateTransactionInput(data);
    const response = await this.request<FireflyIIITransactionResponse>('POST', '/transactions', body);
    return deserializeTransaction(response);
  }

  async updateTransaction(id: string, data: Partial<CreateTransactionInput>): Promise<Transaction> {
    const body: Record<string, unknown> = {};
    if (data.type !== undefined) body.type = data.type;
    if (data.amount !== undefined) body.amount = data.amount.toFixed(2);
    if (data.description !== undefined) body.description = data.description;
    if (data.date !== undefined) body.date = this.formatDate(data.date);
    if (data.fromAccountId !== undefined) body.source_id = data.fromAccountId;
    if (data.toAccountId !== undefined) body.destination_id = data.toAccountId;
    if (data.categoryId !== undefined) body.category_id = data.categoryId;
    if (data.budgetId !== undefined) body.budget_id = data.budgetId;
    if (data.tags !== undefined) body.tags = data.tags;

    const response = await this.request<FireflyIIITransactionResponse>('PUT', `/transactions/${id}`, body);
    return deserializeTransaction(response);
  }

  async deleteTransaction(id: string): Promise<void> {
    await this.request<null>('DELETE', `/transactions/${id}`);
  }

  // =========================================================================
  // Accounts
  // =========================================================================

  async getAccounts(params?: { type?: AccountType }): Promise<Account[]> {
    const queryParams = new URLSearchParams();
    if (params?.type) queryParams.set('type', params.type);

    const path = `/accounts?${queryParams.toString()}`;
    const response = await this.request<{
      data: Array<{ id: string; attributes: Record<string, unknown> }>;
    }>('GET', path);

    return response.data.map((item) =>
      createAccount({
        id: item.id,
        name: String(item.attributes.name ?? ''),
        type: String(item.attributes.type ?? 'asset') as AccountType,
        currencyCode: String(item.attributes.currency_code ?? 'USD'),
        currentBalance: parseFloat(String(item.attributes.current_balance ?? '0')),
        isActive: Boolean(item.attributes.active ?? true),
        createdAt: new Date(String(item.attributes.created_at ?? new Date().toISOString())),
        updatedAt: new Date(String(item.attributes.updated_at ?? new Date().toISOString())),
      }),
    );
  }

  async getAccount(id: string): Promise<Account> {
    const response = await this.request<{
      data: { id: string; attributes: Record<string, unknown> };
    }>('GET', `/accounts/${id}`);
    const item = response.data;

    return createAccount({
      id: item.id,
      name: String(item.attributes.name ?? ''),
      type: String(item.attributes.type ?? 'asset') as AccountType,
      currencyCode: String(item.attributes.currency_code ?? 'USD'),
      currentBalance: parseFloat(String(item.attributes.current_balance ?? '0')),
      isActive: Boolean(item.attributes.active ?? true),
      createdAt: new Date(String(item.attributes.created_at ?? new Date().toISOString())),
      updatedAt: new Date(String(item.attributes.updated_at ?? new Date().toISOString())),
    });
  }

  // =========================================================================
  // Categories
  // =========================================================================

  async getCategories(): Promise<Category[]> {
    const response = await this.request<{
      data: Array<{ id: string; attributes: Record<string, unknown> }>;
    }>('GET', '/categories');

    return response.data.map((item) => {
      const categoryData: {
        id: string;
        name: string;
        description?: string;
        createdAt: Date;
        updatedAt: Date;
      } = {
        id: item.id,
        name: String(item.attributes.name ?? ''),
        createdAt: new Date(String(item.attributes.created_at ?? new Date().toISOString())),
        updatedAt: new Date(String(item.attributes.updated_at ?? new Date().toISOString())),
      };
      if (item.attributes.description) {
        categoryData.description = String(item.attributes.description);
      }
      return createCategory(categoryData);
    });
  }

  async getCategory(id: string): Promise<Category> {
    const response = await this.request<{
      data: { id: string; attributes: Record<string, unknown> };
    }>('GET', `/categories/${id}`);
    const item = response.data;

    const categoryData: {
      id: string;
      name: string;
      description?: string;
      createdAt: Date;
      updatedAt: Date;
    } = {
      id: item.id,
      name: String(item.attributes.name ?? ''),
      createdAt: new Date(String(item.attributes.created_at ?? new Date().toISOString())),
      updatedAt: new Date(String(item.attributes.updated_at ?? new Date().toISOString())),
    };
    if (item.attributes.description) {
      categoryData.description = String(item.attributes.description);
    }
    return createCategory(categoryData);
  }

  // =========================================================================
  // Reports
  // =========================================================================

  async getSpendingOverview(params: {
    startDate: Date;
    endDate: Date;
    accountIds?: string[];
  }): Promise<SpendingOverview> {
    const body: Record<string, unknown> = {
      start: this.formatDate(params.startDate),
      end: this.formatDate(params.endDate),
    };
    if (params.accountIds) {
      body.accounts = params.accountIds;
    }

    const response = await this.request<{ data: Record<string, unknown> }>('GET', '/insight/expense/asset', body);

    // Parse Firefly III insight response
    const data = response.data;
    const totalExpenses = parseFloat(String(data.total ?? '0'));
    const totalIncome = parseFloat(String(data.income ?? '0'));

    return {
      period: 'custom',
      dateRange: { startDate: params.startDate, endDate: params.endDate },
      totalIncome,
      totalExpenses,
      netCashflow: totalIncome - totalExpenses,
      categoryBreakdown: [],
    };
  }

  async getIncomeVsExpenses(params: { startDate: Date; endDate: Date }): Promise<IncomeVsExpensesReport> {
    const body: Record<string, unknown> = {
      start: this.formatDate(params.startDate),
      end: this.formatDate(params.endDate),
    };

    const response = await this.request<{ data: Record<string, unknown> }>('GET', '/insight/income/asset', body);

    const data = response.data;
    const income = parseFloat(String(data.total ?? '0'));
    const expenses = parseFloat(String(data.expenses ?? '0'));

    return {
      period: 'custom',
      dateRange: { startDate: params.startDate, endDate: params.endDate },
      income,
      expenses,
      netCashflow: income - expenses,
    };
  }

  async getTrendAnalysis(params: { months: number }): Promise<TrendAnalysis> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - params.months);

    const body: Record<string, unknown> = {
      start: this.formatDate(startDate),
      end: this.formatDate(endDate),
    };

    const response = await this.request<{
      data: Array<{ month: string; income: string; expenses: string }>;
    }>('GET', '/insight/income/period', body);

    return {
      months: (response.data ?? []).map((item) => ({
        month: item.month,
        income: parseFloat(item.income ?? '0'),
        expenses: parseFloat(item.expenses ?? '0'),
        netCashflow: parseFloat(item.income ?? '0') - parseFloat(item.expenses ?? '0'),
      })),
    };
  }

  // =========================================================================
  // Health
  // =========================================================================

  async validateConnectivity(): Promise<boolean> {
    try {
      await this.request<{ data: { id: string } }>('GET', '/about');
      return true;
    } catch {
      return false;
    }
  }

  // =========================================================================
  // Private: Core request method
  // =========================================================================

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = this.httpsEnforcer.buildURL(path);
    const headers = this.authGate.getAuthHeaders();

    return this.retryMiddleware.execute(method, async () => {
      const { signal, clear } = this.timeoutController.createSignal();

      try {
        const requestOptions: {
          method: 'GET' | 'POST' | 'PUT' | 'DELETE';
          headers: Record<string, string>;
          body?: string | null;
          signal: AbortSignal;
        } = {
          method: method as 'GET' | 'POST' | 'PUT' | 'DELETE',
          headers,
          signal,
        };
        if (body !== undefined) {
          requestOptions.body = JSON.stringify(body);
        }

        const response = await this.httpAdapter.request(url, requestOptions);

        clear();

        if (response.status === 401) {
          this.authGate.clearToken();
          throw new AuthError('Authentication failed', 'invalid');
        }

        if (response.status >= 400) {
          let serverResponse: unknown;
          try {
            serverResponse = JSON.parse(response.body);
          } catch {
            serverResponse = response.body;
          }

          throw new APIError(`API request failed with status ${response.status}`, response.status, serverResponse);
        }

        if (response.status === 204 || !response.body) {
          return null as T;
        }

        return JSON.parse(response.body) as T;
      } catch (error) {
        clear();

        // Re-throw known error types
        if (error instanceof APIError || error instanceof AuthError || error instanceof NetworkError) {
          throw error;
        }

        // Categorize unknown errors
        if (error instanceof DOMException && error.name === 'TimeoutError') {
          throw new NetworkError('Request timed out', error);
        }

        if (error instanceof TypeError) {
          throw new NetworkError('Network request failed', error);
        }

        // Log and re-throw
        errorHandlingService.logError(error, `FireflyIIIClient.${method}`);
        throw new NetworkError('An unexpected network error occurred', error instanceof Error ? error : undefined);
      }
    });
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0]!;
  }
}
