import asyncio
from app.core.db import AsyncSessionLocal
from app.domain.providers.models import ProviderConfig
from sqlalchemy import select
from app.core.config import settings
from cryptography.fernet import Fernet
import base64

# Helper to decrypt (same as update_provider)
def decrypt_key(enc_key: str) -> str:
    if not enc_key: return None
    f = Fernet(settings.SECRET_KEY.encode())
    return f.decrypt(enc_key.encode()).decode()

async def check_provider():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(ProviderConfig).where(ProviderConfig.provider_id == "replicate"))
        config = res.scalar_one_or_none()
        
        if not config:
            print("❌ No Replicate provider configured in DB 'provider_configs' table.")
        else:
            print(f"✅ Replicate provider found.")
            print(f"   Is Active: {config.is_active}")
            
            try:
                decrypted = decrypt_key(config.encrypted_api_key)
                masked = decrypted[:4] + "..." + decrypted[-4:] if decrypted else "None"
                print(f"   Decrypted Key: {masked}")
            except Exception as e:
                print(f"   ❌ Failed to decrypt key: {e}")

if __name__ == "__main__":
    asyncio.run(check_provider())
