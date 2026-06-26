from pydantic import BaseModel


class StockAlert(BaseModel):
    product_name: str
    current_stock: int
    threshold: int
    recommendation: str


class InventoryAnalysis(BaseModel):
    summary: str
    critical_items: list[StockAlert]
    reorder_recommendations: list[StockAlert]
    insights: list[str]


class SalesSummary(BaseModel):
    headline: str
    total_revenue_insight: str
    top_performer: str
    trend: str  # "growing" | "declining" | "stable"
    key_insights: list[str]
    recommendations: list[str]
