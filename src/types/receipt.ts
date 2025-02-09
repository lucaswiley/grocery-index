export interface ReceiptItem {
  item: string;
  price: number;
  unit: string;
  pricePerUnit: number;
}

export interface Receipt {
  id: string;
  imageUrl: string;
  totalCost: number;
  items: ReceiptItem[];
  storeName?: string;
  purchaseDate: Date;
  createdAt: Date;
  updatedAt: Date;
}
