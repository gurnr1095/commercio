export type OrderStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "CANCELLED";

export interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface Order {
  id: number;
  customer_id: number;
  customer_name: string;
  status: OrderStatus;
  total: number;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

export type OrderItemCreate = {
  product_id: number;
  quantity: number;
};

export type OrderCreate = {
  customer_id: number;
  items: OrderItemCreate[];
};
