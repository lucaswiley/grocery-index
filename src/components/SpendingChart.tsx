import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Receipt } from '@/types/receipt';

interface SpendingChartProps {
  receipts: Receipt[];
}

export default function SpendingChart({ receipts }: SpendingChartProps) {
  // Group receipts by week and calculate total spending
  const weeklyData = receipts.reduce((acc: any[], receipt) => {
    const week = new Date(receipt.purchaseDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
    
    const existingWeek = acc.find(item => item.week === week);
    if (existingWeek) {
      existingWeek.total += receipt.totalCost;
    } else {
      acc.push({ week, total: receipt.totalCost });
    }
    return acc;
  }, []);

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={weeklyData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="week" />
          <YAxis />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="total"
            stroke="#3b82f6"
            activeDot={{ r: 8 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
