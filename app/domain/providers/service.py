import re
import datetime
from abc import ABC, abstractmethod
from typing import Dict, Any, List
from cryptography.fernet import Fernet
from app.core.config import settings

# Enums
PROVIDER_OPENAI = "openai"
PROVIDER_STABILITY = "stability"
PROVIDER_RUNWAY = "runway"
PROVIDER_LUMA = "luma"
PROVIDER_REPLICATE = "replicate"

PROVIDERS_LIST = [
    {"id": PROVIDER_OPENAI, "label": "OpenAI (Images/Video)"},
    {"id": PROVIDER_STABILITY, "label": "Stability AI (Images)"},
    {"id": PROVIDER_RUNWAY, "label": "Runway (Video)"},
    {"id": PROVIDER_LUMA, "label": "Luma Dream Machine (Images/Video)"},
    {"id": PROVIDER_REPLICATE, "label": "Replicate (Models: Images/Video)"},
]

# --- Encryption ---
# Use a derived key from SECRET_KEY for simplicity in MVP, or a dedicated key.
# For MVP, we will generate a valid Fernet key from the SECRET_KEY padding.
# In prod, this should be a stable env var.
def _get_fernet() -> Fernet:
    # Fernet key must be 32 url-safe base64-encoded bytes. 
    # This is a hack for MVP to reuse SECRET_KEY. 
    # Real App: settings.ENCRYPTION_KEY
    import base64
    import hashlib
    key = hashlib.sha256(settings.SECRET_KEY.encode()).digest()
    key_b64 = base64.urlsafe_b64encode(key)
    return Fernet(key_b64)

def encrypt_key(plain_key: str) -> str:
    f = _get_fernet()
    return f.encrypt(plain_key.encode()).decode()

def decrypt_key(encrypted_key: str) -> str:
    f = _get_fernet()
    return f.decrypt(encrypted_key.encode()).decode()

def mask_key(plain_key: str) -> str:
    if len(plain_key) <= 4:
        return "****"
    return "****" + plain_key[-4:]

# --- Adapters ---

class TestResult:
    def __init__(self, ok: bool, message: str = "", details: Dict = None):
        self.ok = ok
        self.message = message
        self.details = details or {}

class BaseProviderAdapter(ABC):
    @abstractmethod
    def validate_format(self, api_key: str) -> bool:
        pass

    @abstractmethod
    async def test_connection(self, api_key: str) -> TestResult:
        pass

class OpenAIAdapter(BaseProviderAdapter):
    def validate_format(self, api_key: str) -> bool:
        return bool(re.match(r"^sk-[A-Za-z0-9._-]{10,}$", api_key))

    async def test_connection(self, api_key: str) -> TestResult:
        # Mock test or real request logic
        import httpx
        if "demo" in api_key:
            return TestResult(False, "Demo key cannot be verified server-side")
        
        try:
            # Minimal viable test: List models
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    "https://api.openai.com/v1/models", 
                    headers={"Authorization": f"Bearer {api_key}"},
                    timeout=5.0
                )
                if resp.status_code == 200:
                    return TestResult(True, "Connection successful")
                return TestResult(False, f"API Error: {resp.status_code} - {resp.text}")
        except Exception as e:
            return TestResult(False, f"Connection failed: {str(e)}")

class StabilityAdapter(BaseProviderAdapter):
    def validate_format(self, api_key: str) -> bool:
        return bool(re.match(r"^sk-[A-Za-z0-9._-]{10,}$", api_key))
    
    async def test_connection(self, api_key: str) -> TestResult:
        import httpx
        if "demo" in api_key:
            return TestResult(False, "Demo key cannot be verified")
            
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    "https://api.stability.ai/v1/user/account", 
                    headers={"Authorization": f"Bearer {api_key}"},
                    timeout=5.0
                )
                if resp.status_code == 200:
                    return TestResult(True, "Connection successful")
                return TestResult(False, f"API Error: {resp.status_code}")
        except Exception as e:
            return TestResult(False, str(e))

class ReplicateAdapter(BaseProviderAdapter):
    def validate_format(self, api_key: str) -> bool:
        return bool(re.match(r"^r8_[A-Za-z0-9]{37}$", api_key))
    
    async def test_connection(self, api_key: str) -> TestResult:
        import httpx
        if "demo" in api_key:
            return TestResult(False, "Demo key cannot be verified")
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    "https://api.replicate.com/v1/account", 
                    headers={"Authorization": f"Token {api_key}"},
                    timeout=5.0
                )
                if resp.status_code == 200:
                    return TestResult(True, "Connection successful")
                return TestResult(False, f"API Error: {resp.status_code}")
        except Exception as e:
            return TestResult(False, str(e))

class GenericAdapter(BaseProviderAdapter):
    def validate_format(self, api_key: str) -> bool:
        # Generic: min 20 chars, no spaces
        if " " in api_key: return False
        return len(api_key) >= 20

    async def test_connection(self, api_key: str) -> TestResult:
        return TestResult(False, "Test not implemented for this provider")

# Factory
def get_adapter(provider_id: str) -> BaseProviderAdapter:
    if provider_id == PROVIDER_OPENAI:
        return OpenAIAdapter()
    if provider_id == PROVIDER_STABILITY:
        return StabilityAdapter()
    if provider_id == PROVIDER_REPLICATE:
        return ReplicateAdapter()
    # Runway and Luma don't have easy public "test" endpoints without cost or specific auth flows often
    # So using Generic for now or implementing specific mocks
    return GenericAdapter()

