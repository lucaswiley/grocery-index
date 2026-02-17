'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Loading from '@/components/ui/Loading';
import TrendIndicator from '@/components/ui/TrendIndicator';
import { PriceSeries, InflationMetrics, FoodCategory } from '@/types/price-data';
import { getCategoryMeta } from '@/lib/api/config';

interface CategoryDetailData {
  series: PriceSeries;
  metrics: InflationMetrics;
  monthlyChanges: Array<{ date: string; change: number }>;
}

export default function CategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<CategoryDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const categoryMeta = getCategoryMeta(id as FoodCategory);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(`/api/category/${id}?years=10`);
        if (!response.ok) {
          throw new Error('Failed to fetch category data');
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading text="Loading category data..." size="lg" />
      </div>
    );
  }

  if (error || !data || !categoryMeta) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-8 max-w-md text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {error || 'Category not found'}
          </h2>
          <Link
            href="/"
            className="text-primary hover:underline inline-flex items-center gap-1"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    const [year, month] = dateStr.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[parseInt(month, 10) - 1]} '${year.slice(2)}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        {/* Back link */}
        <Link
          href="/"
          className="text-gray-500 hover:text-gray-700 inline-flex items-center gap-1 mb-6"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Dashboard
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-3 rounded-lg ${categoryMeta.color}`}>
              <div className="h-6 w-6 text-white">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6Z" />
                </svg>
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {categoryMeta.name}
              </h1>
              <p className="text-gray-500">{categoryMeta.description}</p>
            </div>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500">Current Index</p>
            <p className="text-2xl font-bold text-gray-900">
              {data.metrics.currentValue.toFixed(1)}
            </p>
            <p className="text-xs text-gray-400">Base: 1982-84 = 100</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500">Year-over-Year</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold text-gray-900">
                {data.metrics.yearOverYear > 0 ? '+' : ''}
                {data.metrics.yearOverYear.toFixed(1)}%
              </p>
              <TrendIndicator value={data.metrics.yearOverYear} showValue={false} />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500">Month-over-Month</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold text-gray-900">
                {data.metrics.monthOverMonth > 0 ? '+' : ''}
                {data.metrics.monthOverMonth.toFixed(2)}%
              </p>
              <TrendIndicator value={data.metrics.monthOverMonth} showValue={false} />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500">Trend</p>
            <p className="text-2xl font-bold text-gray-900 capitalize">
              {data.metrics.trend}
            </p>
            <p className="text-xs text-gray-400">
              Updated: {data.metrics.lastUpdated}
            </p>
          </div>
        </div>

        {/* Price Index Chart */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Price Index History (10 Years)
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.series.data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
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
                />
                <Tooltip
                  formatter={(value: number) => [value.toFixed(1), 'Index']}
                  labelFormatter={formatDate}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#1bae70"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* YoY Changes Bar Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Year-over-Year Changes (Monthly)
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthlyChanges.slice(-24)} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
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
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'YoY Change']}
                  labelFormatter={formatDate}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Bar
                  dataKey="change"
                  fill="#1bae70"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </main>
    </div>
  );
}
