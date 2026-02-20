'use client';

import { StatementSummary } from '@/types/statement';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BanknotesIcon,
  CreditCardIcon,
  ReceiptPercentIcon,
} from '@heroicons/react/24/outline';

interface SummaryCardsProps {
  summary: StatementSummary;
  period: {
    start: string;
    end: string;
  };
}

export default function SummaryCards({ summary, period }: SummaryCardsProps) {
  const formatCurrency = (value: number) => {
    return value.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const topCategory = summary.byCategory[0];

  const cards = [
    {
      title: 'Total Expenses',
      value: formatCurrency(summary.totalExpenses),
      icon: CreditCardIcon,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-500',
    },
    {
      title: 'Total Income',
      value: formatCurrency(summary.totalIncome),
      icon: BanknotesIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-500',
    },
    {
      title: 'Net Change',
      value: formatCurrency(summary.netChange),
      icon: summary.netChange >= 0 ? ArrowTrendingUpIcon : ArrowTrendingDownIcon,
      color: summary.netChange >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: summary.netChange >= 0 ? 'bg-green-50' : 'bg-red-50',
      borderColor: summary.netChange >= 0 ? 'border-green-500' : 'border-red-500',
    },
    {
      title: 'Top Category',
      value: topCategory ? `${topCategory.category.charAt(0).toUpperCase() + topCategory.category.slice(1)}` : 'N/A',
      subValue: topCategory ? formatCurrency(topCategory.total) : undefined,
      icon: ReceiptPercentIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-500',
    },
  ];

  return (
    <div>
      <div className="mb-4 text-sm text-gray-500">
        Statement Period: {formatDate(period.start)} - {formatDate(period.end)}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className={`${card.bgColor} rounded-lg p-4 border-l-4 ${card.borderColor}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{card.title}</p>
                  <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                  {card.subValue && (
                    <p className="text-sm text-gray-500">{card.subValue}</p>
                  )}
                </div>
                <Icon className={`h-8 w-8 ${card.color} opacity-50`} />
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 text-sm text-gray-500 text-right">
        {summary.transactionCount} transactions
      </div>
    </div>
  );
}
