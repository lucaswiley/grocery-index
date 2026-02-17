import {
  BLSApiResponse,
  BLSSeriesData,
  PriceDataPoint,
  PriceSeries,
  FoodCategory,
  FoodItem,
} from '@/types/price-data';
import { BLS_API_BASE_URL, BLS_SERIES_IDS, BLS_ITEM_SERIES_IDS, getDefaultDateRange } from './config';
import { getCache, setCache } from '@/lib/cache';

const BLS_API_KEY = process.env.BLS_API_KEY;

/**
 * Fetch multiple BLS series in a single API call
 * BLS allows up to 50 series per request
 */
export async function fetchBLSSeries(
  seriesIds: string[],
  startYear?: number,
  endYear?: number
): Promise<BLSSeriesData[]> {
  const { startYear: defaultStart, endYear: defaultEnd } = getDefaultDateRange();
  const start = startYear ?? defaultStart;
  const end = endYear ?? defaultEnd;

  // Create cache key based on series and date range
  const cacheKey = `bls_${seriesIds.sort().join('_')}_${start}_${end}`;

  // Check cache first
  const cached = await getCache<BLSSeriesData[]>(cacheKey);
  if (cached) {
    return cached;
  }

  // Build request body
  const requestBody: Record<string, unknown> = {
    seriesid: seriesIds,
    startyear: start.toString(),
    endyear: end.toString(),
  };

  // Add API key if available (increases rate limit from 25 to 500 requests/day)
  if (BLS_API_KEY) {
    requestBody.registrationkey = BLS_API_KEY;
  }

  try {
    const response = await fetch(BLS_API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`BLS API error: ${response.status} ${response.statusText}`);
    }

    const data: BLSApiResponse = await response.json();

    if (data.status !== 'REQUEST_SUCCEEDED') {
      throw new Error(`BLS API error: ${data.message.join(', ')}`);
    }

    const seriesData = data.Results.series;

    // Cache the result
    await setCache(cacheKey, seriesData);

    return seriesData;
  } catch (error) {
    console.error('Error fetching BLS data:', error);
    throw error;
  }
}

/**
 * Convert BLS data point to our internal format
 */
function convertBLSDataPoint(blsPoint: {
  year: string;
  period: string;
  value: string;
}): PriceDataPoint | null {
  // Skip annual averages (M13)
  if (blsPoint.period === 'M13') {
    return null;
  }

  const year = parseInt(blsPoint.year, 10);
  const month = parseInt(blsPoint.period.replace('M', ''), 10);
  const value = parseFloat(blsPoint.value);

  if (isNaN(year) || isNaN(month) || isNaN(value)) {
    return null;
  }

  return {
    date: `${year}-${month.toString().padStart(2, '0')}`,
    value,
    year,
    month,
  };
}

/**
 * Fetch data for a specific food category
 */
export async function fetchCategoryData(
  category: FoodCategory,
  yearsOfData: number = 5
): Promise<PriceSeries> {
  const seriesId = BLS_SERIES_IDS[category];
  const endYear = new Date().getFullYear();
  const startYear = endYear - yearsOfData;

  const seriesData = await fetchBLSSeries([seriesId], startYear, endYear);
  const series = seriesData.find(s => s.seriesID === seriesId);

  if (!series) {
    throw new Error(`No data found for category: ${category}`);
  }

  // Convert and sort data points (BLS returns newest first)
  const dataPoints: PriceDataPoint[] = series.data
    .map(convertBLSDataPoint)
    .filter((p): p is PriceDataPoint => p !== null)
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    seriesId,
    name: category,
    category,
    source: 'BLS',
    data: dataPoints,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Fetch data for all food categories
 */
export async function fetchAllCategoriesData(
  yearsOfData: number = 5
): Promise<Record<FoodCategory, PriceSeries>> {
  const categories = Object.keys(BLS_SERIES_IDS) as FoodCategory[];
  const seriesIds = Object.values(BLS_SERIES_IDS);
  const endYear = new Date().getFullYear();
  const startYear = endYear - yearsOfData;

  const allSeriesData = await fetchBLSSeries(seriesIds, startYear, endYear);

  const result: Partial<Record<FoodCategory, PriceSeries>> = {};

  for (const category of categories) {
    const seriesId = BLS_SERIES_IDS[category];
    const series = allSeriesData.find(s => s.seriesID === seriesId);

    if (series) {
      const dataPoints: PriceDataPoint[] = series.data
        .map(convertBLSDataPoint)
        .filter((p): p is PriceDataPoint => p !== null)
        .sort((a, b) => a.date.localeCompare(b.date));

      result[category] = {
        seriesId,
        name: category,
        category,
        source: 'BLS',
        data: dataPoints,
        lastUpdated: new Date().toISOString(),
      };
    }
  }

  return result as Record<FoodCategory, PriceSeries>;
}

/**
 * Get the latest data point for a series
 */
export function getLatestDataPoint(series: PriceSeries): PriceDataPoint | null {
  if (series.data.length === 0) return null;
  return series.data[series.data.length - 1];
}

/**
 * Get data point from N months ago
 */
export function getDataPointMonthsAgo(
  series: PriceSeries,
  monthsAgo: number
): PriceDataPoint | null {
  const latest = getLatestDataPoint(series);
  if (!latest) return null;

  // Calculate target date
  const latestDate = new Date(latest.year, latest.month - 1);
  latestDate.setMonth(latestDate.getMonth() - monthsAgo);
  const targetYear = latestDate.getFullYear();
  const targetMonth = latestDate.getMonth() + 1;
  const targetDateStr = `${targetYear}-${targetMonth.toString().padStart(2, '0')}`;

  return series.data.find(d => d.date === targetDateStr) ?? null;
}

/**
 * Calculate percentage change between two values
 */
export function calculatePercentChange(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Fetch price data for a specific food item
 * Returns actual dollar prices (not index values)
 */
export async function fetchFoodItemData(
  item: FoodItem,
  yearsOfData: number = 5
): Promise<PriceSeries> {
  const seriesId = BLS_ITEM_SERIES_IDS[item];
  const endYear = new Date().getFullYear();
  const startYear = endYear - yearsOfData;

  const seriesData = await fetchBLSSeries([seriesId], startYear, endYear);
  const series = seriesData.find(s => s.seriesID === seriesId);

  if (!series) {
    throw new Error(`No data found for item: ${item}`);
  }

  // Convert and sort data points (BLS returns newest first)
  const dataPoints: PriceDataPoint[] = series.data
    .map(convertBLSDataPoint)
    .filter((p): p is PriceDataPoint => p !== null)
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    seriesId,
    name: item,
    category: 'all_food', // Will be updated by caller if needed
    source: 'BLS',
    data: dataPoints,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Fetch price data for multiple food items
 */
export async function fetchMultipleFoodItemsData(
  items: FoodItem[],
  yearsOfData: number = 5
): Promise<Record<FoodItem, PriceSeries>> {
  const seriesIds = items.map(item => BLS_ITEM_SERIES_IDS[item]);
  const endYear = new Date().getFullYear();
  const startYear = endYear - yearsOfData;

  const allSeriesData = await fetchBLSSeries(seriesIds, startYear, endYear);

  const result: Partial<Record<FoodItem, PriceSeries>> = {};

  for (const item of items) {
    const seriesId = BLS_ITEM_SERIES_IDS[item];
    const series = allSeriesData.find(s => s.seriesID === seriesId);

    if (series) {
      const dataPoints: PriceDataPoint[] = series.data
        .map(convertBLSDataPoint)
        .filter((p): p is PriceDataPoint => p !== null)
        .sort((a, b) => a.date.localeCompare(b.date));

      result[item] = {
        seriesId,
        name: item,
        category: 'all_food',
        source: 'BLS',
        data: dataPoints,
        lastUpdated: new Date().toISOString(),
      };
    }
  }

  return result as Record<FoodItem, PriceSeries>;
}
