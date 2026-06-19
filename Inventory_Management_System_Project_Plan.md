# Inventory Management System — AI-Augmented Build Plan
### Prepared for: Ethara AI — Software Engineer Assessment Round 1
### Candidate: Anshu (AI Automation Engineer)

---

## 1. Project Overview

A fully functional **Inventory Management System (IMS)** that lets a business track products, stock levels, categories, and suppliers — built with a clean separation of **Frontend**, **Backend**, and **Docker deployment**, exactly as required by the assessment.

The twist: instead of a plain CRUD app, this version is framed as an **AI-Automation-driven IMS**, layering in the kind of intelligent automation Anshu has already shipped in real internships (n8n pipelines, webhook-triggered alerts, LLM-based assistants). This makes the project a natural extension of her resume rather than a generic assignment — which is exactly what comes across well in a technical interview.

---

## 2. Why This Approach (Resume Alignment)

| Assignment Requirement | How It Maps to Anshu's Real Experience |
|---|---|
| Backend + Database (CRUD) | Same engineering fundamentals used in Healthcare Management Automation (n8n + Supabase + Python) |
| Automated low-stock alerts | Direct extension of the Insurance Hazard Monitoring project (automated detection + alerting) |
| Natural-language inventory queries | Builds on LLM/RAG/Prompting skills and the AI Voice Assistant project |
| Dockerized deployment | New skill, but framed as "productionizing" her automation work — a natural next step |

This narrative is the key talking point: *"I didn't just build a CRUD app — I built it the way I build automation systems: data layer, automation/alert layer, and an AI interface layer on top."*

---

## 3. Core Requirements Checklist (from the email)

- [ ] Fully functional Inventory Management System
- [ ] Frontend Repository (public, active link)
- [ ] Backend Repository (public, active link)
- [ ] Docker Repository / Image (public, active link)
- [ ] All links accessible and functional (test before submitting)
- [ ] No placeholder/generic answers in the form
- [ ] README explaining setup and usage in each repo

---

## 4. Feature Set

### 4.1 Core Features (non-negotiable, expected by any evaluator)
- Add / Edit / Delete / View products
- Track stock quantity per product
- Categorize products (e.g., Electronics, Groceries, Stationery)
- Supplier info per product (name, contact)
- Search and filter (by name, category, low-stock status)
- Dashboard: total products, total stock value, low-stock count

### 4.2 AI/Automation-Enhanced Features (the differentiator)
Pick 2–3 of these — don't try to build all, depth beats breadth in an interview:

1. **Automated Low-Stock Alert (webhook-based)**
   When stock falls below a threshold, trigger a webhook (can simulate via a simple endpoint or actual n8n/Telegram bot) — directly reusing her hazard-monitoring automation pattern.

2. **Natural-Language Inventory Query**
   A simple endpoint where a user types "How many laptops are left in stock?" and an LLM call (OpenAI/Anthropic API or even a local rule-based parser if API cost is a concern) converts it to a DB query and returns the answer. This is the single highest-impact feature for an "AI Automation Engineer" narrative.

3. **Auto-Reorder Suggestion**
   A simple rule-based or lightweight ML logic (e.g., average daily usage × lead time) that suggests reorder quantity — frame this as a "predictive automation" layer.

> Recommendation: Build #1 and #2 solidly. They're explainable in under 2 minutes each and clearly show automation + AI thinking — exactly what the JD (LLM post-training, structured data handling) is screening for.

---

## 5. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Backend | **Python + FastAPI** (or Flask) | Matches resume's Python/REST APIs skill directly |
| Database | **SQLite** for dev, easily swappable to PostgreSQL | Zero setup, fast to demo |
| Frontend | **React** (simple, functional) or plain HTML/CSS/JS | React shows more "full-stack" credibility; plain JS is faster if time-constrained |
| Automation/Alerts | Webhook endpoint, optionally wired to **n8n** or Telegram Bot | Direct resume reuse |
| AI Layer | OpenAI/Anthropic API call for the NL-query feature | Matches LLM/Prompting/RAG skills |
| Containerization | **Docker** + Dockerfile (and docker-compose for frontend+backend+db together) | Required deliverable |
| Version Control | GitHub — 2 repos (frontend, backend) or monorepo with clear folders | Required deliverable |

---

## 6. System Architecture (Text Diagram)

```
┌─────────────┐      REST API      ┌──────────────┐
│  Frontend    │ ───────────────▶  │   Backend     │
│  (React)     │ ◀───────────────  │  (FastAPI)    │
└─────────────┘                    └───────┬───────┘
                                            │
                       ┌────────────────────┼─────────────────────┐
                       ▼                    ▼                     ▼
                ┌─────────────┐     ┌──────────────┐      ┌──────────────┐
                │  SQLite/PG  │     │  Webhook /    │      │  LLM API call│
                │  Database   │     │  Alert engine │      │  (NL query)  │
                └─────────────┘     └──────────────┘      └──────────────┘
```

Everything runs inside Docker containers, orchestrated via `docker-compose.yml`.

---

## 7. Database Schema (minimal viable)

```sql
CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT,
    quantity INTEGER DEFAULT 0,
    reorder_threshold INTEGER DEFAULT 10,
    price REAL,
    supplier_name TEXT,
    supplier_contact TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE alerts_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER,
    message TEXT,
    triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 8. API Endpoints (Backend)

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/products` | List all products (supports `?category=` and `?low_stock=true`) |
| POST | `/products` | Add a new product |
| PUT | `/products/{id}` | Update product details/quantity |
| DELETE | `/products/{id}` | Remove a product |
| GET | `/dashboard` | Summary stats (total stock, low-stock count, total value) |
| POST | `/query` | Natural-language query → AI-parsed response |
| GET | `/alerts` | List triggered low-stock alerts |

---

## 9. Docker Setup

**Dockerfile (backend example):**
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**docker-compose.yml (full stack):**
```yaml
version: "3.9"
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend
```

Push the backend image to Docker Hub (`docker build -t <username>/ims-backend . && docker push <username>/ims-backend`) and share that link as the "Docker Repository/Image" in the form.

---

## 10. Build Timeline (suggested, adjust to days available)

| Day | Task |
|---|---|
| 1 | Backend: DB schema + CRUD endpoints working locally |
| 2 | Frontend: product list, add/edit forms, dashboard UI |
| 3 | Wire frontend to backend (API integration, test all flows) |
| 4 | Add 1–2 AI/automation features (low-stock alert + NL query) |
| 5 | Dockerize everything, test `docker-compose up` end-to-end |
| 6 | Write READMEs, push to GitHub, push Docker image, fill the form |

---

## 11. Repo & README Structure

```
ims-backend/
├── main.py
├── requirements.txt
├── Dockerfile
├── README.md   ← what it does, how to run, API docs
└── models.py / db.py / routes/

ims-frontend/
├── src/
├── package.json
├── Dockerfile
└── README.md   ← what it does, how to run
```

Each README should have: project description, setup steps (`pip install`, `npm install`), how to run, and a short note on the AI/automation feature included.

---

## 12. Interview Talking Points (How to Explain It Confidently)

Use this structure when asked "Walk me through your assessment":

1. **Start with the core**: "I built a standard inventory CRUD system — products, categories, stock tracking — with FastAPI and SQLite, containerized with Docker."
2. **Then highlight the differentiator**: "On top of that, I added an automation layer — similar to the n8n-based alert systems I built in my previous internships — so that when stock drops below a threshold, it automatically logs/triggers an alert instead of someone manually checking."
3. **Then the AI layer**: "I also added a natural-language query endpoint so a non-technical user could ask 'how many items are low on stock' in plain English, and it gets parsed into a DB query — this draws on the LLM and prompting work I did in my AI Voice Assistant project."
4. **If asked about scaling**: "Right now it's SQLite for simplicity, but the schema is designed to move to PostgreSQL, and the alert webhook can plug directly into Telegram/WhatsApp the way I did at Branding Pioneers."
5. **If asked about trade-offs**: Be honest — mention what you'd improve with more time (auth, role-based access, proper ML-based demand forecasting instead of rule-based).

**Key tone**: Confident, not defensive. Frame every technical decision as a conscious trade-off given the timeframe, not a limitation.

---

## 13. Final Submission Checklist

- [ ] Both repos public and pushed
- [ ] Docker image pushed and pullable (`docker pull <image>` tested on a fresh terminal)
- [ ] App runs end-to-end via `docker-compose up`
- [ ] READMEs are clear, no "mentioned in resume" placeholders
- [ ] Form filled with working links only
- [ ] Practiced the 2-minute walkthrough (Section 12) out loud at least once
