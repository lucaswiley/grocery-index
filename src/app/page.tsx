'use client';

import { useDashboardData } from '@/lib/hooks/useDashboardData';
import Loading from '@/components/ui/Loading';
import OverviewCards from '@/components/dashboard/OverviewCards';
import InflationTrend from '@/components/dashboard/InflationTrend';
import CategoryGrid from '@/components/dashboard/CategoryGrid';
import InflationCalculator from '@/components/dashboard/InflationCalculator';
import InsightsPanel from '@/components/dashboard/InsightsPanel';
import ItemPriceTracker from '@/components/dashboard/ItemPriceTracker';

export default function Dashboard() {
  const { data, loading, error } = useDashboardData();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading text="Loading food price data..." size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-8 max-w-md text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Unable to Load Data
          </h2>
          <p className="text-gray-500 mb-4">{error}</p>
          <p className="text-sm text-gray-400">
            Make sure you have a BLS API key configured in your environment variables.
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Food Price Dashboard
          </h1>
          <p className="text-gray-500 mt-1">
            Real-time food inflation data from the Bureau of Labor Statistics
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Last updated: {new Date(data.lastUpdated).toLocaleDateString()}
          </p>
        </div>

        {/* Overview Cards */}
        <section className="mb-8">
          <OverviewCards overview={data.overview} />
        </section>

        {/* Main Charts */}
        <section className="mb-8">
          <InflationTrend historicalData={data.historicalData} />
        </section>

        {/* Category Grid */}
        <section className="mb-8">
          <CategoryGrid categories={data.categories} />
        </section>

        {/* Item Price Tracker */}
        <section className="mb-8">
          <ItemPriceTracker />
        </section>

        {/* Calculator and Insights */}
        <section className="grid gap-8 lg:grid-cols-2">
          <InflationCalculator />
          <InsightsPanel insights={data.insights} />
        </section>
      </main>

      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-sm text-gray-500">
            Data source: U.S. Bureau of Labor Statistics Consumer Price Index
          </p>
        </div>
      </footer>
    </div>
  );
}
