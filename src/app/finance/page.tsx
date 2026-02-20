'use client';

import { useCallback, useState } from 'react';
import { ParsedStatement, ExpenseCategory, CategoryConfig, CUSTOM_CATEGORY_COLORS } from '@/types/statement';
import { useFinanceStorage } from '@/lib/hooks/useFinanceStorage';
import StatementUploader from '@/components/finance/StatementUploader';
import TransactionTable from '@/components/finance/TransactionTable';
import SpendingByCategory from '@/components/finance/SpendingByCategory';
import SummaryCards from '@/components/finance/SummaryCards';
import { DocumentTextIcon, TrashIcon, PlusIcon, Cog6ToothIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function FinancePage() {
  const {
    statements,
    transactions,
    customCategories,
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
  } = useFinanceStorage();

  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const handleUpload = useCallback((parsed: ParsedStatement) => {
    addStatement(parsed);
  }, [addStatement]);

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;

    const id = newCategoryName.toLowerCase().replace(/\s+/g, '_');
    const colorIndex = Object.keys(customCategories).length % CUSTOM_CATEGORY_COLORS.length;

    addCustomCategory(id, {
      label: newCategoryName.trim(),
      color: CUSTOM_CATEGORY_COLORS[colorIndex],
    });

    setNewCategoryName('');
  };

  const summary = getSummary();
  const period = getPeriod();
  const hasData = statements.length > 0;

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Personal Finance</h1>
            <p className="text-gray-600 mt-1">
              Upload your bank statements to analyze your spending
            </p>
          </div>
          {hasData && (
            <button
              onClick={() => setShowCategoryManager(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Cog6ToothIcon className="h-4 w-4" />
              Manage Categories
            </button>
          )}
        </div>

        {!hasData ? (
          <div className="max-w-xl mx-auto">
            <div className="bg-white rounded-lg shadow p-8">
              <div className="text-center mb-6">
                <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900">Upload Statements</h2>
                <p className="text-gray-500 mt-2">
                  Export your Chase checking or credit card statements and upload them here
                </p>
              </div>
              <StatementUploader onUpload={handleUpload} />
            </div>

            <div className="mt-8 bg-blue-50 rounded-lg p-4">
              <h3 className="font-medium text-blue-900">How to export from Chase:</h3>
              <ol className="mt-2 text-sm text-blue-800 list-decimal list-inside space-y-1">
                <li>Log in to chase.com</li>
                <li>Select your checking or credit card account</li>
                <li>Click the download icon or &quot;Download account activity&quot;</li>
                <li>Choose CSV format and your date range</li>
                <li>Upload the downloaded file here</li>
              </ol>
            </div>

            <div className="mt-4 bg-green-50 rounded-lg p-4">
              <h3 className="font-medium text-green-900">Privacy Notice</h3>
              <p className="mt-1 text-sm text-green-800">
                Your data stays local. Files are processed in your browser and stored in localStorage.
                Nothing is sent to external servers or stored permanently on any backend.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-start gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {statements.length} Statement{statements.length > 1 ? 's' : ''} Loaded
                </h2>
                <div className="flex flex-wrap gap-2 mt-2">
                  {statements.map((s, i) => (
                    <span
                      key={s.id}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-sm text-gray-700"
                    >
                      {s.fileName}
                      <button
                        onClick={() => removeStatement(i)}
                        className="ml-1 text-gray-400 hover:text-red-500"
                        title="Remove this statement"
                      >
                        <TrashIcon className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <label className="flex items-center gap-2 px-4 py-2 text-sm text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer">
                  <PlusIcon className="h-4 w-4" />
                  Add More
                  <input
                    type="file"
                    accept=".csv,.pdf"
                    multiple
                    className="hidden"
                    onChange={async (e) => {
                      const files = e.target.files;
                      if (!files) return;

                      for (const file of Array.from(files)) {
                        const formData = new FormData();
                        formData.append('file', file);

                        try {
                          const response = await fetch('/api/parse-statement', {
                            method: 'POST',
                            body: formData,
                          });

                          if (response.ok) {
                            const parsed = await response.json();
                            handleUpload(parsed);
                          }
                        } catch (err) {
                          console.error('Error uploading file:', err);
                        }
                      }

                      e.target.value = '';
                    }}
                  />
                </label>
                <button
                  onClick={clearAll}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <TrashIcon className="h-4 w-4" />
                  Clear All
                </button>
              </div>
            </div>

            <SummaryCards summary={summary} period={period} />

            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <SpendingByCategory
                  data={summary.byCategory}
                  customCategories={customCategories}
                />
              </div>
              <div className="lg:col-span-2">
                <TransactionTable
                  transactions={transactions}
                  customCategories={customCategories}
                  onCategoryChange={updateTransactionCategory}
                  onBulkCategoryChange={updateBulkTransactionCategories}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Category Manager Modal */}
      {showCategoryManager && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Manage Categories</h3>
              <button
                onClick={() => setShowCategoryManager(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Add Custom Category
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g., Pet Expenses"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                />
                <button
                  onClick={handleAddCategory}
                  disabled={!newCategoryName.trim()}
                  className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </div>
            </div>

            {Object.keys(customCategories).length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Categories
                </label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {Object.entries(customCategories).map(([key, config]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: config.color }}
                        />
                        <span className="text-sm text-gray-700">{config.label}</span>
                      </div>
                      <button
                        onClick={() => removeCustomCategory(key.replace('custom_', ''))}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 pt-4 border-t">
              <button
                onClick={() => setShowCategoryManager(false)}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
