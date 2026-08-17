import os
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from .database import get_db
from .models import Product
from . import forecasting, shortage_prediction, reorder_prediction

load_dotenv()

app = FastAPI(
    title="Stock Alert AI Service",
    description="Demand forecasting, shortage prediction, and reorder recommendations "
    "for the Automated Stock Alert System. Reads from the same PostgreSQL database "
    "as the Node.js backend.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("CLIENT_URL", "*"), os.getenv("NODE_API_URL", "*")],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "service": "ai-service"}


def _require_product(db: Session, product_id: str) -> Product:
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@app.get("/forecast/{product_id}")
def get_forecast(
    product_id: str,
    forecast_days: int = Query(7, ge=1, le=90),
    history_days: int = Query(60, ge=7, le=365),
    db: Session = Depends(get_db),
):
    """Forecasted daily demand for a product over the requested horizon."""
    _require_product(db, product_id)
    result = forecasting.forecast_demand(db, product_id, forecast_days, history_days)
    if not result:
        raise HTTPException(status_code=404, detail="Product not found")
    return result


@app.get("/predict/shortage/{product_id}")
def get_shortage_prediction(product_id: str, db: Session = Depends(get_db)):
    """Estimated stockout date and risk level for a single product."""
    _require_product(db, product_id)
    result = shortage_prediction.predict_shortage(db, product_id)
    if not result:
        raise HTTPException(status_code=404, detail="Product not found")
    return result


@app.get("/predict/shortage")
def get_all_shortage_predictions(db: Session = Depends(get_db)):
    """Shortage predictions for every product, sorted by risk (CRITICAL/HIGH first)."""
    predictions = shortage_prediction.predict_all_shortages(db)
    return {"count": len(predictions), "predictions": predictions}


@app.get("/reorder/{product_id}")
def get_reorder_recommendation(product_id: str, db: Session = Depends(get_db)):
    """Reorder point + recommended order quantity for a single product."""
    _require_product(db, product_id)
    result = reorder_prediction.recommend_reorder(db, product_id)
    if not result:
        raise HTTPException(status_code=404, detail="Product not found")
    return result


@app.get("/reorder")
def get_all_reorder_recommendations(
    only_needed: bool = Query(True, description="If true, only returns products at/below their reorder point"),
    db: Session = Depends(get_db),
):
    """Reorder recommendations across all products, sorted by priority."""
    recommendations = reorder_prediction.recommend_all_reorders(db, only_needed)
    return {"count": len(recommendations), "recommendations": recommendations}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=int(os.getenv("PORT", 8000)), reload=True)
