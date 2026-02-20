export type TransactionType = 'debit' | 'credit';

export type DefaultCategory =
  | 'groceries'
  | 'dining'
  | 'transportation'
  | 'utilities'
  | 'entertainment'
  | 'shopping'
  | 'health'
  | 'travel'
  | 'subscriptions'
  | 'home_improvement'
  | 'income'
  | 'transfer'
  | 'fees'
  | 'other';

// ExpenseCategory can be a default or custom (prefixed with 'custom_')
export type ExpenseCategory = DefaultCategory | `custom_${string}`;

export interface CategoryConfig {
  label: string;
  color: string;
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: ExpenseCategory;
  merchant?: string;
}

export interface ParsedStatement {
  id: string;
  fileName: string;
  accountType: 'checking' | 'credit';
  statementPeriod: {
    start: string;
    end: string;
  };
  transactions: Transaction[];
  summary: StatementSummary;
  uploadedAt: string;
}

export interface StatementSummary {
  totalIncome: number;
  totalExpenses: number;
  netChange: number;
  transactionCount: number;
  byCategory: CategorySummary[];
}

export interface CategorySummary {
  category: ExpenseCategory;
  total: number;
  count: number;
  percentage: number;
}

export const DEFAULT_CATEGORIES: Record<DefaultCategory, CategoryConfig> = {
  groceries: { label: 'Groceries', color: '#22c55e' },
  dining: { label: 'Dining & Restaurants', color: '#f97316' },
  transportation: { label: 'Transportation', color: '#3b82f6' },
  utilities: { label: 'Utilities & Bills', color: '#8b5cf6' },
  entertainment: { label: 'Entertainment', color: '#ec4899' },
  shopping: { label: 'Shopping', color: '#eab308' },
  health: { label: 'Health & Medical', color: '#ef4444' },
  travel: { label: 'Travel', color: '#06b6d4' },
  subscriptions: { label: 'Subscriptions', color: '#a855f7' },
  home_improvement: { label: 'Home Improvement', color: '#0ea5e9' },
  income: { label: 'Income', color: '#10b981' },
  transfer: { label: 'Transfers', color: '#6b7280' },
  fees: { label: 'Fees & Charges', color: '#dc2626' },
  other: { label: 'Other', color: '#9ca3af' },
};

// Colors for custom categories
export const CUSTOM_CATEGORY_COLORS = [
  '#f43f5e', // rose
  '#14b8a6', // teal
  '#f59e0b', // amber
  '#6366f1', // indigo
  '#84cc16', // lime
  '#e879f9', // fuchsia
  '#22d3ee', // cyan
  '#fb923c', // orange
];

// Helper to get category config (works for both default and custom)
export function getCategoryConfig(
  category: ExpenseCategory,
  customCategories: Record<string, CategoryConfig>
): CategoryConfig {
  if (category in DEFAULT_CATEGORIES) {
    return DEFAULT_CATEGORIES[category as DefaultCategory];
  }
  if (category in customCategories) {
    return customCategories[category];
  }
  return { label: category.replace('custom_', ''), color: '#9ca3af' };
}

// For backwards compatibility
export const CATEGORY_CONFIG = DEFAULT_CATEGORIES as Record<ExpenseCategory, CategoryConfig>;
