from app.database import Base
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, func, Float
import uuid

class UsageLog(Base):
    __tablename__ = "usage_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=False)
    api_key_id = Column(String, ForeignKey("api_keys.id"), nullable=False)
    customer_id = Column(String, nullable=False)
    endpoint = Column(String, nullable=False)
    method = Column(String, nullable=False)
    response_time_ms = Column(Float, nullable=False)
    status_code = Column(Integer, nullable=False)
    units_used = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())