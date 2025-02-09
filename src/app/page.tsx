'use client';

import { useState } from 'react';
import ReceiptUploader from '@/components/ReceiptUploader';
import SpendingChart from '@/components/SpendingChart';
import { Receipt } from '@/types/receipt';
import { uploadReceipt } from '@/lib/uploadReceipt';

export default function Home() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleUpload = async (file: File) => {
    setIsLoading(true);
    try {
      const receiptData = await uploadReceipt(file);
      setReceipts(prevReceipts => [receiptData, ...prevReceipts]);
    } catch (error) {
      console.error('Error processing receipt:', error);
      alert('Failed to process receipt. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Grocery Receipt Tracker</h1>
        
        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Upload Receipt</h2>
              <ReceiptUploader onUpload={handleUpload} />
            </div>

            {receipts.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Recent Receipts</h2>
                <div className="space-y-4">
                  {receipts.map((receipt) => (
                    <div key={receipt.id} className="border rounded p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{new Date(receipt.purchaseDate).toLocaleDateString()}</p>
                          <p className="text-sm text-gray-500">{receipt.storeName}</p>
                        </div>
                        <p className="font-semibold">${receipt.totalCost.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Spending Trends</h2>
            {receipts.length > 0 ? (
              <SpendingChart receipts={receipts} />
            ) : (
              <p className="text-gray-500 text-center py-12">
                Upload receipts to see your spending trends
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
