import logging
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import httpx

from .database import Base, engine, get_db
from . import models, schemas, ai_helper

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("IMS_Backend")

# Initialize database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Inventory Management System API",
    description="Backend API for IMS with AI Chat queries and Webhook low-stock alerts",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, specify the client origin, e.g., ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Webhook Helper Functions ---
def send_webhook_http_post(url: str, payload: dict):
    """
    Sends a synchronous POST request with a timeout. 
    Intended to run inside a FastAPI BackgroundTask to prevent blocking API responses.
    """
    try:
        with httpx.Client(timeout=4.0) as client:
            response = client.post(url, json=payload)
            logger.info(f"Webhook alert sent to {url}. Response status: {response.status_code}")
    except Exception as e:
        logger.error(f"Failed to deliver webhook to {url}: {e}")

def handle_low_stock_checks(product: models.Product, db: Session, background_tasks: BackgroundTasks):
    """
    Checks if a product's stock is at or below its reorder threshold.
    If so, writes an AlertLog and triggers all registered 'low_stock' webhook subscriptions.
    """
    if product.quantity <= product.reorder_threshold:
        msg = f"Low Stock Warning: Product '{product.name}' (Category: {product.category or 'N/A'}) has dropped to {product.quantity} items left, which is at or below the reorder threshold of {product.reorder_threshold}."
        
        # 1. Log alert in DB
        alert_log = models.AlertLog(
            product_id=product.id,
            message=msg
        )
        db.add(alert_log)
        db.commit()
        db.refresh(alert_log)
        logger.warning(f"Low stock alert logged for product ID {product.id}")

        # 2. Query webhooks
        webhooks = db.query(models.WebhookSubscription).filter(
            models.WebhookSubscription.event_type == "low_stock"
        ).all()

        if webhooks:
            payload = {
                "event": "low_stock",
                "alert_id": alert_log.id,
                "timestamp": alert_log.triggered_at.isoformat(),
                "message": msg,
                "product": {
                    "id": product.id,
                    "name": product.name,
                    "category": product.category,
                    "quantity": product.quantity,
                    "reorder_threshold": product.reorder_threshold,
                    "price": product.price,
                    "supplier_name": product.supplier_name,
                    "supplier_contact": product.supplier_contact
                }
            }
            # Enqueue webhook delivery asynchronously
            for wh in webhooks:
                logger.info(f"Scheduling webhook push to {wh.url}")
                background_tasks.add_task(send_webhook_http_post, wh.url, payload)


# --- Products Routes ---

@app.get("/api/products", response_model=List[schemas.ProductResponse])
def get_products(
    category: Optional[str] = None,
    low_stock: Optional[bool] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Product)
    
    if category:
        query = query.filter(models.Product.category.ilike(f"%{category}%"))
    
    if search:
        query = query.filter(models.Product.name.ilike(f"%{search}%"))
        
    if low_stock is not None:
        if low_stock:
            query = query.filter(models.Product.quantity <= models.Product.reorder_threshold)
        else:
            query = query.filter(models.Product.quantity > models.Product.reorder_threshold)
            
    return query.order_by(models.Product.name).all()

@app.get("/api/products/{product_id}", response_model=schemas.ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@app.post("/api/products", response_model=schemas.ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    product_in: schemas.ProductCreate, 
    background_tasks: BackgroundTasks, 
    db: Session = Depends(get_db)
):
    db_product = models.Product(**product_in.model_dump())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    
    # Check alert triggers
    handle_low_stock_checks(db_product, db, background_tasks)
    
    return db_product

@app.put("/api/products/{product_id}", response_model=schemas.ProductResponse)
def update_product(
    product_id: int, 
    product_in: schemas.ProductUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    update_data = product_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(product, key, value)
        
    db.commit()
    db.refresh(product)
    
    # Check if this update triggered low stock
    handle_low_stock_checks(product, db, background_tasks)
    
    return product

@app.delete("/api/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(product)
    db.commit()
    return None


# --- Webhooks Routes ---

@app.get("/api/webhooks", response_model=List[schemas.WebhookResponse])
def get_webhooks(db: Session = Depends(get_db)):
    return db.query(models.WebhookSubscription).all()

@app.post("/api/webhooks", response_model=schemas.WebhookResponse, status_code=status.HTTP_201_CREATED)
def subscribe_webhook(webhook_in: schemas.WebhookCreate, db: Session = Depends(get_db)):
    # Check if already exists
    existing = db.query(models.WebhookSubscription).filter(
        models.WebhookSubscription.url == webhook_in.url
    ).first()
    if existing:
        return existing
        
    db_webhook = models.WebhookSubscription(**webhook_in.model_dump())
    db.add(db_webhook)
    db.commit()
    db.refresh(db_webhook)
    return db_webhook

@app.delete("/api/webhooks/{webhook_id}", status_code=status.HTTP_204_NO_CONTENT)
def unsubscribe_webhook(webhook_id: int, db: Session = Depends(get_db)):
    webhook = db.query(models.WebhookSubscription).filter(models.WebhookSubscription.id == webhook_id).first()
    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook subscription not found")
    db.delete(webhook)
    db.commit()
    return None


# --- Alerts Routes ---

@app.get("/api/alerts", response_model=List[schemas.AlertLogResponse])
def get_alerts(db: Session = Depends(get_db)):
    results = db.query(
        models.AlertLog.id,
        models.AlertLog.product_id,
        models.Product.name.label("product_name"),
        models.AlertLog.message,
        models.AlertLog.triggered_at
    ).join(
        models.Product, models.AlertLog.product_id == models.Product.id
    ).order_by(
        models.AlertLog.triggered_at.desc()
    ).all()
    
    return [
        schemas.AlertLogResponse(
            id=r.id,
            product_id=r.product_id,
            product_name=r.product_name,
            message=r.message,
            triggered_at=r.triggered_at
        ) for r in results
    ]

@app.delete("/api/alerts", status_code=status.HTTP_204_NO_CONTENT)
def clear_alerts(db: Session = Depends(get_db)):
    db.query(models.AlertLog).delete()
    db.commit()
    return None


# --- Dashboard Statistics ---

@app.get("/api/dashboard", response_model=schemas.DashboardSummary)
def get_dashboard_summary(db: Session = Depends(get_db)):
    products = db.query(models.Product).all()
    
    total_products = len(products)
    total_stock_items = sum(p.quantity for p in products)
    total_stock_value = sum(p.price * p.quantity for p in products)
    
    low_stock_items = [p for p in products if p.quantity <= p.reorder_threshold]
    low_stock_count = len(low_stock_items)
    
    active_alerts_count = db.query(models.AlertLog).count()
    
    # Calculate category distribution
    cat_dist = {}
    for p in products:
        cat = p.category or "Uncategorized"
        cat_dist[cat] = cat_dist.get(cat, 0) + p.quantity
        
    return schemas.DashboardSummary(
        total_products=total_products,
        total_stock_items=total_stock_items,
        total_stock_value=total_stock_value,
        low_stock_count=low_stock_count,
        active_alerts_count=active_alerts_count,
        category_distribution=cat_dist,
        low_stock_items=[schemas.ProductResponse.model_validate(p) for p in low_stock_items]
    )


# --- AI Chat Query Route ---

@app.post("/api/query", response_model=schemas.ChatQueryResponse)
def query_inventory(query_in: schemas.ChatQueryRequest, db: Session = Depends(get_db)):
    if not query_in.query.strip():
        raise HTTPException(status_code=400, detail="Query text cannot be empty")
        
    logger.info(f"Processing AI query: '{query_in.query}'")
    ai_response = ai_helper.query_inventory_with_ai(db, query_in.query)
    
    return schemas.ChatQueryResponse(
        query=query_in.query,
        response=ai_response
    )
