from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models.usage import UsageLog
from app.models.api_key import APIKey
from app.models.tenant import Tenant
from app.services.anomaly import detect_anomalies
from app.models.billing import TenantPlan, BillingPlan
from app.schemas.usage import UsageLogCreate, UsageLogResponse, UsageSummary
from app.services.api_key_auth import get_api_key
from app.services.dependencies import get_current_tenant
from app.services.rate_limiter import check_rate_limit
from app.services.webhook import trigger_webhooks
from typing import List,Optional
from datetime import datetime, timezone


router = APIRouter(prefix="/usage", tags=["Usage"])

@router.post("/log", response_model=UsageLogResponse)
async def log_usage(
    data: UsageLogCreate,
    db: AsyncSession = Depends(get_db),
    api_key: APIKey = Depends(get_api_key)
):
    tenant_plan_result = await db.execute(
        select(TenantPlan).where(
            TenantPlan.tenant_id == api_key.tenant_id,
            TenantPlan.is_active == True
        )
    )
    tenant_plan = tenant_plan_result.scalar_one_or_none()

    if not tenant_plan:
        raise HTTPException(status_code=403, detail="No active plan. Subscribe to a plan to log usage.")

    plan_result = await db.execute(
        select(BillingPlan).where(BillingPlan.id == tenant_plan.plan_id)
    )
    plan = plan_result.scalar_one_or_none()

    rate = await check_rate_limit(api_key.tenant_id, plan.monthly_limit)

    if rate["in_overage"]:
        # Notify but don't block — tenant pays for overage
        await trigger_webhooks(db, api_key.tenant_id, "usage.limit.exceeded", {
            "event": "usage.limit.exceeded",
            "tenant_id": api_key.tenant_id,
            "current_usage": rate["current"],
            "limit": rate["limit"]
        })
    else:
        warning_threshold = int(plan.monthly_limit * 0.9)
        if rate["current"] >= warning_threshold:
            await trigger_webhooks(db, api_key.tenant_id, "usage.limit.warning", {
                "event": "usage.limit.warning",
                "tenant_id": api_key.tenant_id,
                "current_usage": rate["current"],
                "limit": rate["limit"]
            })

    log = UsageLog(
        tenant_id=api_key.tenant_id,
        api_key_id=api_key.id,
        customer_id=data.customer_id,
        endpoint=data.endpoint,
        method=data.method,
        response_time_ms=data.response_time_ms,
        status_code=data.status_code,
        units_used=data.units_used
    )
    db.add(log)
    await db.commit()
    await db.refresh(log)
    return log

@router.get("/anomalies")
async def get_anomalies(
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_tenant: Tenant = Depends(get_current_tenant)
):
    result = await db.execute(
        select(UsageLog)
        .where(UsageLog.tenant_id == current_tenant.id)
        .order_by(UsageLog.created_at.desc())
        .limit(limit)
    )
    logs = result.scalars().all()

    usage_data = [
        {
            "customer_id": log.customer_id,
            "endpoint": log.endpoint,
            "response_time_ms": log.response_time_ms,
            "status_code": log.status_code,
            "units_used": log.units_used,
            "created_at": str(log.created_at)
        }
        for log in logs
    ]

    return await detect_anomalies(usage_data)

@router.get("/summary/{customer_id}", response_model=UsageSummary)
async def get_customer_summary(
    customer_id: str,
    db: AsyncSession = Depends(get_db),
    current_tenant: Tenant = Depends(get_current_tenant)
):
    result = await db.execute(
        select(
            func.count(UsageLog.id).label("total_calls"),
            func.coalesce(func.sum(UsageLog.units_used), 0).label("total_units"),
            func.coalesce(func.avg(UsageLog.response_time_ms), 0).label("avg_response_time"),
            func.count(UsageLog.id).filter(UsageLog.status_code >= 400).label("error_count")
        ).where(
            UsageLog.tenant_id == current_tenant.id,
            UsageLog.customer_id == customer_id
        )
    )
    row = result.one()
    total_calls = row.total_calls or 0
    error_rate = (row.error_count / total_calls * 100) if total_calls > 0 else 0.0

    return UsageSummary(
        customer_id=customer_id,
        total_calls=total_calls,
        total_units=int(row.total_units),
        avg_response_time=float(row.avg_response_time),
        error_rate=error_rate
    )

@router.get("/logs", response_model=List[UsageLogResponse])
async def get_usage_logs(
    skip: int = 0,
    limit: int = 50,
    from_date: Optional[datetime] = None,
    to_date: Optional[datetime] = None,
    db: AsyncSession = Depends(get_db),
    current_tenant: Tenant = Depends(get_current_tenant)
):
    query = select(UsageLog).where(UsageLog.tenant_id == current_tenant.id)

    if from_date:
        query = query.where(UsageLog.created_at >= from_date)
    if to_date:
        query = query.where(UsageLog.created_at <= to_date)

    query = query.order_by(UsageLog.created_at.desc()).offset(skip).limit(limit)

    result = await db.execute(query)
    return result.scalars().all()