from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.webhook import Webhook
from app.models.tenant import Tenant
from app.schemas.webhook import WebhookCreate, WebhookResponse
from app.services.dependencies import get_current_tenant
from typing import List

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])

@router.post("", response_model=WebhookResponse)
async def register_webhook(
    data: WebhookCreate,
    db: AsyncSession = Depends(get_db),
    current_tenant: Tenant = Depends(get_current_tenant)
):
    webhook = Webhook(
        tenant_id=current_tenant.id,
        url=data.url,
        event_type=data.event_type
    )
    db.add(webhook)
    await db.commit()
    await db.refresh(webhook)
    return webhook

@router.get("", response_model=List[WebhookResponse])
async def list_webhooks(
    db: AsyncSession = Depends(get_db),
    current_tenant: Tenant = Depends(get_current_tenant)
):
    result = await db.execute(
        select(Webhook).where(
            Webhook.tenant_id == current_tenant.id,
            Webhook.is_active == True
        )
    )
    return result.scalars().all()

@router.delete("/{webhook_id}")
async def delete_webhook(
    webhook_id: str,
    db: AsyncSession = Depends(get_db),
    current_tenant: Tenant = Depends(get_current_tenant)
):
    result = await db.execute(
        select(Webhook).where(
            Webhook.id == webhook_id,
            Webhook.tenant_id == current_tenant.id
        )
    )
    webhook = result.scalar_one_or_none()
    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook not found")
    
    webhook.is_active = False
    await db.commit()
    return {"message": "Webhook deleted successfully"}