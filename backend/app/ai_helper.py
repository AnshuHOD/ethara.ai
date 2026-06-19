import os
import json
import logging
from typing import List
from sqlalchemy.orm import Session
from .models import Product

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("AIHelper")

# Initialize Gemini API
api_key = os.getenv("GEMINI_API_KEY")
use_gemini = False

if api_key:
    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        use_gemini = True
        logger.info("Gemini API configured successfully.")
    except Exception as e:
        logger.error(f"Failed to configure Gemini API: {e}. Falling back to rule-based engine.")

def local_rule_based_query(query: str, products: List[Product]) -> str:
    """
    Fallback parser for when Gemini API is unavailable or key is not provided.
    Parses common inventory questions and constructs a natural language reply.
    """
    q = query.lower().strip()
    
    # Check for low stock queries
    if any(x in q for x in ["low stock", "reorder", "under threshold", "run out", "critical"]):
        low_stock_items = [p for p in products if p.quantity <= p.reorder_threshold]
        if not low_stock_items:
            return "Good news! There are currently no items low on stock or below their reorder threshold."
        
        reply = "Here are the items currently low on stock:\n"
        for p in low_stock_items:
            reply += f"- **{p.name}**: {p.quantity} left (reorder threshold is {p.reorder_threshold})\n"
        return reply

    # Check for total inventory value queries
    if any(x in q for x in ["total value", "worth", "value of stock", "financial"]):
        total_val = sum(p.price * p.quantity for p in products)
        return f"The total monetary value of all items currently in stock is **${total_val:,.2f}**."

    # Check for count queries (e.g., "how many laptops")
    if "how many" in q or "count of" in q or "quantity" in q:
        # Extract potential product names
        for p in products:
            if p.name.lower() in q:
                status = "healthy" if p.quantity > p.reorder_threshold else "LOW"
                return f"There are **{p.quantity}** units of **{p.name}** left in stock. (Status: {status}, Price: ${p.price:.2f})."
        
        # Check category name instead
        categories = list(set(p.category for p in products if p.category))
        for cat in categories:
            if cat.lower() in q:
                cat_products = [p for p in products if p.category == cat]
                cat_qty = sum(p.quantity for p in cat_products)
                return f"There are **{len(cat_products)}** unique products in the **{cat}** category, with a total of **{cat_qty}** units in stock."

    # Check for total items or unique products
    if any(x in q for x in ["total products", "how many unique", "different products"]):
        return f"The inventory currently lists **{len(products)}** unique products."
    
    if ("total" in q and any(x in q for x in ["item", "stock", "qty", "quantity", "count"])) or any(x in q for x in ["total stock", "total items", "number of items"]):
        total_qty = sum(p.quantity for p in products)
        return f"There are a total of **{total_qty}** physical items in stock across all categories."

    # General fallback
    return (
        "I'm here to help manage your inventory! I can answer questions like:\n"
        "- *'Which products are low on stock?'*\n"
        "- *'How many [Product Name] do we have left?'*\n"
        "- *'What is the total value of our inventory?'*\n"
        "- *'Summarize our stock in the Electronics category.'*\n\n"
        "*(Note: Gemini API is running in fallback rule-based mode. Provide `GEMINI_API_KEY` to unlock full natural language capability!)*"
    )

def query_inventory_with_ai(db: Session, query_str: str) -> str:
    """
    Executes a natural language query against the database.
    If Gemini API key is configured, uses LLM; otherwise, uses rule-based fallback.
    """
    # Fetch current product state
    products = db.query(Product).all()
    
    if not products:
        return "The inventory is currently empty. Please add some products before asking queries!"

    if not use_gemini:
        return local_rule_based_query(query_str, products)

    try:
        import google.generativeai as genai
        
        # Structure the data to pass to the model
        inventory_data = []
        for p in products:
            inventory_data.append({
                "id": p.id,
                "name": p.name,
                "category": p.category,
                "quantity": p.quantity,
                "reorder_threshold": p.reorder_threshold,
                "price": p.price,
                "supplier_name": p.supplier_name,
                "supplier_contact": p.supplier_contact
            })
            
        system_prompt = (
            "You are an expert AI Inventory Assistant for an Inventory Management System (IMS).\n"
            "You are given the exact current state of the inventory below in JSON format.\n"
            "Your task is to answer the user's question accurately, professionally, and concisely using the provided inventory data.\n"
            "Do not hallucinate or make up details. If a product isn't listed, state that it isn't in the inventory.\n\n"
            f"Current Inventory Data (JSON):\n{json.dumps(inventory_data, indent=2)}\n\n"
            f"User Question: \"{query_str}\"\n\n"
            "Response (use Markdown formatting where appropriate):"
        )
        
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(system_prompt)
        return response.text.strip()
    except Exception as e:
        logger.error(f"Gemini API execution failed: {e}. Falling back to rule-based engine.")
        return f"*(AI Error: {e} - Falling back to local engine)*\n\n" + local_rule_based_query(query_str, products)
