import type { IFireflyIIIClient } from '../api-client/firefly-client.js';
import type {
  SpendingOverview,
  IncomeVsExpensesReport,
  CategorySpending,
  TrendAnalysis,
  ReportPeriod,
  DateRange,
} from '../domain-models/reports/report.js';
import { calculateDateRange, aggregateSpendingOverview } from '../domain-models/reports/report.js';
import type { APIError, NetworkError, AuthError } from '../errors/error-types.js';
import { ValidationService } from './validation-service.js';
import { ReportStore } from '../stores/report-store.js';
import type { TransactionService } from './transaction-service.js';
import type { CategoryService } from './category-service.js';

/**
 * Report service.
 * Orchestrates report generation with date range filtering.
 *
 * Clarification Q7: C — Hybrid:
 * - Standard reports: Use Firefly III API
 * - Custom queries: Client-side calculation from transaction data
 */
export class ReportService {
  constructor(
    private readonly apiClient: IFireflyIIIClient,
    private readonly validationService: ValidationService,
    private readonly reportStore: ReportStore,
    private readonly transactionService: TransactionService,
    private readonly categoryService: CategoryService,
  ) { }

  /**
   * Get spending overview for a period.
   */
  async getSpendingOverview(period: ReportPeriod, customRange?: DateRange): Promise<SpendingOverview> {
    this.reportStore.setLoading(true);
    this.reportStore.setError(null);

    try {
      const dateRange = calculateDateRange(period, customRange);
      this.validationService.throwIfInvalid(
        this.validationService.validateDateRange(dateRange.startDate, dateRange.endDate),
      );

      let overview: SpendingOverview;

      if (period === 'custom') {
        // Client-side calculation for custom queries
        const transactions = this.transactionService.getTransactionsByDateRange(
          dateRange.startDate,
          dateRange.endDate,
        );
        const categories = await this.categoryService.getCategories();
        const categoryNames = new Map(categories.map((c) => [c.id, c.name]));
        overview = aggregateSpendingOverview(transactions, period, dateRange, categoryNames);
      } else {
        // Use Firefly III API for standard reports
        overview = await this.apiClient.getSpendingOverview({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        });
      }

      this.reportStore.setSpendingOverview(overview);
      return overview;
    } catch (error) {
      this.reportStore.setError(error as APIError | NetworkError | AuthError);
      throw error;
    } finally {
      this.reportStore.setLoading(false);
    }
  }

  /**
   * Get income vs expenses comparison.
   */
  async getIncomeVsExpenses(period: ReportPeriod, customRange?: DateRange): Promise<IncomeVsExpensesReport> {
    const dateRange = calculateDateRange(period, customRange);
    this.validationService.throwIfInvalid(
      this.validationService.validateDateRange(dateRange.startDate, dateRange.endDate),
    );

    const report = await this.apiClient.getIncomeVsExpenses({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    });

    this.reportStore.setIncomeVsExpenses(report);
    return report;
  }

  /**
   * Get spending breakdown by category.
   */
  async getSpendingByCategory(period: ReportPeriod, customRange?: DateRange): Promise<readonly CategorySpending[]> {
    const overview = await this.getSpendingOverview(period, customRange);
    return overview.categoryBreakdown;
  }

  /**
   * Get trend analysis over N months.
   */
  async getTrendAnalysis(months: number): Promise<TrendAnalysis> {
    this.reportStore.setLoading(true);
    this.reportStore.setError(null);

    try {
      const analysis = await this.apiClient.getTrendAnalysis({ months });
      this.reportStore.setTrendAnalysis(analysis);
      return analysis;
    } catch (error) {
      this.reportStore.setError(error as APIError | NetworkError | AuthError);
      throw error;
    } finally {
      this.reportStore.setLoading(false);
    }
  }
}
