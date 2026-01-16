import logging
import json
from app.tasks.worker import celery_app
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.domain.jobs.models import Job
from app.models import User
from app.domain.providers.models import ProviderConfig, AIModel
from app.domain.providers.replicate_service import ReplicateService
from app.domain.providers.service import decrypt_key
import uuid

logger = logging.getLogger(__name__)

sync_engine = create_engine(settings.SQLALCHEMY_DATABASE_URI_SYNC)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=sync_engine)

@celery_app.task(bind=True, max_retries=3)
def process_job(self, job_id: str):
    print(f"DEBUG: Starting process_job for {job_id}")
    session = SessionLocal()
    try:
        # 1. Fetch Job & Provider Config
        job = session.execute(select(Job).where(Job.id == job_id)).scalar_one_or_none()
        if not job: 
            print("DEBUG: Job NOT FOUND in DB!")
            return "Job not found"
        print(f"DEBUG: Job found: {job.id}, Status: {job.status}")

        provider_cfg = session.execute(
            select(ProviderConfig).where(ProviderConfig.provider_id == 'replicate', ProviderConfig.is_active == True)
        ).scalars().first()
        
        if not provider_cfg:
            print("DEBUG: No Active Replicate Provider Config found!")
            job.status = "failed"
            job.error_message = "No active Replicate provider."
            session.commit()
            return "No Provider"

        try:
            api_key = decrypt_key(provider_cfg.encrypted_api_key)
            print("DEBUG: API Key decrypted successfully")
        except Exception as e:
            print(f"DEBUG: Key Decryption Error: {e}")
            job.status = "failed"
            job.error_message = "Key decryption failed."
            session.commit()
            return "Key Error"
            
        service = ReplicateService(api_key=api_key)

        # ... (skip middle parts) ...

        # 5. Execute
        webhook_host = settings.WEBHOOK_HOST or 'https://api.artline.dev'
        # ...
        
        try:
            print(f"DEBUG: Submitting prediction to Ref: {replicate_model_ref}")
            provider_job_id = service.submit_prediction(
                model_ref=replicate_model_ref,
                input_data=payload,
                webhook_url=webhook_url
            )
            print(f"DEBUG: Submitted successfully. Provider ID: {provider_job_id}")
            
            job.status = "running"
            job.provider_job_id = provider_job_id
            job.provider = "replicate"
            session.commit()
            print("DEBUG: Job status updated to running and committed.")
            return f"Submitted: {provider_job_id}"
            
        except Exception as e:
            print(f"DEBUG: Submission Exception: {e}")
            logger.error(f"Submission Error: {e}")
            job.status = "failed"
            job.error_message = str(e)
            session.commit()
            raise self.retry(exc=e, countdown=10)

    except Exception as e:
        session.rollback()
        logger.exception("Worker Crash")
        raise self.retry(exc=e, countdown=5)
    finally:
        session.close()
