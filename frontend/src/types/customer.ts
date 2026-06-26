export interface Customer {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  created_at: string;
  total_orders: number;
  total_spent: number;
  last_order_date: string | null;
}

export type CustomerCreate = {
  name: string;
  email: string | null;
  phone: string | null;
};

export type CustomerUpdate = {
  name?: string;
  email?: string | null;
  phone?: string | null;
};
