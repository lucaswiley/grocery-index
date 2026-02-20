'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ParsedStatement,
  Transaction,
  ExpenseCategory,
  CategoryConfig,
  CategorySummary,
} from '@/types/statement';

const STORAGE_KEY = 'grocery-index-finance-data';

export interface FinanceData {
  statements: ParsedStatement[];
  customCategories: Record<string, CategoryConfig>;
  lastUpdated: string;
}

interface StoredData extends FinanceData {
  version: number;
}

const CURRENT_VERSION = 1;

function getDefaultData(): FinanceData {
  return {
    statements: [],
    customCategories: {},
    lastUpdated: new Date().toISOString(),
  };
}

function loadFromStorage(): FinanceData {
  if (typeof window === 'undefined') return getDefaultData();

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return getDefaultData();

    const parsed: StoredData = JSON.parse(stored);

    // Handle version migrations if needed
    if (parsed.version !== CURRENT_VERSION) {
      return getDefaultData();
    }

    return {
      statements: parsed.statements || [],
      customCategories: parsed.customCategories || {},
      lastUpdated: parsed.lastUpdated || new Date().toISOString(),
    };
  } catch (err) {
    console.error('Error loading finance data from localStorage:', err);
    return getDefaultData();
  }
}

function saveToStorage(data: FinanceData): void {
  if (typeof window === 'undefined') return;

  try {
    const stored: StoredData = {
      ...data,
      version: CURRENT_VERSION,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch (err) {
    console.error('Error saving finance data to localStorage:', err);
  }
}

export function recalculateSummary(transactions: Transaction[]): {
  totalIncome: number;
  totalExpenses: number;
  netChange: number;
  transactionCount: number;
  byCategory: CategorySummary[];
} {
  const income = transactions
    .filter((t) => t.type === 'credit')
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = transactions
    .filter((t) => t.type === 'debit')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const categoryTotals = new Map<ExpenseCategory, { total: number; count: number }>();
  transactions
    .filter((t) => t.type === 'debit')
    .forEach((t) => {
      const existing = categoryTotals.get(t.category) || { total: 0, count: 0 };
      categoryTotals.set(t.category, {
        total: existing.total + Math.abs(t.amount),
        count: existing.count + 1,
      });
    });

  const byCategory = Array.from(categoryTotals.entries())
    .map(([cat, data]) => ({
      category: cat,
      total: data.total,
      count: data.count,
      percentage: expenses > 0 ? (data.total / expenses) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);

  return {
    totalIncome: income,
    totalExpenses: expenses,
    netChange: income - expenses,
    transactionCount: transactions.length,
    byCategory,
  };
}

export function useFinanceStorage() {
  const [data, setData] = useState<FinanceData>(getDefaultData);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const loaded = loadFromStorage();
    setData(loaded);
    setIsLoaded(true);
  }, []);

  // Save to localStorage whenever data changes (after initial load)
  useEffect(() => {
    if (isLoaded) {
      saveToStorage(data);
    }
  }, [data, isLoaded]);

  // Derive transactions from statements - this is the single source of truth
  const transactions = useMemo(() => {
    return data.statements
      .flatMap((s) => s.transactions)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [data.statements]);

  const addStatement = useCallback((statement: ParsedStatement) => {
    setData((prev) => {
      // Check for duplicate statement by fileName and date range
      const isDuplicate = prev.statements.some(
        (s) => s.fileName === statement.fileName &&
               s.statementPeriod.start === statement.statementPeriod.start &&
               s.statementPeriod.end === statement.statementPeriod.end
      );

      if (isDuplicate) {
        console.warn('Duplicate statement detected, skipping:', statement.fileName);
        return prev;
      }

      return {
        ...prev,
        statements: [...prev.statements, statement],
        lastUpdated: new Date().toISOString(),
      };
    });
  }, []);

  const removeStatement = useCallback((index: number) => {
    setData((prev) => ({
      ...prev,
      statements: prev.statements.filter((_, i) => i !== index),
      lastUpdated: new Date().toISOString(),
    }));
  }, []);

  const updateTransactionCategory = useCallback((transactionId: string, category: ExpenseCategory) => {
    setData((prev) => {
      // Update in statements (the source of truth)
      const updatedStatements = prev.statements.map((s) => ({
        ...s,
        transactions: s.transactions.map((t) =>
          t.id === transactionId ? { ...t, category } : t
        ),
      }));

      return {
        ...prev,
        statements: updatedStatements,
        lastUpdated: new Date().toISOString(),
      };
    });
  }, []);

  const updateBulkTransactionCategories = useCallback((transactionIds: string[], category: ExpenseCategory) => {
    setData((prev) => {
      const idSet = new Set(transactionIds);

      const updatedStatements = prev.statements.map((s) => ({
        ...s,
        transactions: s.transactions.map((t) =>
          idSet.has(t.id) ? { ...t, category } : t
        ),
      }));

      return {
        ...prev,
        statements: updatedStatements,
        lastUpdated: new Date().toISOString(),
      };
    });
  }, []);

  const addCustomCategory = useCallback((id: string, config: CategoryConfig) => {
    setData((prev) => ({
      ...prev,
      customCategories: {
        ...prev.customCategories,
        [`custom_${id}`]: config,
      },
      lastUpdated: new Date().toISOString(),
    }));
  }, []);

  const removeCustomCategory = useCallback((id: string) => {
    setData((prev) => {
      const { [`custom_${id}`]: removed, ...rest } = prev.customCategories;

      // Move transactions with this category to 'other'
      const updatedStatements = prev.statements.map((s) => ({
        ...s,
        transactions: s.transactions.map((t) =>
          t.category === `custom_${id}` ? { ...t, category: 'other' as ExpenseCategory } : t
        ),
      }));

      return {
        ...prev,
        customCategories: rest,
        statements: updatedStatements,
        lastUpdated: new Date().toISOString(),
      };
    });
  }, []);

  const clearAll = useCallback(() => {
    setData(getDefaultData());
  }, []);

  const getSummary = useCallback(() => {
    return recalculateSummary(transactions);
  }, [transactions]);

  const getPeriod = useCallback(() => {
    if (transactions.length === 0) {
      return { start: '', end: '' };
    }
    const dates = transactions.map((t) => t.date).sort();
    return {
      start: dates[0],
      end: dates[dates.length - 1],
    };
  }, [transactions]);

  return {
    statements: data.statements,
    transactions,
    customCategories: data.customCategories,
    isLoaded,
    addStatement,
    removeStatement,
    updateTransactionCategory,
    updateBulkTransactionCategories,
    addCustomCategory,
    removeCustomCategory,
    clearAll,
    getSummary,
    getPeriod,
  };
}
