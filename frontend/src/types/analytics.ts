export interface DailyRevenue {
  date: string;
  revenue: number;
}

export interface TopProduct {
  name: string;
  revenue: number;
}

export interface OrderStatusCount {
  status: string;
  count: number;
}

export interface AnalyticsSummary {
  total_revenue: number;
  total_orders: number;
  completed_orders: number;
  avg_order_value: number;
  total_customers: number;
  total_products: number;
  low_stock_count: number;
  out_of_stock_count: number;
  revenue_by_day: DailyRevenue[];
  top_products: TopProduct[];
  orders_by_status: OrderStatusCount[];
}
