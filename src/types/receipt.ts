export interface ReceiptItem {
  name: string;
  price: number;
  quantity?: number;
  unit?: string;
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
