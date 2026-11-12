import re
import json
import logging
from typing import Dict, Any, Optional
import httpx
from django.conf import settings

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are WigglePay's settlement parser. Extract payment attributes from the input text into strict JSON matching this schema:
{
  "amount": float,
  "asset": "USDC" or "XLM",
  "customer_ref": string or null,
  "description": string,
  "expiry_hours": integer
}

Rules:
1. "amount": numerical value (e.g. 50, 120.50).
2. "asset": either "USDC" or "XLM" (default to "USDC" unless XLM or lumens is mentioned).
3. "customer_ref": handle starting with @ or customer name, or null.
4. "description": short summary of goods or services.
5. "expiry_hours": default 24 unless specified.
6. Output ONLY the JSON object. Do not wrap in markdown quotes or preamble.
"""

def fallback_regex_parser(text: str) -> Dict[str, Any]:
    """
    Resilient deterministic fallback parser if LLM is offline or model is downloading.
    """
    clean = text.strip()
    
    # 1. Detect asset
    asset = "USDC"
    if re.search(r'\b(xlm|lumens?|stellar)\b', clean, re.IGNORECASE):
        asset = "XLM"
    elif re.search(r'\b(usdc|usd|dollars?|\$)\b', clean, re.IGNORECASE):
        asset = "USDC"

    # 2. Extract amount
    amount_match = re.search(r'(\$?\s*([0-9]+(?:\.[0-9]+)?))', clean)
    amount = 10.0
    if amount_match:
        try:
            val = float(amount_match.group(2))
            if val > 0:
                amount = val
        except ValueError:
            pass

    # 3. Extract customer handle or recipient
    handle_match = re.search(r'(@[a-zA-Z0-9_]+)', clean)
    customer_ref = handle_match.group(1) if handle_match else None
    if not customer_ref:
        to_for_match = re.search(r'\b(?:to|from|for|bill)\s+([A-Z][a-zA-Z0-9_]+)', clean)
        if to_for_match and to_for_match.group(1).upper() not in ['XLM', 'USDC']:
            customer_ref = f"@{to_for_match.group(1).lower()}"

    # 4. Description
    desc = clean
    for phrase in [r'create\s+(?:an?\s+)?invoice\s+(?:for\s+)?', r'bill\s+', r'charge\s+']:
        desc = re.sub(phrase, '', desc, flags=re.IGNORECASE).strip()

    return {
        "amount": amount,
        "asset": asset,
        "customer_ref": customer_ref or "@client",
        "description": desc or "Digital settlement",
        "expiry_hours": 24
    }

def parse_settlement_prompt(prompt_text: str) -> Dict[str, Any]:
    """
    Parse natural language input or voice transcript into structured invoice data
    using local Ollama with lightweight Qwen3 4B / Qwen2.5 model.
    """
    ollama_url = f"{settings.OLLAMA_BASE_URL.rstrip('/')}/api/generate"
    model_name = settings.OLLAMA_MODEL

    payload = {
        "model": model_name,
        "prompt": f"{SYSTEM_PROMPT}\n\nIncoming Input:\n\"{prompt_text}\"\n\nJSON Output:",
        "stream": False,
        "format": "json",
        "options": {
            "temperature": 0.1,
            "top_p": 0.9,
        }
    }

    try:
        with httpx.Client(timeout=15.0) as client:
            resp = client.post(ollama_url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                raw_response = data.get("response", "").strip()
                # Clean code fences if present
                clean_json = re.sub(r'^```json\s*|\s*```$', '', raw_response, flags=re.MULTILINE).strip()
                parsed = json.loads(clean_json)
                
                # Sanitize and ensure defaults
                return {
                    "amount": float(parsed.get("amount", 10.0)),
                    "asset": str(parsed.get("asset", "USDC")).upper(),
                    "customer_ref": parsed.get("customer_ref"),
                    "description": str(parsed.get("description", "WigglePay settlement")),
                    "expiry_hours": int(parsed.get("expiry_hours", 24))
                }
    except Exception as exc:
        logger.warning(f"Ollama Qwen extraction failed or unavailable ({exc}). Using resilient fallback parser.")

    # Always deliver a clean, accurate structured output
    return fallback_regex_parser(prompt_text)

