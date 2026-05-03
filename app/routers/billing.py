from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from app.database import get_db
from app.models.billing import BillingPlan, TenantPlan, Invoice, InvoiceStatus, InvoiceLineItem
from app.models.usage import UsageLog
from app.models.tenant import Tenant
from app.schemas.billing import BillingPlanCreate, BillingPlanResponse, TenantPlanResponse, InvoiceResponse
from app.services.dependencies import get_current_tenant
from typing import List
from datetime import datetime, timezone, timedelta

router = APIRouter(prefix="/billing", tags=["Billing"])

@router.post("/plans", response_model=BillingPlanResponse)
async def create_plan(
    data: BillingPlanCreate,
    db: AsyncSession = Depends(get_db),
    current_tenant: Tenant = Depends(get_current_tenant)
):
    plan = BillingPlan(**data.model_dump())
    db.add(plan)
    await db.commit()
    await db.refresh(plan)
    return plan

@router.get("/plans", response_model=List[BillingPlanResponse])
async def list_plans(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(BillingPlan).where(BillingPlan.is_active == True)
    )
    return result.scalars().all()

@router.get("/current-plan")
async def get_current_plan(
    db: AsyncSession = Depends(get_db),
    current_tenant: Tenant = Depends(get_current_tenant)
):
    tenant_plan_result = await db.execute(
        select(TenantPlan, BillingPlan)
        .join(BillingPlan, TenantPlan.plan_id == BillingPlan.id)
        .where(
            TenantPlan.tenant_id == current_tenant.id,
            TenantPlan.is_active == True
        )
    )
    row = tenant_plan_result.first()
    if not row:
        return {"active_plan": None}

    tenant_plan, billing_plan = row
    return {
        "active_plan": {
            "tenant_plan_id": tenant_plan.id,
            "plan_id": billing_plan.id,
            "name": billing_plan.name,
            "plan_type": billing_plan.plan_type,
            "monthly_limit": billing_plan.monthly_limit,
            "base_price": billing_plan.base_price,
            "price_per_unit": billing_plan.price_per_unit,
            "started_at": tenant_plan.started_at
        }
    }

@router.post("/subscribe/{plan_id}", response_model=TenantPlanResponse)
async def subscribe_to_plan(
    plan_id: str,
    db: AsyncSession = Depends(get_db),
    current_tenant: Tenant = Depends(get_current_tenant)
):
    plan_result = await db.execute(select(BillingPlan).where(BillingPlan.id == plan_id))
    plan = plan_result.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    existing = await db.execute(
        select(TenantPlan).where(
            TenantPlan.tenant_id == current_tenant.id,
            TenantPlan.is_active == True
        )
    )
    existing_plan = existing.scalar_one_or_none()
    if existing_plan:
        existing_plan.is_active = False
        existing_plan.ended_at = datetime.now(timezone.utc)

    tenant_plan = TenantPlan(tenant_id=current_tenant.id, plan_id=plan_id)
    db.add(tenant_plan)
    await db.commit()
    await db.refresh(tenant_plan)
    return tenant_plan

@router.post("/invoices/generate", response_model=InvoiceResponse)
async def generate_invoice(
    db: AsyncSession = Depends(get_db),
    current_tenant: Tenant = Depends(get_current_tenant)
):
    now = datetime.now(timezone.utc)
    period_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    # Check if invoice already exists for this period
    existing_result = await db.execute(
        select(Invoice).where(
            Invoice.tenant_id == current_tenant.id,
            Invoice.billing_period_start == period_start
        )
    )
    existing = existing_result.scalar_one_or_none()

    if existing:
        if existing.status == InvoiceStatus.draft:
            # Delete old draft line items and invoice to regenerate fresh
            await db.execute(
                select(InvoiceLineItem).where(InvoiceLineItem.invoice_id == existing.id)
            )
            line_items_result = await db.execute(
                select(InvoiceLineItem).where(InvoiceLineItem.invoice_id == existing.id)
            )
            for item in line_items_result.scalars().all():
                await db.delete(item)
            await db.delete(existing)
            await db.commit()
        else:
            raise HTTPException(status_code=400, detail="Invoice already finalized for this period")

    # Fetch all plan periods that touched this calendar month
    plans_result = await db.execute(
        select(TenantPlan, BillingPlan)
        .join(BillingPlan, TenantPlan.plan_id == BillingPlan.id)
        .where(
            TenantPlan.tenant_id == current_tenant.id,
            TenantPlan.started_at < now,
            or_(
                TenantPlan.ended_at == None,
                TenantPlan.ended_at >= period_start
            )
        )
        .order_by(TenantPlan.started_at)
    )
    plan_periods = plans_result.all()

    if not plan_periods:
        raise HTTPException(status_code=404, detail="No plan found for this billing period")

    # Days in this calendar month
    next_month = (now.replace(day=1) + timedelta(days=32)).replace(day=1)
    days_in_month = (next_month - period_start).days

    total_amount = 0.0
    total_units = 0
    line_items = []

    for tenant_plan, billing_plan in plan_periods:
        chunk_start = max(tenant_plan.started_at, period_start)
        chunk_end = min(tenant_plan.ended_at, now) if tenant_plan.ended_at else now

        usage_result = await db.execute(
            select(func.coalesce(func.sum(UsageLog.units_used), 0)).where(
                UsageLog.tenant_id == current_tenant.id,
                UsageLog.created_at >= chunk_start,
                UsageLog.created_at <= chunk_end
            )
        )
        chunk_units = int(usage_result.scalar())
        total_units += chunk_units

        chunk_days = max((chunk_end - chunk_start).days, 1)
        prorated_base = round(billing_plan.base_price * (chunk_days / days_in_month), 2)
        extra_units = max(0, chunk_units - billing_plan.monthly_limit)
        overage_amount = round(extra_units * billing_plan.price_per_unit, 2)
        chunk_total = round(prorated_base + overage_amount, 2)
        total_amount += chunk_total

        line_items.append({
            "billing_plan": billing_plan,
            "chunk_start": chunk_start,
            "chunk_end": chunk_end,
            "chunk_days": chunk_days,
            "chunk_units": chunk_units,
            "prorated_base": prorated_base,
            "extra_units": extra_units,
            "overage_amount": overage_amount,
            "chunk_total": chunk_total
        })

    # Create as draft
    invoice = Invoice(
        tenant_id=current_tenant.id,
        plan_id=plan_periods[-1][1].id,
        total_units=total_units,
        amount_due=round(total_amount, 2),
        status=InvoiceStatus.draft,
        billing_period_start=period_start,
        billing_period_end=now
    )
    db.add(invoice)
    await db.flush()

    for item in line_items:
        line_item = InvoiceLineItem(
            invoice_id=invoice.id,
            plan_name=item["billing_plan"].name,
            period_start=item["chunk_start"],
            period_end=item["chunk_end"],
            days=item["chunk_days"],
            units_used=item["chunk_units"],
            base_amount=item["prorated_base"],
            overage_units=item["extra_units"],
            overage_amount=item["overage_amount"],
            total_amount=item["chunk_total"]
        )
        db.add(line_item)

    await db.commit()
    await db.refresh(invoice)

    line_items_result = await db.execute(
        select(InvoiceLineItem).where(InvoiceLineItem.invoice_id == invoice.id)
    )
    invoice.line_items = line_items_result.scalars().all()
    return invoice


@router.post("/invoices/{invoice_id}/finalize", response_model=InvoiceResponse)
async def finalize_invoice(
    invoice_id: str,
    db: AsyncSession = Depends(get_db),
    current_tenant: Tenant = Depends(get_current_tenant)
):
    result = await db.execute(
        select(Invoice).where(
            Invoice.id == invoice_id,
            Invoice.tenant_id == current_tenant.id
        )
    )
    invoice = result.scalar_one_or_none()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    if invoice.status != InvoiceStatus.draft:
        raise HTTPException(status_code=400, detail="Only draft invoices can be finalized")

    invoice.status = InvoiceStatus.pending
    await db.commit()
    await db.refresh(invoice)

    line_items_result = await db.execute(
        select(InvoiceLineItem).where(InvoiceLineItem.invoice_id == invoice.id)
    )
    invoice.line_items = line_items_result.scalars().all()
    return invoice


@router.get("/invoices", response_model=List[InvoiceResponse])
async def list_invoices(
    db: AsyncSession = Depends(get_db),
    current_tenant: Tenant = Depends(get_current_tenant)
):
    invoices_result = await db.execute(
        select(Invoice)
        .where(Invoice.tenant_id == current_tenant.id)
        .order_by(Invoice.created_at.desc())
    )
    invoices = invoices_result.scalars().all()

    # Attach line items to each invoice
    for invoice in invoices:
        line_items_result = await db.execute(
            select(InvoiceLineItem).where(InvoiceLineItem.invoice_id == invoice.id)
        )
        invoice.line_items = line_items_result.scalars().all()

    return invoices