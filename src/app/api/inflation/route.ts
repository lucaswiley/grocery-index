import { NextRequest, NextResponse } from 'next/server';
import { calculateInflation } from '@/lib/api/dashboard-data';
import { FoodCategory } from '@/types/price-data';
import { BLS_SERIES_IDS } from '@/lib/api/config';

const validCategories = Object.keys(BLS_SERIES_IDS) as FoodCategory[];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, startDate, endDate, category = 'all_food' } = body;

    // Validate inputs
    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be a positive number' },
        { status: 400 }
      );
    }

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate are required (YYYY-MM format)' },
        { status: 400 }
      );
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      return NextResponse.json(
        { error: 'Dates must be in YYYY-MM format' },
        { status: 400 }
      );
    }

    // Validate category
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category: ${category}` },
        { status: 400 }
      );
    }

    const result = await calculateInflation(
      amount,
      startDate,
      endDate,
      category as FoodCategory
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Inflation calculation error:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to calculate inflation';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
