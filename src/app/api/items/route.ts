import { NextRequest, NextResponse } from 'next/server';
import { fetchMultipleFoodItemsData, getLatestDataPoint, getDataPointMonthsAgo, calculatePercentChange } from '@/lib/api/bls';
import { FoodItem, InflationMetrics, PriceSeries } from '@/types/price-data';
import { BLS_ITEM_SERIES_IDS, FOOD_ITEMS } from '@/lib/api/config';
import { getCache, setCache } from '@/lib/cache';

const validItems = Object.keys(BLS_ITEM_SERIES_IDS) as FoodItem[];

interface ItemPriceData {
  item: FoodItem;
  name: string;
  unit: string;
  currentPrice: number;
  previousMonthPrice: number;
  previousYearPrice: number;
  monthOverMonth: number;
  yearOverYear: number;
  trend: 'up' | 'down' | 'stable';
  historicalData: Array<{ date: string; price: number }>;
}

function calculateItemMetrics(series: PriceSeries): {
  currentPrice: number;
  previousMonthPrice: number;
  previousYearPrice: number;
  monthOverMonth: number;
  yearOverYear: number;
  trend: 'up' | 'down' | 'stable';
} {
  const latest = getLatestDataPoint(series);
  const previousMonth = getDataPointMonthsAgo(series, 1);
  const previousYear = getDataPointMonthsAgo(series, 12);

  if (!latest) {
    return {
      currentPrice: 0,
      previousMonthPrice: 0,
      previousYearPrice: 0,
      monthOverMonth: 0,
      yearOverYear: 0,
      trend: 'stable',
    };
  }

  const mom = previousMonth ? calculatePercentChange(latest.value, previousMonth.value) : 0;
  const yoy = previousYear ? calculatePercentChange(latest.value, previousYear.value) : 0;

  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (yoy > 1) trend = 'up';
  else if (yoy < -1) trend = 'down';

  return {
    currentPrice: Math.round(latest.value * 100) / 100,
    previousMonthPrice: previousMonth ? Math.round(previousMonth.value * 100) / 100 : 0,
    previousYearPrice: previousYear ? Math.round(previousYear.value * 100) / 100 : 0,
    monthOverMonth: Math.round(mom * 100) / 100,
    yearOverYear: Math.round(yoy * 100) / 100,
    trend,
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const itemsParam = searchParams.get('items');
    const years = parseInt(searchParams.get('years') ?? '3', 10);

    // If specific items requested, fetch those; otherwise fetch all
    const itemsToFetch: FoodItem[] = itemsParam
      ? (itemsParam.split(',').filter(item => validItems.includes(item as FoodItem)) as FoodItem[])
      : validItems;

    if (itemsToFetch.length === 0) {
      return NextResponse.json({ error: 'No valid items specified' }, { status: 400 });
    }

    // Check cache
    const cacheKey = `items_${itemsToFetch.sort().join('_')}_${years}`;
    const cached = await getCache<ItemPriceData[]>(cacheKey);
    if (cached) {
      return NextResponse.json({ items: cached, lastUpdated: new Date().toISOString() });
    }

    // Fetch data
    const itemsData = await fetchMultipleFoodItemsData(itemsToFetch, years);

    // Transform to response format
    const result: ItemPriceData[] = [];

    for (const item of itemsToFetch) {
      const series = itemsData[item];
      if (!series) continue;

      const meta = FOOD_ITEMS.find(m => m.id === item);
      const metrics = calculateItemMetrics(series);

      result.push({
        item,
        name: meta?.name ?? item,
        unit: meta?.unit ?? '',
        ...metrics,
        historicalData: series.data.map(d => ({ date: d.date, price: d.value })),
      });
    }

    // Cache result
    await setCache(cacheKey, result);

    return NextResponse.json({
      items: result,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Items API error:', error);
    return NextResponse.json({ error: 'Failed to fetch item data' }, { status: 500 });
  }
}
