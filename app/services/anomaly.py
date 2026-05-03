from google import genai
import os
import asyncio
import json
import re
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

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

Respond in this exact JSON format:
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
        response = await asyncio.get_event_loop().run_in_executor(
            None,
            lambda: client.models.generate_content(
                model="gemini-2.0-flash",
                contents=prompt
            )
        )
        text = response.text.strip()
        match = re.search(r'\{.*\}', text, re.DOTALL)
        return json.loads(match.group()) if match else {"anomalies": [], "summary": "No response"}
    except Exception as e:
        return {"anomalies": [], "summary": f"Detection failed: {str(e)}"}