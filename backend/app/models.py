from datetime import datetime
from sqlalchemy import Column, DateTime, ForeignKey, Float, Integer, String
from sqlalchemy.orm import relationship
from .database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    category = Column(String, index=True, nullable=True)
    quantity = Column(Integer, default=0, nullable=False)
    reorder_threshold = Column(Integer, default=10, nullable=False)
    price = Column(Float, default=0.0, nullable=False)
    supplier_name = Column(String, nullable=True)
    supplier_contact = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    alerts = relationship("AlertLog", back_populates="product", cascade="all, delete-orphan")

class AlertLog(Base):
    __tablename__ = "alerts_log"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    message = Column(String, nullable=False)
    triggered_at = Column(DateTime, default=datetime.utcnow)

    product = relationship("Product", back_populates="alerts")

class WebhookSubscription(Base):
    __tablename__ = "webhook_subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    url = Column(String, nullable=False, unique=True)
    event_type = Column(String, default="low_stock", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
