from app.database import Base
from sqlalchemy import Column, String, Boolean, DateTime, func,ForeignKey
import uuid

class Webhook(Base):
    __tablename__ = "webhooks"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=False)
    url = Column(String, nullable=False)
    event_type = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())