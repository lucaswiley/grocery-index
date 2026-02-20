'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { CategorySummary, CategoryConfig, getCategoryConfig } from '@/types/statement';
import { useState } from 'react';

interface SpendingByCategoryProps {
  data: CategorySummary[];
  customCategories?: Record<string, CategoryConfig>;
}

type ChartType = 'pie' | 'bar';

export default function SpendingByCategory({ data, customCategories = {} }: SpendingByCategoryProps) {
  const [chartType, setChartType] = useState<ChartType>('pie');

  const chartData = data.map((item) => {
    const config = getCategoryConfig(item.category, customCategories);
    return {
      name: config.label,
      value: item.total,
      color: config.color,
      count: item.count,
      percentage: item.percentage,
      category: item.category,
    };
  });

  const formatCurrency = (value: number) => {
    return value.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: typeof chartData[0] }> }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white p-3 shadow-lg rounded-lg border border-gray-200">
          <p className="font-medium" style={{ color: item.color }}>
            {item.name}
          </p>
          <p className="text-gray-700">{formatCurrency(item.value)}</p>
          <p className="text-gray-500 text-sm">
            {item.count} transactions ({item.percentage.toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Spending by Category</h3>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setChartType('pie')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              chartType === 'pie'
                ? 'bg-white shadow text-gray-900'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Pie
          </button>
          <button
            onClick={() => setChartType('bar')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              chartType === 'bar'
                ? 'bg-white shadow text-gray-900'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Bar
          </button>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'pie' ? (
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(value) => <span className="text-sm text-gray-600">{value}</span>}
              />
            </PieChart>
          ) : (
            <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis
                type="number"
                tickFormatter={(value) => formatCurrency(value)}
                fontSize={12}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={100}
                fontSize={12}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {data.slice(0, 6).map((item) => {
          const config = getCategoryConfig(item.category, customCategories);
          return (
            <div
              key={item.category}
              className="flex items-center justify-between p-2 rounded-lg"
              style={{ backgroundColor: `${config.color}10` }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: config.color }}
                />
                <span className="text-sm text-gray-700">{config.label}</span>
              </div>
              <span className="text-sm font-medium" style={{ color: config.color }}>
                {formatCurrency(item.total)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
