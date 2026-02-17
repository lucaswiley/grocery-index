import {
  DashboardData,
  DashboardOverview,
  InflationMetrics,
  InflationCalculation,
  PriceSeries,
  FoodCategory,
} from '@/types/price-data';
import {
  fetchAllCategoriesData,
  fetchCategoryData,
  getLatestDataPoint,
  getDataPointMonthsAgo,
  calculatePercentChange,
} from './bls';
import { getCache, setCache } from '@/lib/cache';

const DASHBOARD_CACHE_KEY = 'dashboard_data';

/**
 * Calculate inflation metrics for a price series
 */
export function calculateInflationMetrics(series: PriceSeries): InflationMetrics {
  const latest = getLatestDataPoint(series);
  const previousMonth = getDataPointMonthsAgo(series, 1);
  const previousYear = getDataPointMonthsAgo(series, 12);

  if (!latest) {
    return {
      currentValue: 0,
      previousMonthValue: 0,
      previousYearValue: 0,
      monthOverMonth: 0,
      yearOverYear: 0,
      trend: 'stable',
      lastUpdated: new Date().toISOString(),
    };
  }

  const mom = previousMonth
    ? calculatePercentChange(latest.value, previousMonth.value)
    : 0;

  const yoy = previousYear
    ? calculatePercentChange(latest.value, previousYear.value)
    : 0;

  // Determine trend based on YoY change
  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (yoy > 0.5) trend = 'up';
  else if (yoy < -0.5) trend = 'down';

  return {
    currentValue: latest.value,
    previousMonthValue: previousMonth?.value ?? 0,
    previousYearValue: previousYear?.value ?? 0,
    monthOverMonth: Math.round(mom * 100) / 100,
    yearOverYear: Math.round(yoy * 100) / 100,
    trend,
    lastUpdated: latest.date,
  };
}

/**
 * Get full dashboard data with all categories and metrics
 */
export async function getDashboardData(): Promise<DashboardData> {
  // Check cache first
  const cached = await getCache<DashboardData>(DASHBOARD_CACHE_KEY);
  if (cached) {
    return cached;
  }

  // Fetch all category data
  const categoriesData = await fetchAllCategoriesData(5);

  // Calculate metrics for each category
  const categories: Record<FoodCategory, InflationMetrics> = {} as Record<
    FoodCategory,
    InflationMetrics
  >;

  for (const [category, series] of Object.entries(categoriesData)) {
    categories[category as FoodCategory] = calculateInflationMetrics(series);
  }

  // Build overview from primary categories
  const overview: DashboardOverview = {
    allFood: categories.all_food,
    foodAtHome: categories.food_at_home,
    foodAwayFromHome: categories.food_away_from_home,
  };

  // Prepare historical data for charts (food at home and food away from home)
  const historicalData: PriceSeries[] = [
    categoriesData.food_at_home,
    categoriesData.food_away_from_home,
  ];

  const dashboardData: DashboardData = {
    overview,
    categories,
    historicalData,
    lastUpdated: new Date().toISOString(),
  };

  // Cache the result
  await setCache(DASHBOARD_CACHE_KEY, dashboardData);

  return dashboardData;
}

/**
 * Get detailed data for a specific category
 */
export async function getCategoryDetail(
  category: FoodCategory,
  yearsOfData: number = 10
): Promise<{
  series: PriceSeries;
  metrics: InflationMetrics;
  monthlyChanges: Array<{ date: string; change: number }>;
}> {
  const series = await fetchCategoryData(category, yearsOfData);
  const metrics = calculateInflationMetrics(series);

  // Calculate monthly YoY changes for the chart
  const monthlyChanges: Array<{ date: string; change: number }> = [];

  for (let i = 12; i < series.data.length; i++) {
    const current = series.data[i];
    const yearAgo = series.data[i - 12];

    if (current && yearAgo) {
      const change = calculatePercentChange(current.value, yearAgo.value);
      monthlyChanges.push({
        date: current.date,
        change: Math.round(change * 100) / 100,
      });
    }
  }

  return { series, metrics, monthlyChanges };
}

/**
 * Calculate inflation-adjusted value
 */
export async function calculateInflation(
  amount: number,
  startDate: string, // YYYY-MM format
  endDate: string, // YYYY-MM format
  category: FoodCategory = 'all_food'
): Promise<InflationCalculation> {
  // Parse dates
  const [startYear, startMonth] = startDate.split('-').map(Number);
  const [endYear, endMonth] = endDate.split('-').map(Number);

  // Fetch data for the date range
  const yearsNeeded = endYear - startYear + 1;
  const series = await fetchCategoryData(category, yearsNeeded + 1);

  // Find the data points for start and end dates
  const startPoint = series.data.find(
    d => d.year === startYear && d.month === startMonth
  );
  const endPoint = series.data.find(
    d => d.year === endYear && d.month === endMonth
  );

  if (!startPoint || !endPoint) {
    throw new Error('Price data not available for the specified date range');
  }

  // Calculate inflation
  const inflationRate = calculatePercentChange(endPoint.value, startPoint.value);

  // Calculate adjusted amount
  const adjustedAmount = amount * (endPoint.value / startPoint.value);

  // Calculate annualized rate
  const monthsDiff =
    (endYear - startYear) * 12 + (endMonth - startMonth);
  const yearsDiff = monthsDiff / 12;
  const annualizedRate =
    yearsDiff > 0
      ? (Math.pow(endPoint.value / startPoint.value, 1 / yearsDiff) - 1) * 100
      : 0;

  return {
    originalAmount: amount,
    adjustedAmount: Math.round(adjustedAmount * 100) / 100,
    startDate,
    endDate,
    category,
    inflationRate: Math.round(inflationRate * 100) / 100,
    annualizedRate: Math.round(annualizedRate * 100) / 100,
  };
}

/**
 * Generate consumer insights based on current data
 */
export function generateInsights(data: DashboardData): string[] {
  const insights: string[] = [];
  const { overview, categories } = data;

  // Compare groceries vs dining out
  const groceryInflation = overview.foodAtHome.yearOverYear;
  const diningOutInflation = overview.foodAwayFromHome.yearOverYear;

  if (groceryInflation < diningOutInflation) {
    const diff = Math.round((diningOutInflation - groceryInflation) * 10) / 10;
    insights.push(
      `Cooking at home is relatively cheaper: grocery prices are up ${groceryInflation.toFixed(1)}% while dining out is up ${diningOutInflation.toFixed(1)}% (${diff}% difference)`
    );
  } else if (groceryInflation > diningOutInflation) {
    insights.push(
      `Unusual trend: grocery inflation (${groceryInflation.toFixed(1)}%) is higher than dining out (${diningOutInflation.toFixed(1)}%)`
    );
  }

  // Find highest and lowest inflation categories
  const categoryEntries = Object.entries(categories)
    .filter(([key]) => !['all_food', 'food_at_home', 'food_away_from_home'].includes(key))
    .map(([key, metrics]) => ({ category: key, yoy: metrics.yearOverYear }))
    .sort((a, b) => b.yoy - a.yoy);

  if (categoryEntries.length > 0) {
    const highest = categoryEntries[0];
    const lowest = categoryEntries[categoryEntries.length - 1];

    if (highest.yoy > 5) {
      insights.push(
        `${formatCategoryName(highest.category)} prices are rising fastest at ${highest.yoy.toFixed(1)}% YoY`
      );
    }

    if (lowest.yoy < 2) {
      insights.push(
        `${formatCategoryName(lowest.category)} is the best value right now with only ${lowest.yoy.toFixed(1)}% inflation`
      );
    }
  }

  // Overall food inflation context
  if (overview.allFood.yearOverYear > 3) {
    insights.push(
      `Food prices overall are up ${overview.allFood.yearOverYear.toFixed(1)}% from last year`
    );
  } else if (overview.allFood.yearOverYear < 2) {
    insights.push(
      `Good news: food inflation is moderate at ${overview.allFood.yearOverYear.toFixed(1)}% YoY`
    );
  }

  // Month-over-month trend
  if (Math.abs(overview.allFood.monthOverMonth) > 0.5) {
    const direction = overview.allFood.monthOverMonth > 0 ? 'rose' : 'fell';
    insights.push(
      `Food prices ${direction} ${Math.abs(overview.allFood.monthOverMonth).toFixed(1)}% last month`
    );
  }

  return insights;
}

/**
 * Format category ID to display name
 */
function formatCategoryName(category: string): string {
  const nameMap: Record<string, string> = {
    cereals_bakery: 'Cereals & Bakery',
    meats_poultry_fish_eggs: 'Meat & Eggs',
    dairy: 'Dairy',
    fruits_vegetables: 'Fruits & Vegetables',
    nonalcoholic_beverages: 'Beverages',
    other_food_at_home: 'Other Foods',
  };
  return nameMap[category] || category;
}
