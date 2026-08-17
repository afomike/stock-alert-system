"""
Reorder point & recommended order quantity.

Reorder Point = (Forecasted Daily Demand x Supplier Lead Time) + Safety Stock

Recommended order quantity aims to refill up to a target level (current
maximum_stock, or a lead-time-based buffer if max isn't set) rather than
just matching the configured reorder_quantity — it reacts to actual
forecasted demand instead of a static number.
"""
from typing import List, Optional
from sqlalchemy.orm import Session

from .models import Product
from .shortage_prediction import predict_shortage, _get_lead_time


def calculate_reorder_point(forecasted_daily_demand: float, lead_time_days: int, safety_stock: int) -> int:
    import math
    return math.ceil(forecasted_daily_demand * lead_time_days + safety_stock)


def recommend_reorder(db: Session, product_id: str) -> Optional[dict]:
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        return None

    shortage = predict_shortage(db, product_id)
    lead_time = _get_lead_time(db, product)
    safety_stock = product.safety_stock or 0
    forecasted_daily_demand = shortage["forecasted_daily_demand"] if shortage else 0.0

    reorder_point = calculate_reorder_point(forecasted_daily_demand, lead_time, safety_stock)

    # Target: fill back up to maximum_stock (or a lead-time buffer if unset),
    # but never recommend less than the product's configured minimum reorder_quantity.
    target_level = product.maximum_stock or (reorder_point + forecasted_daily_demand * lead_time)
    gap_to_target = max(0, target_level - product.current_stock)
    recommended_qty = max(product.reorder_quantity or 0, round(gap_to_target))

    if product.current_stock <= 0:
        priority = "CRITICAL"
    elif product.current_stock <= reorder_point * 0.5:
        priority = "HIGH"
    elif product.current_stock <= reorder_point:
        priority = "NORMAL"
    else:
        priority = "LOW"

    reasoning = (
        f"Forecasted demand of {forecasted_daily_demand:.1f} units/day over a "
        f"{lead_time}-day supplier lead time plus {safety_stock} units safety stock "
        f"gives a reorder point of {reorder_point}. Current stock is {product.current_stock}."
    )

    return {
        "product_id": str(product.id),
        "product_name": product.name,
        "sku": product.sku,
        "current_stock": product.current_stock,
        "reorder_point": reorder_point,
        "recommended_order_quantity": int(recommended_qty),
        "forecasted_daily_demand": forecasted_daily_demand,
        "supplier_lead_time_days": lead_time,
        "safety_stock": safety_stock,
        "priority": priority,
        "reasoning": reasoning,
    }


def recommend_all_reorders(db: Session, only_needed: bool = True) -> List[dict]:
    products = db.query(Product).all()
    recommendations = [recommend_reorder(db, str(p.id)) for p in products]
    recommendations = [r for r in recommendations if r is not None]

    if only_needed:
        recommendations = [r for r in recommendations if r["current_stock"] <= r["reorder_point"]]

    priority_order = {"CRITICAL": 0, "HIGH": 1, "NORMAL": 2, "LOW": 3}
    recommendations.sort(key=lambda r: priority_order.get(r["priority"], 99))
    return recommendations
