import { makeAutoObservable, runInAction } from 'mobx';
import type {
  SpendingOverview,
  IncomeVsExpensesReport,
  TrendAnalysis,
  ReportPeriod,
  DateRange,
} from '../domain-models/reports/report.js';
import type { APIError, NetworkError, AuthError } from '../errors/error-types.js';

/**
 * Report data state.
 */
export class ReportStore {
  spendingOverview: SpendingOverview | null = null;
  incomeVsExpenses: IncomeVsExpensesReport | null = null;
  trendAnalysis: TrendAnalysis | null = null;
  selectedPeriod: ReportPeriod = 'current_month';
  customDateRange: DateRange | null = null;
  isLoading = false;
  error: APIError | NetworkError | AuthError | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  /**
   * Set spending overview data.
   */
  setSpendingOverview(data: SpendingOverview): void {
    this.spendingOverview = data;
    this.error = null;
  }

  /**
   * Set income vs expenses data.
   */
  setIncomeVsExpenses(data: IncomeVsExpensesReport): void {
    this.incomeVsExpenses = data;
    this.error = null;
  }

  /**
   * Set trend analysis data.
   */
  setTrendAnalysis(data: TrendAnalysis): void {
    this.trendAnalysis = data;
    this.error = null;
  }

  /**
   * Select a report period.
   */
  selectPeriod(period: ReportPeriod, customRange?: DateRange): void {
    this.selectedPeriod = period;
    this.customDateRange = customRange ?? null;
  }

  /**
   * Set loading state.
   */
  setLoading(loading: boolean): void {
    this.isLoading = loading;
  }

  /**
   * Set an error state.
   */
  setError(error: APIError | NetworkError | AuthError | null): void {
    this.error = error;
  }

  /**
   * Clear all report data (logout).
   */
  clear(): void {
    runInAction(() => {
      this.spendingOverview = null;
      this.incomeVsExpenses = null;
      this.trendAnalysis = null;
      this.selectedPeriod = 'current_month';
      this.customDateRange = null;
      this.isLoading = false;
      this.error = null;
    });
  }
}
