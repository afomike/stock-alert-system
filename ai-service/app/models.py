"""
Read-only SQLAlchemy models mirroring the tables the Node/Sequelize backend
owns and creates (products, suppliers, stock_movements). This service never
runs migrations or writes to these tables — it only reads them to forecast.
"""
from sqlalchemy import Column, String, Integer, Numeric, Date, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from .database import Base


class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(UUID(as_uuid=True), primary_key=True)
    name = Column(String)
    contact_person = Column(String)
    email = Column(String)
    phone = Column(String)
    address = Column(String)
    average_lead_time_days = Column(Integer, default=5)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)


class Product(Base):
    __tablename__ = "products"

    id = Column(UUID(as_uuid=True), primary_key=True)
    name = Column(String)
    sku = Column(String)
    category = Column(String)
    cost_price = Column(Numeric)
    selling_price = Column(Numeric)
    current_stock = Column(Integer)
    minimum_stock = Column(Integer)
    maximum_stock = Column(Integer)
    reorder_quantity = Column(Integer)
    safety_stock = Column(Integer)
    expiry_date = Column(Date, nullable=True)
    supplier_id = Column(UUID(as_uuid=True), ForeignKey("suppliers.id"), nullable=True)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)


class StockMovement(Base):
    __tablename__ = "stock_movements"

    id = Column(UUID(as_uuid=True), primary_key=True)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"))
    type = Column(String)
    quantity_change = Column(Integer)
    stock_after = Column(Integer)
    note = Column(String)
    performed_by = Column(UUID(as_uuid=True), nullable=True)
    created_at = Column(DateTime)
