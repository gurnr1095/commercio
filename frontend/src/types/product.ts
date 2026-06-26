export interface Product {
  id: number;
  name: string;
  sku: string;
  description: string | null;
  price: number;
  cost: number;
  stock_quantity: number;
  reorder_threshold: number;
  category: string | null;
  image_url: string | null;
}

export type ProductCreate = Omit<Product, "id">;
export type ProductUpdate = Partial<Omit<Product, "id" | "sku">>;
