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
const FILE_HANDLE_KEY = 'grocery-index-file-handle';

export interface FinanceData {
  statements: ParsedStatement[];
  customCategories: Record<string, CategoryConfig>;
  lastUpdated: string;
}

interface StoredData extends FinanceData {
  version: number;
}

const CURRENT_VERSION = 1;

// File System Access API types
interface FileSystemFileHandle {
  getFile(): Promise<File>;
  createWritable(): Promise<FileSystemWritableFileStream>;
  queryPermission(options?: { mode?: 'read' | 'readwrite' }): Promise<PermissionState>;
  requestPermission(options?: { mode?: 'read' | 'readwrite' }): Promise<PermissionState>;
}

interface FileSystemWritableFileStream extends WritableStream {
  write(data: string | BufferSource | Blob): Promise<void>;
  close(): Promise<void>;
}

declare global {
  interface Window {
    showSaveFilePicker?: (options?: {
      suggestedName?: string;
      types?: Array<{
        description: string;
        accept: Record<string, string[]>;
      }>;
    }) => Promise<FileSystemFileHandle>;
    showOpenFilePicker?: (options?: {
      types?: Array<{
        description: string;
        accept: Record<string, string[]>;
      }>;
      multiple?: boolean;
    }) => Promise<FileSystemFileHandle[]>;
  }
}

// Check if File System Access API is supported
function isFileSystemAccessSupported(): boolean {
  return typeof window !== 'undefined' &&
         'showSaveFilePicker' in window &&
         'showOpenFilePicker' in window;
}

// Store file handle in IndexedDB for persistence across sessions
async function storeFileHandle(handle: FileSystemFileHandle): Promise<void> {
  try {
    const db = await openHandleDB();
    const tx = db.transaction('handles', 'readwrite');
    const store = tx.objectStore('handles');
    await store.put(handle, FILE_HANDLE_KEY);
  } catch (err) {
    console.error('Error storing file handle:', err);
  }
}

async function getStoredFileHandle(): Promise<FileSystemFileHandle | null> {
  try {
    const db = await openHandleDB();
    const tx = db.transaction('handles', 'readonly');
    const store = tx.objectStore('handles');
    const request = store.get(FILE_HANDLE_KEY);
    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });
  } catch (err) {
    console.error('Error getting file handle:', err);
    return null;
  }
}

async function clearStoredFileHandle(): Promise<void> {
  try {
    const db = await openHandleDB();
    const tx = db.transaction('handles', 'readwrite');
    const store = tx.objectStore('handles');
    await store.delete(FILE_HANDLE_KEY);
  } catch (err) {
    console.error('Error clearing file handle:', err);
  }
}

function openHandleDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('finance-file-handles', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('handles')) {
        db.createObjectStore('handles');
      }
    };
  });
}

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
  const [fileHandle, setFileHandle] = useState<FileSystemFileHandle | null>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Load from localStorage on mount, and restore file handle if available
  useEffect(() => {
    const loaded = loadFromStorage();
    setData(loaded);
    setIsLoaded(true);

    // Try to restore file handle from IndexedDB
    if (isFileSystemAccessSupported()) {
      getStoredFileHandle().then(async (handle) => {
        if (handle) {
          // Verify we still have permission
          const permission = await handle.queryPermission({ mode: 'readwrite' });
          if (permission === 'granted') {
            setFileHandle(handle);
            setAutoSaveEnabled(true);
          }
        }
      });
    }
  }, []);

  // Save to localStorage whenever data changes (after initial load)
  useEffect(() => {
    if (isLoaded) {
      saveToStorage(data);
    }
  }, [data, isLoaded]);

  // Autosave to file when data changes and autosave is enabled
  useEffect(() => {
    if (!isLoaded || !autoSaveEnabled || !fileHandle) return;

    const saveToFile = async () => {
      try {
        setAutoSaveStatus('saving');
        const writable = await fileHandle.createWritable();
        const exportData: StoredData = {
          ...data,
          version: CURRENT_VERSION,
          lastUpdated: new Date().toISOString(),
        };
        await writable.write(JSON.stringify(exportData, null, 2));
        await writable.close();
        setAutoSaveStatus('saved');

        // Reset status after a delay
        setTimeout(() => setAutoSaveStatus('idle'), 2000);
      } catch (err) {
        console.error('Autosave error:', err);
        setAutoSaveStatus('error');
        // If we lost permission, disable autosave
        setAutoSaveEnabled(false);
        setFileHandle(null);
        clearStoredFileHandle();
      }
    };

    // Debounce saves
    const timeoutId = setTimeout(saveToFile, 1000);
    return () => clearTimeout(timeoutId);
  }, [data, isLoaded, autoSaveEnabled, fileHandle]);

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

  // Export data to JSON file (manual download)
  const exportData = useCallback(() => {
    const exportObj: StoredData = {
      ...data,
      version: CURRENT_VERSION,
      lastUpdated: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [data]);

  // Import data from JSON file
  const importData = useCallback(async (file: File): Promise<boolean> => {
    try {
      const text = await file.text();
      const parsed: StoredData = JSON.parse(text);

      // Validate structure
      if (!parsed.statements || !Array.isArray(parsed.statements)) {
        throw new Error('Invalid data format: missing statements');
      }

      setData({
        statements: parsed.statements,
        customCategories: parsed.customCategories || {},
        lastUpdated: new Date().toISOString(),
      });

      return true;
    } catch (err) {
      console.error('Import error:', err);
      return false;
    }
  }, []);

  // Setup autosave to a file (File System Access API)
  const setupAutoSave = useCallback(async (): Promise<boolean> => {
    if (!isFileSystemAccessSupported()) {
      console.warn('File System Access API not supported');
      return false;
    }

    try {
      const handle = await window.showSaveFilePicker!({
        suggestedName: 'finance-data.json',
        types: [{
          description: 'JSON Files',
          accept: { 'application/json': ['.json'] },
        }],
      });

      // Write initial data
      const writable = await handle.createWritable();
      const exportObj: StoredData = {
        ...data,
        version: CURRENT_VERSION,
        lastUpdated: new Date().toISOString(),
      };
      await writable.write(JSON.stringify(exportObj, null, 2));
      await writable.close();

      // Store handle for future sessions
      await storeFileHandle(handle);

      setFileHandle(handle);
      setAutoSaveEnabled(true);
      setAutoSaveStatus('saved');

      return true;
    } catch (err) {
      // User cancelled or error
      console.error('Setup autosave error:', err);
      return false;
    }
  }, [data]);

  // Disable autosave
  const disableAutoSave = useCallback(async () => {
    setAutoSaveEnabled(false);
    setFileHandle(null);
    setAutoSaveStatus('idle');
    await clearStoredFileHandle();
  }, []);

  // Load from autosave file
  const loadFromAutoSaveFile = useCallback(async (): Promise<boolean> => {
    if (!fileHandle) return false;

    try {
      const permission = await fileHandle.requestPermission({ mode: 'readwrite' });
      if (permission !== 'granted') {
        setAutoSaveEnabled(false);
        setFileHandle(null);
        return false;
      }

      const file = await fileHandle.getFile();
      return await importData(file);
    } catch (err) {
      console.error('Load from autosave error:', err);
      return false;
    }
  }, [fileHandle, importData]);

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
    // Export/Import
    exportData,
    importData,
    // Autosave
    autoSaveEnabled,
    autoSaveStatus,
    setupAutoSave,
    disableAutoSave,
    loadFromAutoSaveFile,
    isFileSystemAccessSupported: isFileSystemAccessSupported(),
  };
}
