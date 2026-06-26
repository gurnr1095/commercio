from pydantic import BaseModel


class DailyRevenue(BaseModel):
    date: str
    revenue: float


class TopProduct(BaseModel):
    name: str
    revenue: float


class OrderStatusCount(BaseModel):
    status: str
    count: int


class AnalyticsSummary(BaseModel):
    total_revenue: float
    total_orders: int
    completed_orders: int
    avg_order_value: float
    total_customers: int
    total_products: int
    low_stock_count: int
    out_of_stock_count: int
    revenue_by_day: list[DailyRevenue]
    top_products: list[TopProduct]
    orders_by_status: list[OrderStatusCount]
