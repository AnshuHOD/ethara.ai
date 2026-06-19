import os
import sys
from fastapi.testclient import TestClient

# Ensure the parent directory is in the path to import 'app'
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.main import app
from app.database import Base, engine

client = TestClient(app)

def run_tests():
    print("=== STARTING INTEGRATION TESTS ===")
    
    # 1. Clean and recreate database tables
    print("Recreating database tables...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("Database ready.\n")
    
    # 2. Test Product Creation (Low Stock)
    print("Test 1: Creating low-stock product...")
    new_product = {
        "name": "Mechanical Keyboard",
        "category": "Electronics",
        "quantity": 3,
        "reorder_threshold": 10,
        "price": 89.99,
        "supplier_name": "Keychron Ltd",
        "supplier_contact": "contact@keychron.com"
    }
    response = client.post("/api/products", json=new_product)
    assert response.status_code == 201, f"Expected 201, got {response.status_code}"
    prod_data = response.json()
    assert prod_data["id"] is not None
    assert prod_data["name"] == "Mechanical Keyboard"
    print(f"[PASS] Low-stock product created with ID: {prod_data['id']}")
    
    # 3. Test Alert Logging
    print("\nTest 2: Verifying low-stock alert log...")
    response = client.get("/api/alerts")
    assert response.status_code == 200
    alerts = response.json()
    assert len(alerts) >= 1, "Should have triggered a low stock alert on creation"
    print(f"[PASS] Low-stock alert verified. Message: '{alerts[0]['message']}'")
    
    # 4. Test Webhook Subscription
    print("\nTest 3: Creating Webhook Subscription...")
    webhook = {
        "url": "http://example.com/webhook-receiver",
        "event_type": "low_stock"
    }
    response = client.post("/api/webhooks", json=webhook)
    assert response.status_code == 201
    wh_data = response.json()
    assert wh_data["id"] is not None
    assert wh_data["url"] == "http://example.com/webhook-receiver"
    print(f"[PASS] Webhook subscription created with ID: {wh_data['id']}")
    
    # 5. Test Product Update (Healthy Stock)
    print("\nTest 4: Updating product quantity to healthy level...")
    update_payload = {
        "quantity": 15
    }
    response = client.put(f"/api/products/{prod_data['id']}", json=update_payload)
    assert response.status_code == 200
    updated_prod = response.json()
    assert updated_prod["quantity"] == 15
    print(f"[PASS] Product quantity successfully updated to: {updated_prod['quantity']}")
    
    # 6. Test Dashboard Summary
    print("\nTest 5: Fetching Dashboard Summary...")
    response = client.get("/api/dashboard")
    assert response.status_code == 200
    dash = response.json()
    assert dash["total_products"] == 1
    assert dash["total_stock_items"] == 15
    assert dash["total_stock_value"] == 15 * 89.99
    assert dash["low_stock_count"] == 0  # Should be 0 now since quantity is 15
    print("[PASS] Dashboard stats correct:")
    print(f"  - Total Products: {dash['total_products']}")
    print(f"  - Total Stock Quantity: {dash['total_stock_items']}")
    print(f"  - Total Stock Value: ${dash['total_stock_value']:.2f}")
    
    # 7. Test AI Natural Language Query (Fallback engine)
    print("\nTest 6: Testing AI Assistant query (rule-based fallback)...")
    query_payload = {
        "query": "How many items are in total?"
    }
    response = client.post("/api/query", json=query_payload)
    assert response.status_code == 200
    query_resp = response.json()
    print(f"  - Prompt: '{query_resp['query']}'")
    print(f"  - Response: '{query_resp['response']}'")
    assert "15" in query_resp["response"], "Fallback answer should contain total quantity"
    print("[PASS] AI Assistant local parsing successfully verified.")
    
    print("\n=== ALL INTEGRATION TESTS PASSED SUCCESSFULLY ===")

if __name__ == "__main__":
    run_tests()
