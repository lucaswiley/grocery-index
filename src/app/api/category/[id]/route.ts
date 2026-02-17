import { NextRequest, NextResponse } from 'next/server';
import { getCategoryDetail } from '@/lib/api/dashboard-data';
import { FoodCategory } from '@/types/price-data';
import { BLS_SERIES_IDS } from '@/lib/api/config';

const validCategories = Object.keys(BLS_SERIES_IDS) as FoodCategory[];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const category = id as FoodCategory;

    // Validate category
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category: ${category}` },
        { status: 400 }
      );
    }

    // Get years from query param (default 10)
    const searchParams = request.nextUrl.searchParams;
    const years = parseInt(searchParams.get('years') ?? '10', 10);

    const data = await getCategoryDetail(category, years);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Category API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category data' },
      { status: 500 }
    );
  }
}
