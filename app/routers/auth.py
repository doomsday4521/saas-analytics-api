from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.tenant import Tenant, RefreshToken
from app.schemas.tenant import TenantRegister, TenantLogin, TenantResponse, Token, RefreshRequest
from app.services.auth import hash_password, verify_password, create_access_token, create_refresh_token
from datetime import datetime
from datetime import timezone

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=TenantResponse)
async def register(data: TenantRegister, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Tenant).where(Tenant.email == data.email))
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    tenant = Tenant(
        name=data.name,
        email=data.email,
        hashed_password=hash_password(data.password)
    )
    db.add(tenant)
    await db.commit()
    await db.refresh(tenant)
    return tenant

@router.post("/login", response_model=Token)
async def login(data: TenantLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Tenant).where(Tenant.email == data.email))
    tenant = result.scalar_one_or_none()
    if not tenant or not verify_password(data.password, tenant.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    existing_tokens_result = await db.execute(
        select(RefreshToken).where(
            RefreshToken.tenant_id == tenant.id,
            RefreshToken.is_revoked == False
        )
    )
    existing_tokens = existing_tokens_result.scalars().all()
    for token in existing_tokens:
        token.is_revoked = True
    await db.commit()

    access_token = create_access_token({"sub": tenant.id, "email": tenant.email})
    refresh_token_str, expires_at = create_refresh_token()

    refresh_token = RefreshToken(
        tenant_id=tenant.id,
        token=refresh_token_str,
        expires_at=expires_at
    )
    db.add(refresh_token)
    await db.commit()

    return {"access_token": access_token, "refresh_token": refresh_token_str, "token_type": "bearer"}

@router.post("/refresh", response_model=Token)
async def refresh(data: RefreshRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(RefreshToken).where(
            RefreshToken.token == data.refresh_token,
            RefreshToken.is_revoked == False
        )
    )
    refresh_token = result.scalar_one_or_none()
    
    
    if not refresh_token or refresh_token.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
    
    refresh_token.is_revoked = True
    await db.commit()
    
    access_token = create_access_token({"sub": refresh_token.tenant_id})
    new_refresh_token_str, expires_at = create_refresh_token()
    
    new_refresh_token = RefreshToken(
        tenant_id=refresh_token.tenant_id,
        token=new_refresh_token_str,
        expires_at=expires_at
    )
    db.add(new_refresh_token)
    await db.commit()
    
    return {"access_token": access_token, "refresh_token": new_refresh_token_str, "token_type": "bearer"}

@router.post("/logout")
async def logout(data: RefreshRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(RefreshToken).where(RefreshToken.token == data.refresh_token)
    )
    refresh_token = result.scalar_one_or_none()
    
    if refresh_token:
        refresh_token.is_revoked = True
        await db.commit()
    
    return {"message": "Logged out successfully"}