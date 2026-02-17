'use client';

import TrendIndicator from './TrendIndicator';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  icon?: React.ReactNode;
  color?: string;
}

export default function StatCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  color = 'border-gray-200',
}: StatCardProps) {
  return (
    <div className={`bg-white rounded-lg shadow p-6 border-l-4 ${color}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-1 text-3xl font-semibold text-gray-900">
            {typeof value === 'number' ? value.toFixed(1) : value}
          </p>
          {subtitle && (
            <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          )}
          {trend !== undefined && (
            <div className="mt-2">
              <TrendIndicator value={trend} />
            </div>
          )}
        </div>
        {icon && (
          <div className="p-2 bg-gray-100 rounded-lg">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
