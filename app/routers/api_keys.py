from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.api_key import APIKey
from app.models.tenant import Tenant
from app.schemas.api_key import APIKeyCreate, APIKeyResponse
from app.services.dependencies import get_current_tenant
from typing import List

router = APIRouter(prefix="/api-keys", tags=["API Keys"])

@router.post("", response_model=APIKeyResponse)
async def create_api_key(
    data: APIKeyCreate,
    db: AsyncSession = Depends(get_db),
    current_tenant: Tenant = Depends(get_current_tenant)
):
    api_key = APIKey(
        tenant_id=current_tenant.id,
        name=data.name
    )
    db.add(api_key)
    await db.commit()
    await db.refresh(api_key)
    return api_key

@router.get("", response_model=List[APIKeyResponse])
async def list_api_keys(
    db: AsyncSession = Depends(get_db),
    current_tenant: Tenant = Depends(get_current_tenant)
):
    result = await db.execute(
        select(APIKey).where(APIKey.tenant_id == current_tenant.id,APIKey.is_active == True)
        
    )
    return result.scalars().all()

@router.delete("/{key_id}")
async def revoke_api_key(
    key_id: str,
    db: AsyncSession = Depends(get_db),
    current_tenant: Tenant = Depends(get_current_tenant)
):
    result = await db.execute(
        select(APIKey).where(APIKey.id == key_id, APIKey.tenant_id == current_tenant.id)
    )
    api_key = result.scalar_one_or_none()
    if not api_key:
        raise HTTPException(status_code=404, detail="API key not found")
    
    api_key.is_active = False
    await db.commit()
    return {"message": "API key revoked successfully"}