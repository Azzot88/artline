
import asyncio
import os
import sys
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

# Add app to path
sys.path.append(os.getcwd())

from app.core.config import settings
from app.domain.providers.models import ProviderConfig
from app.domain.providers.service import decrypt_key
from app.domain.providers.adapters.replicate import submit_replicate_job, ReplicateError

async def diagnose():
    print("--- Replicate Diagnostic Tool ---")
    
    # 1. Check DB Connection
    try:
        engine = create_async_engine(settings.SQLALCHEMY_DATABASE_URI)
        async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
        print("[OK] Database connection configured")
    except Exception as e:
        print(f"[FAIL] Database config error: {e}")
        return

    async with async_session() as session:
        # 2. Fetch Config
        stmt = select(ProviderConfig).where(ProviderConfig.provider_id == 'replicate')
        result = await session.execute(stmt)
        config = result.scalar_one_or_none()
        
        if not config:
            print("[FAIL] No 'replicate' provider found in database.")
            return
            
        print(f"[OK] Found Replicate config (Active: {config.is_active})")
        
        if not config.encrypted_api_key:
            print("[FAIL] Encrypted API Key is empty.")
            return
            
        # 3. Decrypt Key
        try:
            api_key = decrypt_key(config.encrypted_api_key)
            masked = api_key[:4] + "*" * (len(api_key)-8) + api_key[-4:] if len(api_key) > 8 else "***"
            print(f"[OK] Decrypted API Key: {masked}")
        except Exception as e:
            print(f"[FAIL] Key Decryption failed: {e}")
            return
            
        # 4. Attempt API Call (Synchronous)
        print("--- Attempting Real API Call to Replicate ---")
        prompt = "diagnostic test run"
        input_data = {"prompt": prompt}
        
        # Use default flux model version from runner logic or hardcode valid one
        # "black-forest-labs/flux-schnell"
        model_name = "black-forest-labs/flux-schnell"
        
        try:
            # We use the submit function directly
            print(f"Sending request to model: {model_name}...")
            job_id = submit_replicate_job(
                input_data=input_data,
                api_key=api_key,
                model=model_name
                # webhook_url is None for this test, so we prefer 'wait' (sync) behavior if implemented in adapter
                # Adapter header: "Prefer": "wait" if not webhook_url
            )
            print(f"[SUCCESS] Replicate accepted job. ID: {job_id}")
            print("Check Replicate Dashboard now to confirm usage.")
            
        except ImportError as e:
             print(f"[FAIL] Import Error: {e}")
        except Exception as e:
             print(f"[FAIL] API Call Failed: {e}")
             if "401" in str(e):
                 print("Hint: Invalid API Token")
             elif "404" in str(e):
                 print("Hint: Model not found or no access")

if __name__ == "__main__":
    try:
        asyncio.run(diagnose())
    except KeyboardInterrupt:
        pass
