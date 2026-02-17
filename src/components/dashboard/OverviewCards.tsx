'use client';

import {
  ShoppingCartIcon,
  HomeIcon,
  BuildingStorefrontIcon,
} from '@heroicons/react/24/outline';
import StatCard from '@/components/ui/StatCard';
import { DashboardOverview } from '@/types/price-data';

interface OverviewCardsProps {
  overview: DashboardOverview;
}

export default function OverviewCards({ overview }: OverviewCardsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      <StatCard
        title="All Food"
        value={`${overview.allFood.yearOverYear > 0 ? '+' : ''}${overview.allFood.yearOverYear.toFixed(1)}%`}
        subtitle="Year-over-year change"
        trend={overview.allFood.yearOverYear}
        icon={<ShoppingCartIcon className="h-6 w-6 text-blue-500" />}
        color="border-blue-500"
      />
      <StatCard
        title="Groceries"
        value={`${overview.foodAtHome.yearOverYear > 0 ? '+' : ''}${overview.foodAtHome.yearOverYear.toFixed(1)}%`}
        subtitle="Food at home YoY"
        trend={overview.foodAtHome.yearOverYear}
        icon={<HomeIcon className="h-6 w-6 text-green-500" />}
        color="border-green-500"
      />
      <StatCard
        title="Dining Out"
        value={`${overview.foodAwayFromHome.yearOverYear > 0 ? '+' : ''}${overview.foodAwayFromHome.yearOverYear.toFixed(1)}%`}
        subtitle="Restaurants YoY"
        trend={overview.foodAwayFromHome.yearOverYear}
        icon={<BuildingStorefrontIcon className="h-6 w-6 text-orange-500" />}
        color="border-orange-500"
      />
    </div>
  );
}
