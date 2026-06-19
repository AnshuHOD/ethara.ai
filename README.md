# ethara.ai — AI-Augmented Inventory Management Console

Welcome to the **AI-Augmented Inventory Management System (IMS)**, a premium full-stack system designed to streamline inventory tracking, automate low-stock notifications, and provide a conversational interface for business operations.

This repository implements the assignment for the **Software Engineer Assessment**. To go beyond standard CRUD functions, this project integrates advanced automation and LLM features that align with production-grade engineering principles.

---

## 🚀 Quick Start (Docker Compose)

The entire application is containerized and orchestrated. You can start the frontend, backend, and database with a single command.

### Prerequisites
- [Docker](https://www.docker.com/products/docker-desktop) installed and running.
- (Optional) A `GEMINI_API_KEY` set in your environment for natural language processing. If not provided, the system automatically runs on a smart local parsing fallback.

### Running the System
Run the following command in the root directory:

```bash
docker-compose up --build
```

- **Frontend Console**: Access [http://localhost:3000](http://localhost:3000)
- **FastAPI Documentation (Swagger)**: Access [http://localhost:8000/docs](http://localhost:8000/docs)
- **Database**: Persisted locally via a named Docker volume (`backend_db`).

---

## 🛠️ Architecture & Tech Stack

```
┌─────────────────────────┐               REST API               ┌─────────────────────────┐
│     React Frontend      │  ─────────────────────────────────▶  │     FastAPI Backend     │
│   (Vite + Vanilla CSS)  │  ◀─────────────────────────────────  │     (Python + SQLite)   │
└─────────────────────────┘                                      └────────────┬────────────┘
                                                                              │
                                                     ┌────────────────────────┼────────────────────────┐
                                                     ▼                        ▼                        ▼
                                          ┌────────────────────┐   ┌────────────────────┐   ┌────────────────────┐
                                          │   SQLite Database  │   │  Asynchronous      │   │  Google Gemini API │
                                          │     (SQLAlchemy)   │   │  Webhook Engine    │   │  (Natural Query)   │
                                          └────────────────────┘   └────────────────────┘   └────────────────────┘
```

- **Frontend**: **React (Vite)** styled with premium **Vanilla CSS**. Features a responsive Glassmorphism Dark Theme, customized animations, dynamic dashboard metrics, and interactive tabs.
- **Backend**: **FastAPI** leveraging **SQLAlchemy** (ORM) and **Pydantic** (data validation).
- **Database**: **SQLite** (for zero-configuration development, easily swappable to PostgreSQL).
- **Containerization**: Multi-stage **Dockerfiles** serving built frontend assets via **Nginx** and backend services via **Uvicorn**.

---

## ✨ AI & Automation Features (The Differentiators)

### 1. Natural Language Inventory Assistant
Allows non-technical users to query inventory status in plain English (e.g., *"Which products are low on stock?"* or *"What is our total stock valuation?"*).
- **LLM Integration**: When `GEMINI_API_KEY` is set in the environment, the backend dynamically gathers current inventory states as JSON and feeds them to the **Google Gemini API** (`gemini-1.5-flash`) with structured prompts.
- **Local Fallback Engine**: If no API key is set or the network is offline, the system falls back to a **smart local rule-based parser** to extract keywords and calculate responses on the fly. This ensures the app is fully functional out-of-the-box.

### 2. Automated Webhook-based Alerts
A notification engine that triggers events when stock levels drop to or below the reorder threshold.
- **Asynchronous Execution**: Webhook deliveries are dispatched using FastAPI's **BackgroundTasks** thread executor. This prevents slow or offline webhook endpoints from blocking database commits or degrading API response times.
- **Webhooks Config Panel**: Users can register multiple custom endpoint URLs (using testing sites like Webhook.site or custom automation nodes) and watch alerts stream out in real time.

---

## 🎓 Technical Interview Guide (Resume Alignment)

Use these talking points during your technical round to explain your architectural choices and how they map to your prior experience.

### Q1: How did you implement the AI/LLM query interface?
> **Answer**: I built a flexible AI routing controller. When the user asks a question, the backend queries the database for the current inventory, formats this status into structured JSON, and passes it as context to the Gemini API (`gemini-1.5-flash`). To make sure the system is robust and works without API keys, I designed a **local fallback parser** using substring matching and Python aggregation logic that answers common questions (like counting stocks or getting valuations) offline.

### Q2: Why use FastAPI BackgroundTasks for webhooks?
> **Answer**: In my previous internship automation work, I learned that calling external webhook endpoints synchronously inside an API thread is a major bottleneck. If the webhook destination is slow, down, or rate-limited, it blocks the main thread, delay DB commits, and causes timeouts for the client. To solve this, I wrapped the webhook request inside FastAPI's `BackgroundTasks`, which handles the HTTP POST requests asynchronously in a background worker thread. This guarantees that product creation and updates remain extremely fast.

### Q3: How is data persistence handled inside Docker?
> **Answer**: Inside `docker-compose.yml`, I configured a named volume `backend_db` mapping to the SQLite folder in the container. SQLite stores the entire database in a single local file (`inventory.db`). By mapping this file to a persistent volume, the database survives container restarts, builds, and tear-downs, mimicking production database behavior while keeping configuration overhead to zero.

### Q4: Why select SQLite instead of PostgreSQL for development?
> **Answer**: For a coding assessment, SQLite provides a zero-configuration database that runs out of the box without requiring the evaluator to configure separate database servers, users, or credentials. Since I utilized **SQLAlchemy ORM** and defined clean database schemas, migrating this system to PostgreSQL in a production environment only requires changing a single environment variable (`DATABASE_URL`) without modifying a single line of business logic.

---

## 🧪 Testing Locally

To run the automated integration tests locally (without Docker):

1. Set up a virtual environment and install dependencies:
   ```bash
   cd backend
   python -m venv .venv
   .\.venv\Scripts\activate
   pip install -r requirements.txt
   ```
2. Run the integration test suite:
   ```bash
   python verify_endpoints.py
   ```
   *(Checks product CRUD, low-stock triggers, webhook additions, dashboard metrics, and fallback AI queries).*
