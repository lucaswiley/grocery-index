'use client';

import { useState } from 'react';
import ReceiptUploader from '@/components/ReceiptUploader';
import SpendingChart from '@/components/SpendingChart';
import ReceiptList from '@/components/ReceiptList';
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
        <h1 className="text-3xl font-bold text-text-primary mb-8">Grocery Receipt Tracker</h1>
        
        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold text-text-primary mb-4">Upload Receipt</h2>
              <ReceiptUploader onUpload={handleUpload} />
            </div>

            {receipts.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold text-text-primary mb-4">Recent Receipts</h2>
                <ReceiptList receipts={receipts} />
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl text-text-primary font-semibold mb-4">Spending Trends</h2>
            {receipts.length > 0 ? (
              <SpendingChart receipts={receipts} />
            ) : (
              <p className="text-text-secondary text-center py-12">
                Upload receipts to see your spending trends
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
