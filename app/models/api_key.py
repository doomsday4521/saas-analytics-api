from app.database import Base
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, func
import uuid
import secrets

class APIKey(Base):
    __tablename__ = "api_keys"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=False)
    key = Column(String, unique=True, nullable=False, default=lambda: secrets.token_urlsafe(32))
    name = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_used_at = Column(DateTime(timezone=True), nullable=True)