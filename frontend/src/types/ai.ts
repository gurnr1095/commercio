export interface StockAlert {
  product_name: string;
  current_stock: number;
  threshold: number;
  recommendation: string;
}

export interface InventoryAnalysis {
  summary: string;
  critical_items: StockAlert[];
  reorder_recommendations: StockAlert[];
  insights: string[];
}

export interface SalesSummary {
  headline: string;
  total_revenue_insight: string;
  top_performer: string;
  trend: "growing" | "declining" | "stable";
  key_insights: string[];
  recommendations: string[];
}
