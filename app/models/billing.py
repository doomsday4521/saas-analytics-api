from app.database import Base

from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, func, Enum
import uuid
import enum

class PlanType(str,enum.Enum):
    free = "free"
    basic  = "basic"
    pro = "pro"

class InvoiceStatus(str, enum.Enum):
    draft = "draft"
    pending = "pending"
    paid = "paid"
    overdue = "overdue"


class BillingPlan(Base):
    __tablename__ = "billing_plans"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    plan_type = Column(Enum(PlanType), nullable=False)
    monthly_limit = Column(Integer, nullable=False)
    price_per_unit = Column(Float, nullable=False)
    base_price = Column(Float, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class TenantPlan(Base):
    __tablename__ = "tenant_plans"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=False)
    plan_id = Column(String, ForeignKey("billing_plans.id"), nullable=False)
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True)
    ended_at = Column(DateTime(timezone=True), nullable=True)


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=False)
    plan_id = Column(String, ForeignKey("billing_plans.id"), nullable=False)
    total_units = Column(Integer, nullable=False)
    amount_due = Column(Float, nullable=False)
    status = Column(Enum(InvoiceStatus), default=InvoiceStatus.pending)
    billing_period_start = Column(DateTime(timezone=True), nullable=False)
    billing_period_end = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    paid_at = Column(DateTime(timezone=True), nullable=True)


class InvoiceLineItem(Base):
    __tablename__ = "invoice_line_items"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    invoice_id = Column(String, ForeignKey("invoices.id"), nullable=False)
    plan_name = Column(String, nullable=False)
    period_start = Column(DateTime(timezone=True), nullable=False)
    period_end = Column(DateTime(timezone=True), nullable=False)
    days = Column(Integer, nullable=False)
    units_used = Column(Integer, nullable=False)
    base_amount = Column(Float, nullable=False)
    overage_units = Column(Integer, nullable=False, default=0)
    overage_amount = Column(Float, nullable=False, default=0.0)
    total_amount = Column(Float, nullable=False)