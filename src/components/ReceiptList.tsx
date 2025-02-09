import { useState } from 'react';
import { Receipt } from '@/types/receipt';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

interface ReceiptListProps {
  receipts: Receipt[];
}

export default function ReceiptList({ receipts }: ReceiptListProps) {
  const [expandedReceipts, setExpandedReceipts] = useState<Set<string>>(new Set());

  const toggleReceipt = (receiptId: string) => {
    setExpandedReceipts(prev => {
      const next = new Set(prev);
      if (next.has(receiptId)) {
        next.delete(receiptId);
      } else {
        next.add(receiptId);
      }
      return next;
    });
  };

  if (receipts.length === 0) {
    return (
      <p className="text-text-secondary text-center py-12">
        No receipts uploaded yet
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {receipts.map((receipt) => (
        <div 
          key={receipt.id} 
          className="border rounded-lg overflow-hidden bg-white shadow-sm"
        >
          <button
            onClick={() => toggleReceipt(receipt.id)}
            className="w-full px-4 py-3 flex justify-between items-center hover:bg-gray-50"
          >
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-text-primary text-left">
                    {new Date(receipt.purchaseDate).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-text-secondary text-left">
                    {receipt.storeName}
                  </p>
                </div>
                <p className="font-semibold text-text-primary">
                  ${receipt.totalCost.toFixed(2)}
                </p>
              </div>
            </div>
            <div className="ml-4">
              {expandedReceipts.has(receipt.id) ? (
                <ChevronUpIcon className="h-5 w-5 text-primary" />
              ) : (
                <ChevronDownIcon className="h-5 w-5 text-primary" />
              )}
            </div>
          </button>

          {expandedReceipts.has(receipt.id) && (
            <div className="border-t px-4 py-3">
              <div className="space-y-2">
                {receipt.items.map((item, index) => (
                  <div 
                    key={`${receipt.id}-${index}`}
                    className="flex justify-between items-center text-sm"
                  >
                    <div>
                      <span className="font-medium text-text-primary">{item.item}</span>
                      <span className="text-text-secondary ml-2">
                        (${item.pricePerUnit.toFixed(2)}/{item.unit})
                      </span>
                    </div>
                    <span className="font-medium text-text-primary">
                      ${item.price.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t flex justify-between text-sm">
                <span className="font-medium text-primary">Total Items:</span>
                <span className="text-text-primary">{receipt.items.length}</span>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
