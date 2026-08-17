from typing import Optional, List
from pydantic import BaseModel


class ForecastPoint(BaseModel):
    date: str
    predicted_demand: float


class ForecastResponse(BaseModel):
    product_id: str
    product_name: str
    method: str
    history_days_used: int
    average_daily_demand: float
    trend: str  # "increasing" | "decreasing" | "stable"
    forecast: List[ForecastPoint]


class ShortagePrediction(BaseModel):
    product_id: str
    product_name: str
    sku: str
    current_stock: int
    average_daily_demand: float
    forecasted_daily_demand: float
    supplier_lead_time_days: int
    estimated_days_until_stockout: Optional[float]
    predicted_stockout_date: Optional[str]
    risk_level: str  # LOW | MEDIUM | HIGH | CRITICAL
    confidence: str  # LOW | MEDIUM | HIGH, based on how much sales history exists


class ReorderRecommendation(BaseModel):
    product_id: str
    product_name: str
    sku: str
    current_stock: int
    reorder_point: int
    recommended_order_quantity: int
    forecasted_daily_demand: float
    supplier_lead_time_days: int
    safety_stock: int
    priority: str  # LOW | NORMAL | HIGH | CRITICAL
    reasoning: str
