'use client';

import CategoryCard from './CategoryCard';
import { InflationMetrics, FoodCategory } from '@/types/price-data';
import { getDetailedCategories } from '@/lib/api/config';

interface CategoryGridProps {
  categories: Record<FoodCategory, InflationMetrics>;
}

export default function CategoryGrid({ categories }: CategoryGridProps) {
  const detailedCategories = getDetailedCategories();

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Price Changes by Category
      </h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {detailedCategories.map((category) => {
          const metrics = categories[category.id];
          if (!metrics) return null;

          return (
            <CategoryCard
              key={category.id}
              category={category}
              metrics={metrics}
            />
          );
        })}
      </div>
    </div>
  );
}
