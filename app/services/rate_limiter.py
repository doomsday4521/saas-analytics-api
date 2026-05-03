import redis.asyncio as redis
import os
from dotenv import load_dotenv
from datetime import timedelta, datetime, timezone

load_dotenv()

REDIS_URL = os.getenv("REDIS_URL", "redis://127.0.0.1:6379")
redis_client = redis.from_url(
    REDIS_URL,
    decode_responses=True,
    socket_timeout=2,
    socket_connect_timeout=2
)

def get_current_month() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m")

def seconds_until_next_month() -> int:
    now = datetime.now(timezone.utc)
    next_month = (now.replace(day=1) + timedelta(days=32)).replace(day=1)
    return int((next_month - now).total_seconds())

async def check_rate_limit(tenant_id: str, monthly_limit: int) -> dict:
    key = f"usage:{tenant_id}:{get_current_month()}"
    
    try:
        new_count = await redis_client.incr(key)
        
        if new_count == 1:
            await redis_client.expire(key, seconds_until_next_month())
        
        return {
            "current": new_count,
            "limit": monthly_limit,
            "in_overage": new_count > monthly_limit
        }
    
    except Exception:
        return {"current": 0, "limit": monthly_limit, "in_overage": False}