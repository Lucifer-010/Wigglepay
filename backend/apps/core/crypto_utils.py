import hashlib
import hmac
import secrets
import time
from typing import Tuple

def generate_api_keys() -> Tuple[str, str]:
    """
    Generate public and secret API keys for merchants.
    Format:
      Public: pub_live_<32 hex chars>
      Secret: sec_live_<48 hex chars>
    """
    pub_suffix = secrets.token_hex(16)
    sec_suffix = secrets.token_hex(24)
    return f"pub_live_{pub_suffix}", f"sec_live_{sec_suffix}"

def sign_payload(payload_bytes: bytes, secret: str) -> str:
    """Generate HMAC-SHA256 signature for outbound webhooks."""
    return hmac.new(secret.encode('utf-8'), payload_bytes, hashlib.sha256).hexdigest()

def verify_signature(payload_bytes: bytes, secret: str, signature: str) -> bool:
    """Verify HMAC-SHA256 signature securely against timing attacks."""
    expected = sign_payload(payload_bytes, secret)
    return hmac.compare_digest(expected, signature)

