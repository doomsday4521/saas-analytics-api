import requests
import random
import time
from datetime import datetime, timedelta

API_KEY = "B-yURQE8rUIw06mLvHpMvHOlbcGFyV5qKnl9Nvo-OUM"
BASE_URL = "http://localhost:8000"

customers = [
    "acme_corp", "techstart_io", "buildfast_hq", 
    "devtools_inc", "saasly_app", "rocket_labs",
    "nexus_systems", "alpha_ventures"
]
endpoints = [
    "/api/products", "/api/orders", "/api/users", 
    "/api/payments", "/api/inventory", "/api/analytics",
    "/api/reports", "/api/webhooks", "/api/auth"
]
methods = ["GET", "GET", "GET", "POST", "POST", "PUT", "DELETE"]
status_codes = [200, 200, 200, 200, 201, 201, 200, 404, 500, 200, 200, 422]

headers = {"X-API-Key": API_KEY}

print("Seeding usage data — 200 requests across 8 customers...\n")

success = 0
failed = 0

for i in range(200):
    # Vary response times — some fast, some slow, some very slow
    response_time = random.choice([
        random.randint(20, 100),   # fast
        random.randint(100, 400),  # normal
        random.randint(400, 1200), # slow
    ])

    payload = {
        "customer_id": random.choice(customers),
        "endpoint": random.choice(endpoints),
        "method": random.choice(methods),
        "response_time_ms": response_time,
        "status_code": random.choice(status_codes),
        "units_used": random.randint(1, 5)
    }

    res = requests.post(f"{BASE_URL}/usage/log", json=payload, headers=headers)
    if res.status_code == 200:
        success += 1
        print(f"[{i+1}/200] ✓ {payload['customer_id']} → {payload['method']} {payload['endpoint']} {payload['status_code']} ({response_time}ms)")
    else:
        failed += 1
        print(f"[{i+1}/200] ✗ Failed: {res.status_code} {res.text}")

    time.sleep(0.05)

print(f"\n✓ Done — {success} successful, {failed} failed")
print("Go refresh your dashboard and regenerate the invoice.")