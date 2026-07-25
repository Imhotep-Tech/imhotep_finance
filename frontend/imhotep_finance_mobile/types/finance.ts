/**
 * Financial Entity Type Definitions for Imhotep Finance
 * Enforces strict type safety across all domain components and custom hooks.
 */

export type TransactionStatus = 'deposit' | 'withdraw' | string;

export interface Transaction {
  id: number;
  amount: string | number;
  currency: string;
  category: string;
  place?: string;
  trans_status: TransactionStatus;
  trans_details: string;
  date: string;
}

export interface FinancialSummary {
  networth: string | number;
  favoriteCurrency: string;
  score?: number | null;
  scoreTxt?: string;
  target?: string;
  loading: boolean;
  error?: string | null;
}

export interface Category {
  id: number;
  name: string;
  icon?: string;
  color?: string;
}

export interface Place {
  id: number;
  name: string;
}

export interface Currency {
  code: string;
  symbol: string;
  name: string;
}

export interface TransactionFilterParams {
  startDate?: Date | null;
  endDate?: Date | null;
  statusFilter?: string;
  categoryFilter?: string;
  placeFilter?: string;
  detailsSearch?: string;
}

export interface GetTransactionsApiResponse {
  transactions: Transaction[];
  has_more?: boolean;
  total_count?: number;
}
