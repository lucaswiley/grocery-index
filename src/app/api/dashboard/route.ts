import { NextResponse } from 'next/server';
import { getDashboardData, generateInsights } from '@/lib/api/dashboard-data';

export async function GET() {
  try {
    const data = await getDashboardData();
    const insights = generateInsights(data);

    return NextResponse.json({
      ...data,
      insights,
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
