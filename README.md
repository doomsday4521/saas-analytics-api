# NexusMetrics — Multi-Tenant SaaS Analytics & Billing API

A production-grade backend infrastructure for SaaS companies to track API usage, manage billing, and detect anomalies across their customer base.

**Live Demo:** [nexusmetrics.vercel.app](https://nexusmetrics.vercel.app)  
**API Docs:** [saas-analytics-api-3.onrender.com/docs](https://saas-analytics-api-3.onrender.com/docs)

---

## What It Does

Any SaaS company with an API needs to know:
- Which customers are using what, and how much
- When customers are approaching or exceeding their limits
- How much to bill them at the end of the month
- When something looks anomalous in their usage patterns

NexusMetrics is that infrastructure layer — built as a standalone API that any SaaS product can integrate with.

---

## Features

### Multi-Tenancy
Every resource — API keys, usage logs, invoices, webhooks — is fully isolated per tenant. Zero cross-tenant data leakage through the query layer.

### API Key Management
Tenants create named API keys with cryptographically secure generation (`secrets.token_urlsafe(32)`). Keys track last usage timestamp and can be revoked at any time. Separate auth flows for dashboard (JWT) and usage logging (API key header).

### Usage Logging
Log API calls with customer ID, endpoint, method, response time, status code, and units consumed. Queryable with date filtering and pagination.

### Rate Limiting + Overage Billing
Redis-based monthly usage counter per tenant. When a tenant hits their plan limit they are **not blocked** — they go into overage and are billed per unit beyond the threshold. Warning webhook fires at 90% of the limit. This is the Twilio/Stripe overage model.

### Billing Engine
- Three-tier plan system (Free, Basic, Pro) seeded on startup
- Mid-month plan switching with correct proration
- Invoice calculation per plan period: `prorated_base + (extra_units × price_per_unit)`
- Per-line-item invoice breakdown showing exactly how each charge was calculated
- Draft/finalize invoice states — refresh a draft anytime during the month, finalize at end of month to lock it

### AI Anomaly Detection
Groq LLM (Llama 3.3-70b) analyzes usage logs for the current billing period and returns structured anomaly data — spikes, high error rates, slow response patterns, suspicious activity — with severity classification (low/medium/high).

### Webhooks
Tenants register URLs for specific event types. Fires asynchronously using `asyncio.gather` on:
- `usage.limit.exceeded` — tenant crossed their monthly limit
- `usage.limit.warning` — tenant reached 90% of their limit

### Auth
JWT access tokens + refresh token rotation. Every login revokes old tokens and issues new ones. Logout invalidates server-side.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI, Python |
| Database | PostgreSQL (Supabase), SQLAlchemy, Alembic |
| Cache / Rate Limiting | Redis (Upstash) |
| AI | Groq API (Llama 3.3-70b) |
| Frontend | React, Vite, TanStack Query, Recharts |
| Deployment | Render (backend), Vercel (frontend), Supabase (DB), Upstash (Redis) |

---

## Architecture

```
Frontend (Vercel)
      ↓
FastAPI Backend (Render)
      ↓
┌─────────────────────────────┐
│  PostgreSQL (Supabase)      │  ← tenants, usage logs, invoices, webhooks
│  Redis (Upstash)            │  ← monthly usage counters per tenant
│  Groq API                   │  ← anomaly detection
└─────────────────────────────┘
```

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register a new tenant |
| POST | `/auth/login` | Login and get tokens |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Revoke refresh token |

### API Keys
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api-keys` | Create API key |
| GET | `/api-keys` | List active keys |
| DELETE | `/api-keys/{id}` | Revoke key |

### Usage
| Method | Endpoint | Description |
|---|---|---|
| POST | `/usage/log` | Log an API call (via API key) |
| GET | `/usage/logs` | Get logs with date filtering |
| GET | `/usage/summary/{customer_id}` | Per-customer summary |
| GET | `/usage/anomalies` | AI anomaly detection |
| GET | `/usage/count` | Total call count |

### Billing
| Method | Endpoint | Description |
|---|---|---|
| GET | `/billing/plans` | List available plans |
| POST | `/billing/subscribe/{plan_id}` | Subscribe to a plan |
| GET | `/billing/current-plan` | Get active plan |
| POST | `/billing/invoices/generate` | Generate/refresh draft invoice |
| POST | `/billing/invoices/{id}/finalize` | Finalize invoice |
| GET | `/billing/invoices` | Invoice history |

### Webhooks
| Method | Endpoint | Description |
|---|---|---|
| POST | `/webhooks` | Register webhook |
| GET | `/webhooks` | List active webhooks |
| DELETE | `/webhooks/{id}` | Delete webhook |

---

## Local Development

### Prerequisites
- Python 3.11+
- PostgreSQL
- Redis (Docker: `docker run -d -p 6379:6379 redis:alpine`)
- Node.js 18+

### Backend Setup

```bash
git clone https://github.com/doomsday4521/saas-analytics-api
cd saas-analytics-api
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

Create `.env`:
```
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/saas_analytics
REDIS_URL=redis://localhost:6379
FRONTEND_URL=http://localhost:3000
GROQ_API_KEY=your-groq-key
```

Run migrations:
```bash
alembic upgrade head
```

Start backend:
```bash
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

```bash
git clone https://github.com/doomsday4521/saas-analytics-frontend
cd saas-analytics-frontend
npm install
npm run dev
```

### Demo Loop

Once running, test the full flow:

1. Register a tenant at `localhost:3000/register`
2. Create an API key in the dashboard
3. Log usage via Postman:
```bash
POST http://localhost:8000/usage/log
X-API-Key: your-key

{
  "customer_id": "customer_001",
  "endpoint": "/api/products",
  "method": "GET",
  "response_time_ms": 142,
  "status_code": 200,
  "units_used": 1
}
```
4. Watch data appear on the dashboard

---

## Deployment

| Service | Platform |
|---|---|
| Backend | Render |
| Frontend | Vercel |
| Database | Supabase |
| Redis | Upstash |

---

## License

MIT
