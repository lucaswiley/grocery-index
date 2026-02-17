'use client';

import { LightBulbIcon } from '@heroicons/react/24/outline';

interface InsightsPanelProps {
  insights: string[];
}

export default function InsightsPanel({ insights }: InsightsPanelProps) {
  if (insights.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-2 mb-4">
        <LightBulbIcon className="h-6 w-6 text-yellow-500" />
        <h3 className="text-lg font-semibold text-gray-900">
          Consumer Insights
        </h3>
      </div>

      <ul className="space-y-3">
        {insights.map((insight, index) => (
          <li
            key={index}
            className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
          >
            <span className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-medium">
              {index + 1}
            </span>
            <p className="text-sm text-gray-700">{insight}</p>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-xs text-gray-400 text-center">
        Insights generated from BLS Consumer Price Index data
      </p>
    </div>
  );
}
