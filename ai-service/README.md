# Stock Alert AI Service (Python / FastAPI)

Demand forecasting, shortage prediction, and reorder recommendations for
the Automated Stock Alert System.

This service is **read-only against the same PostgreSQL database** the
Node.js backend creates and manages (`products`, `suppliers`,
`stock_movements`). It does not run migrations and never writes to those
tables — it only reads stock movement history to forecast. Point its
`DATABASE_URL` at the same database as `server/.env`.

## Why a separate service

The Node backend already has a lightweight heuristic prediction
(`/api/inventory/predictions`) using a trailing 30-day average. This
service replaces/complements that with:

- A proper **daily demand time series** (gap-filled, not just a raw sum)
- **Linear regression** to detect trend (accelerating/decelerating demand),
  falling back to moving average when there isn't enough sales history
- A **confidence** rating per prediction, based on how many days actually
  had sales activity
- Reorder recommendations that target refilling to `maximum_stock` rather
  than a static reorder quantity

## Setup

```bash
cd ai-service
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # point DATABASE_URL at the same DB as the Node backend
```

Run it (after the Node backend has created the schema — run `npm run migrate`
and ideally `npm run seed` in `server/` first, so there's data to forecast):

```bash
uvicorn app.main:app --reload --port 8000
```

Interactive API docs: `http://localhost:8000/docs`

## Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Service health check |
| GET | `/forecast/{product_id}?forecast_days=7&history_days=60` | Daily demand forecast for the requested horizon |
| GET | `/predict/shortage/{product_id}` | Stockout date + risk level for one product |
| GET | `/predict/shortage` | Shortage predictions for all products, sorted by risk |
| GET | `/reorder/{product_id}` | Reorder point + recommended order quantity for one product |
| GET | `/reorder?only_needed=true` | Reorder recommendations for all products currently at/below their reorder point |

### Example: shortage prediction response

```json
{
  "product_id": "uuid",
  "product_name": "Wireless Mouse",
  "sku": "WM-001",
  "current_stock": 8,
  "average_daily_demand": 6.0,
  "forecasted_daily_demand": 6.4,
  "supplier_lead_time_days": 4,
  "estimated_days_until_stockout": 1.3,
  "predicted_stockout_date": "2026-08-16",
  "risk_level": "HIGH",
  "confidence": "MEDIUM"
}
```

## How the forecasting works

1. **Build the time series** — pull `SALE`/`STOCK_OUT` movements for the
   trailing `history_days`, aggregate by day, and fill any day with no
   activity with 0 (so gaps don't silently vanish from the average).
2. **Choose a method**:
   - If there are at least 5 non-zero demand days in a ≥14-day window,
     fit a linear regression (`demand ~ day_index`) and use its slope to
     classify trend as increasing / decreasing / stable, and its
     projection as the forecast.
   - Otherwise (sparse history), fall back to a 7-day moving average —
     more robust when there isn't enough signal for a trend line.
3. **Shortage prediction** averages the next 7 forecasted days as
   `forecasted_daily_demand`, then:
   - `estimated_days_until_stockout = current_stock / forecasted_daily_demand`
   - `risk_level`: `CRITICAL` if already at 0, `HIGH` if days-until-stockout
     ≤ supplier lead time, `MEDIUM` if ≤ 1.5× lead time, else `LOW`.
4. **Reorder point** = `(forecasted_daily_demand × lead_time) + safety_stock`.
   Recommended order quantity targets refilling to `maximum_stock`, floored
   at the product's configured `reorder_quantity`.

## Project structure

```
ai-service/
├── app/
│   ├── main.py                 # FastAPI app + routes
│   ├── database.py             # SQLAlchemy engine/session (shared DB)
│   ├── models.py                # Read-only ORM mirror of Node's tables
│   ├── schemas.py               # Pydantic response models
│   ├── forecasting.py           # Daily demand series + MA/regression forecast
│   ├── shortage_prediction.py   # Stockout date + risk level
│   └── reorder_prediction.py    # Reorder point + recommended order qty
├── requirements.txt
└── .env.example
```

## Wiring into the Node backend / frontend

Either:
- Call this service directly from the React frontend (e.g.
  `GET http://localhost:8000/predict/shortage`) alongside the Node API, or
- Have the Node backend proxy to it (e.g. an Express route that fetches
  from `http://localhost:8000/...` and returns the result), so the frontend
  only ever talks to one API.

The Node backend's own `/api/inventory/predictions` heuristic can stay as
a fast, dependency-free fallback if this service is ever down.

## Next steps

- Swap the linear regression for a proper seasonal model (e.g.
  `statsmodels` SARIMA or Prophet) once there's enough real sales history
  to make seasonality detection meaningful.
- Add scheduled batch jobs (e.g. APScheduler) to pre-compute predictions
  and cache them, rather than recomputing per-request.
- Add ABC classification and dead-stock detection as additional endpoints
  (mentioned as bonus features in the original spec) — both are simple
  extensions of the same `stock_movements` data this service already reads.
