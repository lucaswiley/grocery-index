'use client';

import { useState } from 'react';
import { CalculatorIcon } from '@heroicons/react/24/outline';
import { FoodCategory, InflationCalculation } from '@/types/price-data';
import { FOOD_CATEGORIES } from '@/lib/api/config';

export default function InflationCalculator() {
  const [amount, setAmount] = useState<string>('100');
  const [startDate, setStartDate] = useState<string>('2020-01');
  const [endDate, setEndDate] = useState<string>(getCurrentMonth());
  const [category, setCategory] = useState<FoodCategory>('all_food');
  const [result, setResult] = useState<InflationCalculation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCalculate() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/inflation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amount),
          startDate,
          endDate,
          category,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Calculation failed');
      }

      const data: InflationCalculation = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-2 mb-4">
        <CalculatorIcon className="h-6 w-6 text-primary" />
        <h3 className="text-lg font-semibold text-gray-900">
          Inflation Calculator
        </h3>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        See how food prices have changed over time
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount ($)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary text-gray-900"
            min="0"
            step="0.01"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="month"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary text-gray-900"
              max={endDate}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="month"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary text-gray-900"
              min={startDate}
              max={getMaxAvailableMonth()}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as FoodCategory)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary text-gray-900"
          >
            {FOOD_CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleCalculate}
          disabled={loading || !amount}
          className="w-full py-2 px-4 bg-primary text-white font-medium rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Calculating...' : 'Calculate'}
        </button>

        {error && (
          <div className="text-sm text-red-500 text-center p-3 bg-red-50 rounded-md">
            <p>{error}</p>
            {error.includes('not available') && (
              <p className="text-xs text-red-400 mt-1">
                Try selecting an earlier end date (BLS data lags 1-2 months)
              </p>
            )}
          </div>
        )}

        {result && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <p className="text-sm text-gray-500">
                ${result.originalAmount.toFixed(2)} in {formatDate(result.startDate)} =
              </p>
              <p className="text-3xl font-bold text-gray-900 my-2">
                ${result.adjustedAmount.toFixed(2)}
              </p>
              <p className="text-sm text-gray-500">
                in {formatDate(result.endDate)}
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-xs text-gray-500">Total Inflation</p>
                <p className={`text-lg font-semibold ${result.inflationRate > 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {result.inflationRate > 0 ? '+' : ''}{result.inflationRate.toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Annualized Rate</p>
                <p className={`text-lg font-semibold ${result.annualizedRate > 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {result.annualizedRate > 0 ? '+' : ''}{result.annualizedRate.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function getCurrentMonth(): string {
  // BLS data typically lags 1-2 months, so default to 2 months ago
  const now = new Date();
  now.setMonth(now.getMonth() - 2);
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getMaxAvailableMonth(): string {
  // Allow selecting up to current month, but warn if data unavailable
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function formatDate(dateStr: string): string {
  const [year, month] = dateStr.split('-');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${monthNames[parseInt(month, 10) - 1]} ${year}`;
}
