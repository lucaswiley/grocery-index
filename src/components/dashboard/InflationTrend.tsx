'use client';

import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { PriceSeries } from '@/types/price-data';

interface InflationTrendProps {
  historicalData: PriceSeries[];
}

type TimeRange = '1Y' | '3Y' | '5Y';

export default function InflationTrend({ historicalData }: InflationTrendProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('3Y');

  const chartData = useMemo(() => {
    if (historicalData.length === 0) return [];

    // Get the number of months to show
    const monthsToShow = timeRange === '1Y' ? 12 : timeRange === '3Y' ? 36 : 60;

    // Combine data from all series
    const dataMap = new Map<string, Record<string, number>>();

    for (const series of historicalData) {
      const recentData = series.data.slice(-monthsToShow);

      for (const point of recentData) {
        const existing = dataMap.get(point.date) || { date: point.date };
        existing[series.category] = point.value;
        dataMap.set(point.date, existing);
      }
    }

    // Convert to array and sort
    return Array.from(dataMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );
  }, [historicalData, timeRange]);

  const formatDate = (dateStr: string) => {
    const [year, month] = dateStr.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[parseInt(month, 10) - 1]} ${year.slice(2)}`;
  };

  const formatTooltipValue = (value: number) => value.toFixed(1);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Price Index Trends</h3>
        <div className="flex gap-2">
          {(['1Y', '3Y', '5Y'] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                timeRange === range
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

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
              domain={['auto', 'auto']}
              tickFormatter={(value) => value.toFixed(0)}
            />
            <Tooltip
              formatter={formatTooltipValue}
              labelFormatter={formatDate}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="food_at_home"
              name="Groceries"
              stroke="#22c55e"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="food_away_from_home"
              name="Dining Out"
              stroke="#f97316"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-4 text-sm text-gray-500 text-center">
        Consumer Price Index (1982-84 = 100) | Source: Bureau of Labor Statistics
      </p>
    </div>
  );
}
