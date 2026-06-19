from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field

# Product Schemas
class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    category: Optional[str] = None
    quantity: int = Field(default=0, ge=0)
    reorder_threshold: int = Field(default=10, ge=0)
    price: float = Field(default=0.0, ge=0.0)
    supplier_name: Optional[str] = None
    supplier_contact: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    quantity: Optional[int] = Field(None, ge=0)
    reorder_threshold: Optional[int] = Field(None, ge=0)
    price: Optional[float] = Field(None, ge=0.0)
    supplier_name: Optional[str] = None
    supplier_contact: Optional[str] = None

class ProductResponse(ProductBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Alert Log Schemas
class AlertLogResponse(BaseModel):
    id: int
    product_id: int
    product_name: Optional[str] = None
    message: str
    triggered_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Webhook Subscription Schemas
class WebhookBase(BaseModel):
    url: str
    event_type: str = "low_stock"

class WebhookCreate(WebhookBase):
    pass

class WebhookResponse(WebhookBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Dashboard Summary Schema
class DashboardSummary(BaseModel):
    total_products: int
    total_stock_items: int
    total_stock_value: float
    low_stock_count: int
    active_alerts_count: int
    category_distribution: dict
    low_stock_items: List[ProductResponse]

# Chat Query Schemas
class ChatQueryRequest(BaseModel):
    query: str

class ChatQueryResponse(BaseModel):
    query: str
    response: str
