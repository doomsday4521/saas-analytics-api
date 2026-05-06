from groq import Groq
import os
import json
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

async def detect_anomalies(usage_data: list[dict]) -> dict:
    if not usage_data:
        return {"anomalies": [], "summary": "No usage data to analyze"}

    formatted = "\n".join([
        f"- customer: {d['customer_id']}, endpoint: {d['endpoint']}, "
        f"response_time: {d['response_time_ms']}ms, status: {d['status_code']}, "
        f"units: {d['units_used']}, time: {d['created_at']}"
        for d in usage_data
    ])

    prompt = f"""
You are an API usage anomaly detector. Analyze the following usage logs and identify any anomalies.

Look for:
- Sudden spikes in usage from a single customer
- Unusually high error rates
- Abnormally slow response times
- Suspicious patterns like repeated failed requests

Usage logs:
{formatted}

Respond ONLY in this exact JSON format, no extra text:
{{
    "anomalies": [
        {{
            "customer_id": "...",
            "type": "spike|error_rate|slow_response|suspicious",
            "description": "...",
            "severity": "low|medium|high"
        }}
    ],
    "summary": "brief overall summary"
}}
"""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        return {"anomalies": [], "summary": f"Detection failed: {str(e)}"}