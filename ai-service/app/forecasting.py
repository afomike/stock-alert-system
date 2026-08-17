"""
Demand forecasting.

Builds a daily demand time series from stock_movements (SALE + STOCK_OUT
rows), then forecasts future demand using:
  - Moving average (default / fallback — robust with sparse history)
  - Linear regression (used when there's enough history to detect a trend)

This is intentionally simple and dependency-light (numpy + scikit-learn)
rather than a heavyweight ARIMA/Prophet setup, since stock movement data
for a single SKU is usually low-volume and noisy — a robust simple model
beats an overfit complex one here.
"""
from datetime import datetime, timedelta
from typing import List

import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from sqlalchemy.orm import Session
from sqlalchemy import and_

from .models import StockMovement, Product

DEMAND_MOVEMENT_TYPES = ("SALE", "STOCK_OUT")


def get_daily_demand_series(db: Session, product_id: str, history_days: int = 60) -> pd.Series:
    """
    Returns a pandas Series indexed by date (daily frequency, no gaps)
    of total units sold/removed each day over the trailing window.
    Days with no movements are filled with 0.
    """
    since = datetime.utcnow() - timedelta(days=history_days)

    rows = (
        db.query(StockMovement.created_at, StockMovement.quantity_change)
        .filter(
            and_(
                StockMovement.product_id == product_id,
                StockMovement.type.in_(DEMAND_MOVEMENT_TYPES),
                StockMovement.created_at >= since,
            )
        )
        .all()
    )

    today = datetime.utcnow().date()
    start = (today - timedelta(days=history_days - 1))
    full_range = pd.date_range(start=start, end=today, freq="D")
    series = pd.Series(0.0, index=full_range)

    for created_at, qty_change in rows:
        day = pd.Timestamp(created_at.date())
        if day in series.index:
            series[day] += abs(qty_change)

    return series


def _moving_average_forecast(series: pd.Series, forecast_days: int, window: int = 7) -> List[float]:
    avg = series.tail(window).mean() if len(series) else 0.0
    return [round(float(avg), 2)] * forecast_days


def _trim_leading_zeros(series: pd.Series) -> pd.Series:
    """
    Drops a leading run of all-zero days before fitting a trend line.
    Without this, a product with a genuine cold start (no sales history
    before it started selling) reads as a steep artificial upward trend —
    the regression sees "0 for 40 days, then ~30/day" and extrapolates the
    jump itself as ongoing growth, wildly overshooting the real forecast.
    Trimming means the model only sees the period where the product was
    actually active.
    """
    nonzero_idx = series.to_numpy().nonzero()[0]
    if len(nonzero_idx) == 0:
        return series
    return series.iloc[nonzero_idx[0]:]


def _linear_regression_forecast(series: pd.Series, forecast_days: int):
    """
    Fits demand ~ day_index and projects forward. Returns (predictions, slope).
    Negative predictions are clipped to 0 (can't sell negative units).
    """
    trimmed = _trim_leading_zeros(series)

    x = np.arange(len(trimmed)).reshape(-1, 1)
    y = trimmed.values

    model = LinearRegression()
    model.fit(x, y)

    future_x = np.arange(len(trimmed), len(trimmed) + forecast_days).reshape(-1, 1)
    preds = model.predict(future_x)
    preds = np.clip(preds, 0, None)

    return [round(float(p), 2) for p in preds], float(model.coef_[0])


def forecast_demand(db: Session, product_id: str, forecast_days: int = 7, history_days: int = 60):
    """
    Main entrypoint. Chooses regression when there's enough non-zero history
    to fit a meaningful trend, otherwise falls back to a moving average.
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        return None

    series = get_daily_demand_series(db, product_id, history_days)
    non_zero_days = int((series > 0).sum())
    avg_daily_demand = float(series.mean())

    # Need a reasonable amount of signal before trusting a regression trend.
    use_regression = non_zero_days >= 5 and history_days >= 14

    if use_regression:
        preds, slope = _linear_regression_forecast(series, forecast_days)
        method = "linear_regression"
        if slope > 0.05:
            trend = "increasing"
        elif slope < -0.05:
            trend = "decreasing"
        else:
            trend = "stable"
    else:
        preds = _moving_average_forecast(series, forecast_days)
        method = "moving_average"
        trend = "stable"

    last_date = series.index[-1]
    forecast_points = [
        {
            "date": (last_date + timedelta(days=i + 1)).strftime("%Y-%m-%d"),
            "predicted_demand": preds[i],
        }
        for i in range(forecast_days)
    ]

    return {
        "product_id": str(product.id),
        "product_name": product.name,
        "method": method,
        "history_days_used": history_days,
        "average_daily_demand": round(avg_daily_demand, 2),
        "trend": trend,
        "forecast": forecast_points,
    }
