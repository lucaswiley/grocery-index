import { FoodCategory, FoodCategoryMeta, FoodItem, FoodItemMeta } from '@/types/price-data';

// BLS API Configuration
export const BLS_API_BASE_URL = 'https://api.bls.gov/publicAPI/v2/timeseries/data/';

// BLS CPI Series IDs for Food Categories
// All series use CPI-U (Consumer Price Index for All Urban Consumers)
// Base period: 1982-84 = 100
export const BLS_SERIES_IDS: Record<FoodCategory, string> = {
  all_food: 'CUUR0000SAF',           // Food and beverages
  food_at_home: 'CUUR0000SAF11',     // Food at home (groceries)
  food_away_from_home: 'CUUR0000SEFV', // Food away from home (restaurants)
  cereals_bakery: 'CUUR0000SAF111',  // Cereals and bakery products
  meats_poultry_fish_eggs: 'CUUR0000SAF112', // Meats, poultry, fish, and eggs
  dairy: 'CUUR0000SEFJ',             // Dairy and related products
  fruits_vegetables: 'CUUR0000SAF113', // Fruits and vegetables
  nonalcoholic_beverages: 'CUUR0000SAF114', // Nonalcoholic beverages
  other_food_at_home: 'CUUR0000SAF115', // Other food at home
};

// Category metadata for UI display
export const FOOD_CATEGORIES: FoodCategoryMeta[] = [
  {
    id: 'all_food',
    name: 'All Food',
    description: 'Overall food price index including groceries and dining out',
    blsSeriesId: BLS_SERIES_IDS.all_food,
    icon: 'ShoppingCartIcon',
    color: 'bg-blue-500',
  },
  {
    id: 'food_at_home',
    name: 'Groceries',
    description: 'Food purchased at grocery stores for home consumption',
    blsSeriesId: BLS_SERIES_IDS.food_at_home,
    icon: 'HomeIcon',
    color: 'bg-green-500',
  },
  {
    id: 'food_away_from_home',
    name: 'Dining Out',
    description: 'Food purchased at restaurants, cafeterias, and vending machines',
    blsSeriesId: BLS_SERIES_IDS.food_away_from_home,
    icon: 'BuildingStorefrontIcon',
    color: 'bg-orange-500',
  },
  {
    id: 'cereals_bakery',
    name: 'Cereals & Bakery',
    description: 'Bread, cereals, rice, pasta, and baked goods',
    blsSeriesId: BLS_SERIES_IDS.cereals_bakery,
    icon: 'CakeIcon',
    color: 'bg-amber-500',
  },
  {
    id: 'meats_poultry_fish_eggs',
    name: 'Meat & Eggs',
    description: 'Beef, pork, poultry, fish, seafood, and eggs',
    blsSeriesId: BLS_SERIES_IDS.meats_poultry_fish_eggs,
    icon: 'FireIcon',
    color: 'bg-red-500',
  },
  {
    id: 'dairy',
    name: 'Dairy',
    description: 'Milk, cheese, ice cream, and related products',
    blsSeriesId: BLS_SERIES_IDS.dairy,
    icon: 'BeakerIcon',
    color: 'bg-sky-500',
  },
  {
    id: 'fruits_vegetables',
    name: 'Fruits & Vegetables',
    description: 'Fresh, frozen, and canned fruits and vegetables',
    blsSeriesId: BLS_SERIES_IDS.fruits_vegetables,
    icon: 'SparklesIcon',
    color: 'bg-emerald-500',
  },
  {
    id: 'nonalcoholic_beverages',
    name: 'Beverages',
    description: 'Coffee, tea, juices, and soft drinks',
    blsSeriesId: BLS_SERIES_IDS.nonalcoholic_beverages,
    icon: 'CupSodaIcon',
    color: 'bg-purple-500',
  },
  {
    id: 'other_food_at_home',
    name: 'Other Foods',
    description: 'Fats, oils, sugars, sweets, and other prepared foods',
    blsSeriesId: BLS_SERIES_IDS.other_food_at_home,
    icon: 'SquaresPlusIcon',
    color: 'bg-gray-500',
  },
];

// Get category metadata by ID
export function getCategoryMeta(categoryId: FoodCategory): FoodCategoryMeta | undefined {
  return FOOD_CATEGORIES.find(cat => cat.id === categoryId);
}

// Get all category IDs
export function getAllCategoryIds(): FoodCategory[] {
  return FOOD_CATEGORIES.map(cat => cat.id);
}

// Get primary categories (for overview cards)
export function getPrimaryCategories(): FoodCategoryMeta[] {
  return FOOD_CATEGORIES.filter(cat =>
    ['all_food', 'food_at_home', 'food_away_from_home'].includes(cat.id)
  );
}

// Get detailed categories (for category grid)
export function getDetailedCategories(): FoodCategoryMeta[] {
  return FOOD_CATEGORIES.filter(cat =>
    !['all_food', 'food_at_home', 'food_away_from_home'].includes(cat.id)
  );
}

// BLS Series IDs for Specific Food Items (Average Prices)
// These are APU (Average Price Urban) series - actual dollar prices, not index values
export const BLS_ITEM_SERIES_IDS: Record<FoodItem, string> = {
  eggs: 'APU0000708111',           // Eggs, grade A, large, per dozen
  milk: 'APU0000709112',           // Milk, fresh, whole, fortified, per gallon
  bread: 'APU0000702111',          // Bread, white, pan, per lb
  chicken: 'APU0000706111',        // Chicken, fresh, whole, per lb
  ground_beef: 'APU0000703112',    // Ground beef, 100% beef, per lb
  bacon: 'APU0000704111',          // Bacon, sliced, per lb
  cheese: 'APU0000710212',         // Cheese, natural Cheddar, per lb
  butter: 'APU0000FS1101',         // Butter, salted, grade AA, per lb
  apples: 'APU0000711111',         // Apples, Red Delicious, per lb
  bananas: 'APU0000711211',        // Bananas, per lb
  tomatoes: 'APU0000712311',       // Tomatoes, field grown, per lb
  potatoes: 'APU0000712112',       // Potatoes, white, per lb
  coffee: 'APU0000717311',         // Coffee, ground roast, all sizes, per lb
  orange_juice: 'APU0000713111',   // Orange juice, frozen concentrate, per 12 oz
  sugar: 'APU0000715211',          // Sugar, white, all sizes, per lb
  flour: 'APU0000701111',          // Flour, white, all purpose, per lb
};

// Food item metadata for UI
export const FOOD_ITEMS: FoodItemMeta[] = [
  {
    id: 'eggs',
    name: 'Eggs',
    blsSeriesId: BLS_ITEM_SERIES_IDS.eggs,
    category: 'meats_poultry_fish_eggs',
    unit: 'per dozen',
    icon: 'egg',
  },
  {
    id: 'milk',
    name: 'Milk',
    blsSeriesId: BLS_ITEM_SERIES_IDS.milk,
    category: 'dairy',
    unit: 'per gallon',
    icon: 'milk',
  },
  {
    id: 'bread',
    name: 'Bread',
    blsSeriesId: BLS_ITEM_SERIES_IDS.bread,
    category: 'cereals_bakery',
    unit: 'per lb',
    icon: 'bread',
  },
  {
    id: 'chicken',
    name: 'Chicken',
    blsSeriesId: BLS_ITEM_SERIES_IDS.chicken,
    category: 'meats_poultry_fish_eggs',
    unit: 'per lb',
    icon: 'chicken',
  },
  {
    id: 'ground_beef',
    name: 'Ground Beef',
    blsSeriesId: BLS_ITEM_SERIES_IDS.ground_beef,
    category: 'meats_poultry_fish_eggs',
    unit: 'per lb',
    icon: 'meat',
  },
  {
    id: 'bacon',
    name: 'Bacon',
    blsSeriesId: BLS_ITEM_SERIES_IDS.bacon,
    category: 'meats_poultry_fish_eggs',
    unit: 'per lb',
    icon: 'bacon',
  },
  {
    id: 'cheese',
    name: 'Cheddar Cheese',
    blsSeriesId: BLS_ITEM_SERIES_IDS.cheese,
    category: 'dairy',
    unit: 'per lb',
    icon: 'cheese',
  },
  {
    id: 'butter',
    name: 'Butter',
    blsSeriesId: BLS_ITEM_SERIES_IDS.butter,
    category: 'dairy',
    unit: 'per lb',
    icon: 'butter',
  },
  {
    id: 'apples',
    name: 'Apples',
    blsSeriesId: BLS_ITEM_SERIES_IDS.apples,
    category: 'fruits_vegetables',
    unit: 'per lb',
    icon: 'apple',
  },
  {
    id: 'bananas',
    name: 'Bananas',
    blsSeriesId: BLS_ITEM_SERIES_IDS.bananas,
    category: 'fruits_vegetables',
    unit: 'per lb',
    icon: 'banana',
  },
  {
    id: 'tomatoes',
    name: 'Tomatoes',
    blsSeriesId: BLS_ITEM_SERIES_IDS.tomatoes,
    category: 'fruits_vegetables',
    unit: 'per lb',
    icon: 'tomato',
  },
  {
    id: 'potatoes',
    name: 'Potatoes',
    blsSeriesId: BLS_ITEM_SERIES_IDS.potatoes,
    category: 'fruits_vegetables',
    unit: 'per lb',
    icon: 'potato',
  },
  {
    id: 'coffee',
    name: 'Coffee',
    blsSeriesId: BLS_ITEM_SERIES_IDS.coffee,
    category: 'nonalcoholic_beverages',
    unit: 'per lb',
    icon: 'coffee',
  },
  {
    id: 'orange_juice',
    name: 'Orange Juice',
    blsSeriesId: BLS_ITEM_SERIES_IDS.orange_juice,
    category: 'nonalcoholic_beverages',
    unit: 'per 12 oz',
    icon: 'juice',
  },
  {
    id: 'sugar',
    name: 'Sugar',
    blsSeriesId: BLS_ITEM_SERIES_IDS.sugar,
    category: 'other_food_at_home',
    unit: 'per lb',
    icon: 'sugar',
  },
  {
    id: 'flour',
    name: 'Flour',
    blsSeriesId: BLS_ITEM_SERIES_IDS.flour,
    category: 'cereals_bakery',
    unit: 'per lb',
    icon: 'flour',
  },
];

// Get food item metadata by ID
export function getFoodItemMeta(itemId: FoodItem): FoodItemMeta | undefined {
  return FOOD_ITEMS.find(item => item.id === itemId);
}

// Get all food item IDs
export function getAllFoodItemIds(): FoodItem[] {
  return FOOD_ITEMS.map(item => item.id);
}

// FRED API Configuration (optional secondary data source)
export const FRED_API_BASE_URL = 'https://api.stlouisfed.org/fred/series/observations';

// Cache configuration
export const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
export const CACHE_DIR = '.cache';

// Default date range for historical data
export function getDefaultDateRange() {
  const endYear = new Date().getFullYear();
  const startYear = endYear - 5; // 5 years of data by default
  return { startYear, endYear };
}
