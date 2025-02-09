import { BarChart, Bar, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Receipt } from '@/types/receipt';

interface SpendingChartProps {
  receipts: Receipt[];
}

export default function SpendingChart({ receipts }: SpendingChartProps) {
  if (receipts.length === 0) return null;

  // Get the most recent receipt
  const latestReceipt = receipts[0];

  // Prepare data for total spending bar chart
  const totalSpendingData = latestReceipt.items
    .map(item => ({
      name: `${item.item} (${item.unit})`,
      total: item.price,
      unit: item.unit
    }))
    .sort((a, b) => b.total - a.total);

  // Prepare data for unit prices scatter chart
  const unitPricesData = latestReceipt.items
    .map(item => ({
      name: `${item.item} (${item.pricePerUnit.toFixed(2)}/${item.unit})`,
      pricePerUnit: item.pricePerUnit,
      unit: item.unit
    }))
    .sort((a, b) => b.pricePerUnit - a.pricePerUnit);

  // Generate colors based on price ranges
  const getBarColor = (price: number) => {
    const maxPrice = Math.max(...totalSpendingData.map(d => d.total));
    const normalized = price / maxPrice;
    return normalized > 0.8 ? '#1bae70' : `hsl(${Math.round(142)}, ${Math.round(70 + normalized * 20)}%, ${Math.round(40 + normalized * 20)}%)`;
  };

  const getScatterColor = (price: number) => {
    const maxPrice = Math.max(...unitPricesData.map(d => d.pricePerUnit));
    const normalized = price / maxPrice;
    return normalized > 0.8 ? '#1bae70' : `hsl(${Math.round(142)}, ${Math.round(70 + normalized * 20)}%, ${Math.round(40 + normalized * 20)}%)`;
  };

  return (
    <div className="space-y-8">
      <div className="w-full h-[400px]">
        <h3 className="text-lg font-semibold text-text-primary mb-2">Total Spending by Item</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={totalSpendingData}
            layout="vertical"
            margin={{
              top: 5,
              right: 30,
              left: 100,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis 
              type="category" 
              dataKey="name" 
              width={90}
              style={{ fontSize: '12px', fill: '#4B5563' }}
            />
            <Tooltip 
              contentStyle={{
                color: '#1F2937', // text-text-primary
                fontSize: '14px'
              }}
              formatter={(value: any) => {
                if (typeof value === 'number') {
                  return [`$${value.toFixed(2)}`, 'Total'];
                }
                return [value, 'Total'];
              }}
              labelFormatter={(label) => `${label}`}
            />
            <Bar dataKey="total" fill="#8884d8">
              {totalSpendingData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.total)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="w-full h-[400px]">
        <h3 className="text-lg font-semibold text-text-primary mb-2">Price per Unit by Item</h3>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart
            margin={{
              top: 5,
              right: 30,
              left: 100,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              type="category" 
              dataKey="name" 
              name="Item"
              width={90}
              style={{ fontSize: '12px', fill: '#4B5563' }}
            />
            <YAxis 
              type="number"
              dataKey="pricePerUnit"
              name="Price per Unit"
            />
            <Tooltip 
              contentStyle={{
                color: '#1F2937', // text-text-primary
                fontSize: '14px'
              }}
              formatter={(value: any) => {
                if (typeof value === 'number') {
                  return [`$${value.toFixed(2)}`, 'Price per Unit'];
                }
                return [value, 'Price per Unit'];
              }}
              labelFormatter={(label) => `${label}`}
            />
            <Scatter 
              data={unitPricesData} 
              fill="#8884d8"
            >
              {unitPricesData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getScatterColor(entry.pricePerUnit)} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
