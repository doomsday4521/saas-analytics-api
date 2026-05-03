from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class UsageLogCreate(BaseModel):
    customer_id: str
    endpoint: str
    method: str
    response_time_ms: float
    status_code: int
    units_used: int = 1

class UsageLogResponse(BaseModel):
    id: str
    tenant_id: str
    customer_id: str
    endpoint: str
    method: str
    response_time_ms: float
    status_code: int
    units_used: int
    created_at: datetime

    class Config:
        from_attributes = True

class UsageSummary(BaseModel):
    customer_id: str
    total_calls: int
    total_units: int
    avg_response_time: float
    error_rate: float