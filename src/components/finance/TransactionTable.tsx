'use client';

import { useState } from 'react';
import {
  Transaction,
  DEFAULT_CATEGORIES,
  ExpenseCategory,
  CategoryConfig,
  getCategoryConfig,
} from '@/types/statement';
import { ChevronUpIcon, ChevronDownIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface TransactionTableProps {
  transactions: Transaction[];
  customCategories?: Record<string, CategoryConfig>;
  onCategoryChange?: (transactionId: string, category: ExpenseCategory) => void;
  onBulkCategoryChange?: (transactionIds: string[], category: ExpenseCategory) => void;
}

type SortField = 'date' | 'description' | 'amount' | 'category';
type SortDirection = 'asc' | 'desc';

interface BulkPrompt {
  transactionId: string;
  newCategory: ExpenseCategory;
  similarTransactions: Transaction[];
}

function normalizeDescription(description: string): string {
  return description
    .toLowerCase()
    .replace(/[0-9#*]+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .slice(0, 3)
    .join(' ');
}

function findSimilarTransactions(
  transaction: Transaction,
  allTransactions: Transaction[],
  newCategory: ExpenseCategory
): Transaction[] {
  const normalizedDesc = normalizeDescription(transaction.description);

  return allTransactions.filter((t) => {
    if (t.id === transaction.id) return false;
    if (t.category === newCategory) return false;

    const otherNormalized = normalizeDescription(t.description);
    return otherNormalized === normalizedDesc ||
           otherNormalized.includes(normalizedDesc) ||
           normalizedDesc.includes(otherNormalized);
  });
}

export default function TransactionTable({
  transactions,
  customCategories = {},
  onCategoryChange,
  onBulkCategoryChange
}: TransactionTableProps) {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filterCategory, setFilterCategory] = useState<ExpenseCategory | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [bulkPrompt, setBulkPrompt] = useState<BulkPrompt | null>(null);

  // Merge default and custom categories
  const allCategories: Record<string, CategoryConfig> = {
    ...DEFAULT_CATEGORIES,
    ...customCategories,
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleCategoryChange = (transaction: Transaction, newCategory: ExpenseCategory) => {
    if (newCategory === transaction.category) return;

    const similar = findSimilarTransactions(transaction, transactions, newCategory);

    if (similar.length > 0 && onBulkCategoryChange) {
      setBulkPrompt({
        transactionId: transaction.id,
        newCategory,
        similarTransactions: similar,
      });
    } else {
      onCategoryChange?.(transaction.id, newCategory);
    }
  };

  const handleBulkConfirm = (includeAll: boolean) => {
    if (!bulkPrompt) return;

    if (includeAll && onBulkCategoryChange) {
      const allIds = [bulkPrompt.transactionId, ...bulkPrompt.similarTransactions.map(t => t.id)];
      onBulkCategoryChange(allIds, bulkPrompt.newCategory);
    } else {
      onCategoryChange?.(bulkPrompt.transactionId, bulkPrompt.newCategory);
    }

    setBulkPrompt(null);
  };

  const filteredTransactions = transactions
    .filter((t) => filterCategory === 'all' || t.category === filterCategory)
    .filter((t) =>
      searchTerm === '' ||
      t.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case 'date':
        comparison = a.date.localeCompare(b.date);
        break;
      case 'description':
        comparison = a.description.localeCompare(b.description);
        break;
      case 'amount':
        comparison = a.amount - b.amount;
        break;
      case 'category':
        comparison = a.category.localeCompare(b.category);
        break;
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatAmount = (amount: number) => {
    const formatted = Math.abs(amount).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    });
    return amount < 0 ? `-${formatted}` : `+${formatted}`;
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ChevronUpIcon className="h-4 w-4 inline ml-1" />
    ) : (
      <ChevronDownIcon className="h-4 w-4 inline ml-1" />
    );
  };

  return (
    <div className="bg-white rounded-lg shadow relative">
      {bulkPrompt && (
        <div className="absolute inset-0 bg-black/50 z-10 flex items-start justify-center pt-8 rounded-lg">
          <div className="bg-white rounded-lg shadow-xl p-6 m-4 max-w-md">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Update Similar Transactions?
              </h3>
              <button
                onClick={() => setBulkPrompt(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Found {bulkPrompt.similarTransactions.length} other transaction{bulkPrompt.similarTransactions.length > 1 ? 's' : ''} from
              the same vendor. Update all to <span className="font-medium" style={{ color: getCategoryConfig(bulkPrompt.newCategory, customCategories).color }}>
                {getCategoryConfig(bulkPrompt.newCategory, customCategories).label}
              </span>?
            </p>

            <div className="max-h-40 overflow-y-auto mb-4 border rounded-md">
              {bulkPrompt.similarTransactions.slice(0, 5).map((t) => (
                <div key={t.id} className="px-3 py-2 border-b last:border-b-0 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-900 truncate max-w-[200px]">{t.description}</span>
                    <span className="text-gray-600 ml-2">{formatAmount(t.amount)}</span>
                  </div>
                  <div className="text-xs text-gray-500">{formatDate(t.date)}</div>
                </div>
              ))}
              {bulkPrompt.similarTransactions.length > 5 && (
                <div className="px-3 py-2 text-sm text-gray-500">
                  +{bulkPrompt.similarTransactions.length - 5} more...
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleBulkConfirm(true)}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Update All ({bulkPrompt.similarTransactions.length + 1})
              </button>
              <button
                onClick={() => handleBulkConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Just This One
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <div className="flex items-center gap-2">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as ExpenseCategory | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {Object.entries(allCategories).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('date')}
              >
                Date <SortIcon field="date" />
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('description')}
              >
                Description <SortIcon field="description" />
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('category')}
              >
                Category <SortIcon field="category" />
              </th>
              <th
                className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('amount')}
              >
                Amount <SortIcon field="amount" />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedTransactions.map((transaction) => {
              const categoryConfig = getCategoryConfig(transaction.category, customCategories);
              return (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                    {formatDate(transaction.date)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">
                    {transaction.description}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {onCategoryChange ? (
                      <select
                        value={transaction.category}
                        onChange={(e) => handleCategoryChange(transaction, e.target.value as ExpenseCategory)}
                        className="px-2 py-1 text-xs rounded-full border-0 focus:ring-2 focus:ring-primary"
                        style={{ backgroundColor: `${categoryConfig.color}20`, color: categoryConfig.color }}
                      >
                        {Object.entries(allCategories).map(([key, config]) => (
                          <option key={key} value={key}>
                            {config.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span
                        className="px-2 py-1 text-xs rounded-full"
                        style={{ backgroundColor: `${categoryConfig.color}20`, color: categoryConfig.color }}
                      >
                        {categoryConfig.label}
                      </span>
                    )}
                  </td>
                  <td className={`px-4 py-3 text-sm text-right whitespace-nowrap font-medium ${
                    transaction.amount >= 0 ? 'text-green-600' : 'text-gray-900'
                  }`}>
                    {formatAmount(transaction.amount)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {sortedTransactions.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          No transactions found
        </div>
      )}

      <div className="px-4 py-3 border-t border-gray-200 text-sm text-gray-500">
        Showing {sortedTransactions.length} of {transactions.length} transactions
      </div>
    </div>
  );
}
