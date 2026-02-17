'use client';

import Link from 'next/link';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import TrendIndicator from '@/components/ui/TrendIndicator';
import { InflationMetrics, FoodCategoryMeta } from '@/types/price-data';

interface CategoryCardProps {
  category: FoodCategoryMeta;
  metrics: InflationMetrics;
  sparklineData?: Array<{ value: number }>;
}

export default function CategoryCard({
  category,
  metrics,
  sparklineData = [],
}: CategoryCardProps) {
  const trendColor = metrics.yearOverYear > 0 ? '#ef4444' : '#22c55e';

  return (
    <Link href={`/category/${category.id}`} className="block group">
      <div className="bg-white rounded-lg shadow p-4 cursor-pointer border-l-4 border-transparent transition-all duration-200 ease-in-out hover:shadow-lg hover:border-primary hover:scale-[1.02] hover:bg-gray-50 group-focus:ring-2 group-focus:ring-primary group-focus:ring-offset-2">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="font-semibold text-gray-900 group-hover:text-primary transition-colors">{category.name}</h4>
            <p className="text-xs text-gray-500 mt-1">{category.description}</p>
          </div>
          <div className={`p-2 rounded-lg ${category.color} bg-opacity-10 transition-all group-hover:bg-opacity-20 group-hover:scale-110`}>
            <div className={`h-5 w-5 ${category.color.replace('bg-', 'text-')}`}>
              <CategoryIcon name={category.icon} />
            </div>
          </div>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {metrics.yearOverYear > 0 ? '+' : ''}
              {metrics.yearOverYear.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500">YoY Change</p>
            <div className="mt-1">
              <TrendIndicator value={metrics.monthOverMonth} size="sm" />
              <span className="text-xs text-gray-400 ml-1">MoM</span>
            </div>
          </div>

          {sparklineData.length > 0 && (
            <div className="w-20 h-12">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sparklineData}>
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={trendColor}
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* View details indicator */}
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-end text-sm text-gray-400 group-hover:text-primary transition-colors">
          <span className="mr-1">View details</span>
          <ArrowRightIcon className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
}

function CategoryIcon({ name }: { name: string }) {
  // Simple icon mapping - using placeholder SVGs
  const icons: Record<string, JSX.Element> = {
    CakeIcon: (
      <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75-1.5.75a3.354 3.354 0 0 1-3 0 3.354 3.354 0 0 0-3 0 3.354 3.354 0 0 1-3 0 3.354 3.354 0 0 0-3 0 3.354 3.354 0 0 1-3 0L3 16.5m18-4.5a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
    FireIcon: (
      <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
      </svg>
    ),
    BeakerIcon: (
      <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611l-.628.105a9.037 9.037 0 0 1-2.507.175 9.037 9.037 0 0 1-2.507-.175l-.628-.105c-1.717-.293-2.299-2.379-1.067-3.611L14 16.5" />
      </svg>
    ),
    SparklesIcon: (
      <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
      </svg>
    ),
    default: (
      <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
      </svg>
    ),
  };

  return icons[name] || icons.default;
}
