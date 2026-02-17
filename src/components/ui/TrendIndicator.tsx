'use client';

import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, MinusIcon } from '@heroicons/react/24/solid';

interface TrendIndicatorProps {
  value: number;
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function TrendIndicator({
  value,
  showValue = true,
  size = 'md',
}: TrendIndicatorProps) {
  const isUp = value > 0.1;
  const isDown = value < -0.1;

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const colorClass = isUp
    ? 'text-red-500'
    : isDown
    ? 'text-green-500'
    : 'text-gray-400';

  const Icon = isUp
    ? ArrowTrendingUpIcon
    : isDown
    ? ArrowTrendingDownIcon
    : MinusIcon;

  return (
    <span className={`inline-flex items-center gap-1 ${colorClass}`}>
      <Icon className={sizeClasses[size]} />
      {showValue && (
        <span className={`font-medium ${textSizeClasses[size]}`}>
          {value > 0 ? '+' : ''}
          {value.toFixed(1)}%
        </span>
      )}
    </span>
  );
}
