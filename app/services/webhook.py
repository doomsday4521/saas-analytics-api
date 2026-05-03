import httpx
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.webhook import Webhook

async def trigger_webhooks(db: AsyncSession, tenant_id: str, event_type: str, payload: dict):
    result = await db.execute(
        select(Webhook).where(
            Webhook.tenant_id == tenant_id,
            Webhook.event_type == event_type,
            Webhook.is_active == True
        )
    )
    webhooks = result.scalars().all()
    async def send(url: str):
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                await client.post(url, json=payload)
        except Exception:
            pass

    await asyncio.gather(*[send(w.url) for w in webhooks])