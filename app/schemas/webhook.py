from pydantic import BaseModel
from datetime import datetime

class WebhookCreate(BaseModel):
    url: str
    event_type: str

class WebhookResponse(BaseModel):
    id: str
    tenant_id: str
    url: str
    event_type: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True