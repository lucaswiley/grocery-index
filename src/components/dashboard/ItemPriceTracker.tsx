'use client';

import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { FOOD_ITEMS } from '@/lib/api/config';
import { FoodItem } from '@/types/price-data';
import TrendIndicator from '@/components/ui/TrendIndicator';
import Loading from '@/components/ui/Loading';

interface ItemPriceData {
  item: FoodItem;
  name: string;
  unit: string;
  currentPrice: number;
  previousMonthPrice: number;
  previousYearPrice: number;
  monthOverMonth: number;
  yearOverYear: number;
  trend: 'up' | 'down' | 'stable';
  historicalData: Array<{ date: string; price: number }>;
}

interface ItemsResponse {
  items: ItemPriceData[];
  lastUpdated: string;
}

// Color palette for chart lines
const CHART_COLORS = [
  '#1bae70', // primary green
  '#3b82f6', // blue
  '#f97316', // orange
  '#8b5cf6', // purple
  '#ef4444', // red
  '#06b6d4', // cyan
];

export default function ItemPriceTracker() {
  const [selectedItems, setSelectedItems] = useState<FoodItem[]>(['eggs', 'milk', 'bread']);
  const [data, setData] = useState<ItemsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (selectedItems.length === 0) {
        setData(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/items?items=${selectedItems.join(',')}&years=3`);
        if (!response.ok) throw new Error('Failed to fetch item data');
        const result: ItemsResponse = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [selectedItems]);

  const toggleItem = (item: FoodItem) => {
    setSelectedItems(prev => {
      if (prev.includes(item)) {
        return prev.filter(i => i !== item);
      } else if (prev.length < 6) {
        return [...prev, item];
      }
      return prev;
    });
  };

  // Prepare chart data
  const chartData = data?.items.length
    ? mergeHistoricalData(data.items)
    : [];

  const formatDate = (dateStr: string) => {
    const [year, month] = dateStr.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[parseInt(month, 10) - 1]} '${year.slice(2)}`;
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Track Specific Items</h3>
        <p className="text-sm text-gray-500">
          Select up to 6 items to compare prices over time
        </p>
      </div>

      {/* Item selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        {FOOD_ITEMS.map((item) => {
          const isSelected = selectedItems.includes(item.id);
          return (
            <button
              key={item.id}
              onClick={() => toggleItem(item.id)}
              className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                isSelected
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {item.name}
            </button>
          );
        })}
      </div>

      {loading && <Loading text="Loading price data..." />}

      {error && (
        <div className="text-center text-red-500 py-8">{error}</div>
      )}

      {!loading && !error && data && data.items.length > 0 && (
        <>
          {/* Price cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
            {data.items.map((item, index) => (
              <div
                key={item.item}
                className="p-4 border border-gray-200 rounded-lg"
                style={{ borderLeftColor: CHART_COLORS[index % CHART_COLORS.length], borderLeftWidth: 4 }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.unit}</p>
                  </div>
                  <TrendIndicator value={item.yearOverYear} size="sm" />
                </div>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  ${item.currentPrice.toFixed(2)}
                </p>
                <div className="flex gap-4 mt-2 text-xs text-gray-500">
                  <span>MoM: {item.monthOverMonth > 0 ? '+' : ''}{item.monthOverMonth.toFixed(1)}%</span>
                  <span>YoY: {item.yearOverYear > 0 ? '+' : ''}{item.yearOverYear.toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>

          {/* Price chart */}
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  stroke="#6b7280"
                  fontSize={12}
                  interval="preserveStartEnd"
                />
                <YAxis
                  stroke="#6b7280"
                  fontSize={12}
                  tickFormatter={(value) => `$${value.toFixed(2)}`}
                />
                <Tooltip
                  formatter={(value: number, name: string) => [`$${value.toFixed(2)}`, name]}
                  labelFormatter={formatDate}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                {data.items.map((item, index) => (
                  <Line
                    key={item.item}
                    type="monotone"
                    dataKey={item.name}
                    stroke={CHART_COLORS[index % CHART_COLORS.length]}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <p className="mt-4 text-xs text-gray-400 text-center">
            Average prices for U.S. cities | Source: Bureau of Labor Statistics
          </p>
        </>
      )}

      {!loading && !error && selectedItems.length === 0 && (
        <div className="text-center text-gray-500 py-12">
          Select items above to see price trends
        </div>
      )}
    </div>
  );
}

// Helper to merge historical data from multiple items into chart-ready format
function mergeHistoricalData(items: ItemPriceData[]): Array<Record<string, unknown>> {
  const dataMap = new Map<string, Record<string, unknown>>();

  for (const item of items) {
    for (const point of item.historicalData) {
      const existing = dataMap.get(point.date) || { date: point.date };
      existing[item.name] = point.price;
      dataMap.set(point.date, existing);
    }
  }

  return Array.from(dataMap.values()).sort((a, b) =>
    (a.date as string).localeCompare(b.date as string)
  );
}
