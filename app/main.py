from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers.auth import router as auth_router
from app.routers.api_keys import router as api_keys_router
from app.routers.usage import router as usage_router
from app.routers.billing import router as billing_router
from app.routers.webhooks import router as webhooks_router
from app.database import AsyncSessionLocal
from dotenv import load_dotenv
import os
from app.models.billing import BillingPlan, PlanType
from sqlalchemy import select

load_dotenv()
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

app = FastAPI(
    title="SaaS Analytics & Billing API",
    description="Multi-tenant usage tracking and billing infrastructure",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth_router)
app.include_router(api_keys_router)
app.include_router(usage_router)
app.include_router(billing_router)
app.include_router(webhooks_router)

@app.on_event("startup")
async def seed_plans():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(BillingPlan))
        existing = result.scalars().all()
        if existing:
            return 

        plans = [
            BillingPlan(name="Free", plan_type=PlanType.free, monthly_limit=1000, price_per_unit=0.0, base_price=0.0),
            BillingPlan(name="Basic", plan_type=PlanType.basic, monthly_limit=10000, price_per_unit=0.001, base_price=29.0),
            BillingPlan(name="Pro", plan_type=PlanType.pro, monthly_limit=100000, price_per_unit=0.0008, base_price=99.0),
        ]
        for plan in plans:
            db.add(plan)
        await db.commit()

@app.get("/")
def root():
    return {"message": "SaaS Analytics API is running"}