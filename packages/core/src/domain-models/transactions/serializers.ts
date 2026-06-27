import type { Transaction, TransactionType } from './transaction.js';
import { createTransaction } from './transaction.js';

/**
 * Input data for creating a transaction.
 * Matches Firefly III API request format.
 */
export interface CreateTransactionInput {
  type: TransactionType;
  amount: number;
  description: string;
  date: Date;
  fromAccountId: string;
  toAccountId?: string;
  categoryId?: string;
  budgetId?: string;
  tags?: string[];
}

/**
 * Firefly III transaction API response structure.
 * Used for deserialization with lenient validation (Clarification Q10: B).
 */
export interface FireflyIIITransactionResponse {
  data: {
    id: string;
    type: string;
    attributes: {
      type: string;
      amount: string;
      description: string;
      date: string;
      source_id: string;
      destination_id?: string;
      category_id?: string;
      budget_id?: string;
      tags?: string[];
      created_at: string;
      updated_at: string;
    };
  };
}

/**
 * Firefly III paginated response wrapper.
 */
export interface FireflyIIIPaginatedResponse<T> {
  data: T[];
  meta: {
    pagination: {
      total: number;
      count: number;
      per_page: number;
      current_page: number;
      total_pages: number;
    };
  };
}

/**
 * Deserialize a Firefly III API transaction response into a Transaction domain model.
 * Clarification Q10: B — Lenient with type coercion.
 */
export function deserializeTransaction(response: FireflyIIITransactionResponse): Transaction {
  const attrs = response.data.attributes;

  const data: {
    id: string;
    type: TransactionType;
    amount: number;
    description: string;
    date: Date;
    fromAccountId: string;
    toAccountId?: string;
    categoryId?: string;
    budgetId?: string;
    tags?: readonly string[];
    createdAt: Date;
    updatedAt: Date;
  } = {
    id: response.data.id,
    type: attrs.type as TransactionType,
    amount: parseFloat(attrs.amount),
    description: attrs.description,
    date: new Date(attrs.date),
    fromAccountId: attrs.source_id,
    createdAt: new Date(attrs.created_at),
    updatedAt: new Date(attrs.updated_at),
  };

  if (attrs.destination_id) {
    data.toAccountId = attrs.destination_id;
  }
  if (attrs.category_id) {
    data.categoryId = attrs.category_id;
  }
  if (attrs.budget_id) {
    data.budgetId = attrs.budget_id;
  }
  if (attrs.tags) {
    data.tags = attrs.tags;
  }

  return createTransaction(data);
}

/**
 * Deserialize a paginated list of transactions.
 */
export function deserializeTransactionList(
  response: FireflyIIIPaginatedResponse<FireflyIIITransactionResponse['data']>,
): {
  transactions: Transaction[];
  hasMore: boolean;
  nextPage: number | undefined;
} {
  const transactions = response.data.map((item) =>
    deserializeTransaction({ data: item } as FireflyIIITransactionResponse),
  );

  const { current_page, total_pages } = response.meta.pagination;
  const hasMore = current_page < total_pages;
  const nextPage = hasMore ? current_page + 1 : undefined;

  return { transactions, hasMore, nextPage };
}

/**
 * Serialize a CreateTransactionInput into the Firefly III API request format.
 */
export function serializeCreateTransactionInput(input: CreateTransactionInput): Record<string, unknown> {
  const body: Record<string, unknown> = {
    type: input.type,
    amount: input.amount.toFixed(2),
    description: input.description,
    date: input.date.toISOString().split('T')[0],
    source_id: input.fromAccountId,
  };

  if (input.toAccountId) {
    body.destination_id = input.toAccountId;
  }
  if (input.categoryId) {
    body.category_id = input.categoryId;
  }
  if (input.budgetId) {
    body.budget_id = input.budgetId;
  }
  if (input.tags && input.tags.length > 0) {
    body.tags = input.tags;
  }

  return body;
}
