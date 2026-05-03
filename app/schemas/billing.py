from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.billing import PlanType, InvoiceStatus

class BillingPlanCreate(BaseModel):
    name: str
    plan_type: PlanType
    monthly_limit: int
    price_per_unit: float
    base_price: float

class BillingPlanResponse(BaseModel):
    id: str
    name: str
    plan_type: PlanType
    monthly_limit: int
    price_per_unit: float
    base_price: float
    is_active: bool

    class Config:
        from_attributes = True

class TenantPlanResponse(BaseModel):
    id: str
    tenant_id: str
    plan_id: str
    started_at: datetime
    is_active: bool

    class Config:
        from_attributes = True

class InvoiceLineItemResponse(BaseModel):
    id: str
    invoice_id: str
    plan_name: str
    period_start: datetime
    period_end: datetime
    days: int
    units_used: int
    base_amount: float
    overage_units: int
    overage_amount: float
    total_amount: float

    class Config:
        from_attributes = True

class InvoiceResponse(BaseModel):
    id: str
    tenant_id: str
    plan_id: str
    total_units: int
    amount_due: float
    status: InvoiceStatus
    billing_period_start: datetime
    billing_period_end: datetime
    created_at: datetime
    paid_at: Optional[datetime] = None
    line_items: List[InvoiceLineItemResponse] = []

    class Config:
        from_attributes = True