"""
Shortage prediction.

Combines the demand forecast with current stock and supplier lead time to
estimate when a product will run out and how urgent that is.
"""
from typing import List, Optional
from sqlalchemy.orm import Session

from .models import Product, Supplier
from .forecasting import forecast_demand, get_daily_demand_series

DEFAULT_LEAD_TIME_DAYS = 5


def _get_lead_time(db: Session, product: Product) -> int:
    if not product.supplier_id:
        return DEFAULT_LEAD_TIME_DAYS
    supplier = db.query(Supplier).filter(Supplier.id == product.supplier_id).first()
    if not supplier or not supplier.average_lead_time_days:
        return DEFAULT_LEAD_TIME_DAYS
    return supplier.average_lead_time_days


def _confidence_from_history(db: Session, product_id: str) -> str:
    series = get_daily_demand_series(db, product_id, history_days=30)
    non_zero_days = int((series > 0).sum())
    if non_zero_days >= 15:
        return "HIGH"
    if non_zero_days >= 5:
        return "MEDIUM"
    return "LOW"


def predict_shortage(db: Session, product_id: str) -> Optional[dict]:
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        return None

    forecast = forecast_demand(db, product_id, forecast_days=14, history_days=60)
    lead_time = _get_lead_time(db, product)
    confidence = _confidence_from_history(db, product_id)

    # Forecasted daily demand = average of the next 7 forecasted days,
    # which reacts to trend rather than only looking backward.
    forecasted_points = forecast["forecast"][:7] if forecast else []
    forecasted_daily_demand = (
        sum(p["predicted_demand"] for p in forecasted_points) / len(forecasted_points)
        if forecasted_points
        else 0.0
    )

    current_stock = product.current_stock

    if forecasted_daily_demand <= 0:
        return {
            "product_id": str(product.id),
            "product_name": product.name,
            "sku": product.sku,
            "current_stock": current_stock,
            "average_daily_demand": forecast["average_daily_demand"] if forecast else 0.0,
            "forecasted_daily_demand": 0.0,
            "supplier_lead_time_days": lead_time,
            "estimated_days_until_stockout": None,
            "predicted_stockout_date": None,
            "risk_level": "LOW",
            "confidence": confidence,
        }

    days_until_stockout = round(current_stock / forecasted_daily_demand, 1)

    from datetime import datetime, timedelta
    stockout_date = (datetime.utcnow() + timedelta(days=days_until_stockout)).strftime("%Y-%m-%d")

    if current_stock <= 0:
        risk_level = "CRITICAL"
    elif days_until_stockout <= lead_time:
        risk_level = "HIGH"
    elif days_until_stockout <= lead_time * 1.5:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"

    return {
        "product_id": str(product.id),
        "product_name": product.name,
        "sku": product.sku,
        "current_stock": current_stock,
        "average_daily_demand": forecast["average_daily_demand"] if forecast else 0.0,
        "forecasted_daily_demand": round(forecasted_daily_demand, 2),
        "supplier_lead_time_days": lead_time,
        "estimated_days_until_stockout": days_until_stockout,
        "predicted_stockout_date": stockout_date,
        "risk_level": risk_level,
        "confidence": confidence,
    }


def predict_all_shortages(db: Session) -> List[dict]:
    products = db.query(Product).all()
    predictions = [predict_shortage(db, str(p.id)) for p in products]
    predictions = [p for p in predictions if p is not None]

    risk_order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
    predictions.sort(key=lambda p: risk_order.get(p["risk_level"], 99))
    return predictions
