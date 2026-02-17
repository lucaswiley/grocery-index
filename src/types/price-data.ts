// Data source identifiers
export type DataSource = 'BLS' | 'FRED';

// Food category identifiers matching BLS CPI series
export type FoodCategory =
  | 'all_food'
  | 'food_at_home'
  | 'food_away_from_home'
  | 'cereals_bakery'
  | 'meats_poultry_fish_eggs'
  | 'dairy'
  | 'fruits_vegetables'
  | 'nonalcoholic_beverages'
  | 'other_food_at_home';

// Specific food item identifiers
export type FoodItem =
  | 'eggs'
  | 'milk'
  | 'bread'
  | 'chicken'
  | 'ground_beef'
  | 'bacon'
  | 'cheese'
  | 'butter'
  | 'apples'
  | 'bananas'
  | 'tomatoes'
  | 'potatoes'
  | 'coffee'
  | 'orange_juice'
  | 'sugar'
  | 'flour';

// Metadata for specific food items
export interface FoodItemMeta {
  id: FoodItem;
  name: string;
  blsSeriesId: string;
  category: FoodCategory;
  unit: string; // e.g., "per dozen", "per lb", "per gallon"
  icon: string;
}

// Individual price data point (monthly)
export interface PriceDataPoint {
  date: string; // YYYY-MM format
  value: number; // Index value (base 1982-84 = 100)
  year: number;
  month: number;
}

// Time series data for a category
export interface PriceSeries {
  seriesId: string;
  name: string;
  category: FoodCategory;
  source: DataSource;
  data: PriceDataPoint[];
  lastUpdated: string;
}

// Inflation metrics for a category
export interface InflationMetrics {
  currentValue: number; // Latest index value
  previousMonthValue: number;
  previousYearValue: number;
  monthOverMonth: number; // MoM % change
  yearOverYear: number; // YoY % change
  trend: 'up' | 'down' | 'stable';
  lastUpdated: string;
}

// Category metadata for UI
export interface FoodCategoryMeta {
  id: FoodCategory;
  name: string;
  description: string;
  blsSeriesId: string;
  icon: string; // Heroicon name
  color: string; // Tailwind color class
}

// Dashboard overview data
export interface DashboardOverview {
  allFood: InflationMetrics;
  foodAtHome: InflationMetrics;
  foodAwayFromHome: InflationMetrics;
}

// Full dashboard data structure
export interface DashboardData {
  overview: DashboardOverview;
  categories: Record<FoodCategory, InflationMetrics>;
  historicalData: PriceSeries[];
  lastUpdated: string;
}

// BLS API response types
export interface BLSSeriesData {
  seriesID: string;
  data: BLSDataPoint[];
}

export interface BLSDataPoint {
  year: string;
  period: string; // M01-M12 for monthly
  periodName: string;
  value: string;
  footnotes: Array<{ code: string; text: string }>;
}

export interface BLSApiResponse {
  status: string;
  responseTime: number;
  message: string[];
  Results: {
    series: BLSSeriesData[];
  };
}

// Inflation calculator types
export interface InflationCalculation {
  originalAmount: number;
  adjustedAmount: number;
  startDate: string;
  endDate: string;
  category: FoodCategory;
  inflationRate: number; // Total % change
  annualizedRate: number; // Annualized % change
}
