import logging
import json
from app.tasks.worker import celery_app
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.domain.jobs.models import Job
from app.domain.providers.models import ProviderConfig
from app.domain.providers.adapters.replicate import submit_replicate_job, ReplicateError
# Assume ai_providers exists as it is imported in admin_providers.py
from app.domain.providers.service import decrypt_key

logger = logging.getLogger(__name__)

sync_engine = create_engine(settings.SQLALCHEMY_DATABASE_URI_SYNC)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=sync_engine)

# MVP Model Mapping
MODELS = {
    "image": "bf25d41f77d346618e11e037136f33d74914c62e5421a12e2f60228747f4d546", # Flux Schnell
    "video": "3f0457e4619daac51203dedb952c1103d8d21c327575399554483ae59441113b", # SVD
}

@celery_app.task(bind=True, max_retries=3)
def process_job(self, job_id: str):
    session = SessionLocal()
    try:
        job = session.execute(select(Job).where(Job.id == job_id)).scalar_one_or_none()
        if not job:
            return "Job not found"

        # 1. Find Provider Config (Replicate)
        # For MVP, we select the first 'replicate' provider that is active
        # In future, we could select based on 'job.provider' if we stored it
        provider_q = session.execute(
            select(ProviderConfig)
            .where(ProviderConfig.provider_id == 'replicate')
            .where(ProviderConfig.is_active == True)
        )
        provider_cfg = provider_q.scalars().first()
        
        if not provider_cfg:
            job.status = "failed"
            job.error_message = "No active Replicate provider configured."
            session.commit()
            return "No Provider"

        # 2. Prepare Payload
        try:
            api_key = decrypt_key(provider_cfg.encrypted_api_key)
        except Exception:
            job.status = "failed"
            job.error_message = "Failed to decrypt provider key."
            session.commit()
            return "Key Error"
            
        model_name = "default"
        prompt_text = job.prompt
        
        # Extract model from prompt hack "[model] prompt"
        if prompt_text.startswith("[") and "]" in prompt_text:
            parts = prompt_text.split("]", 1)
            model_name = parts[0][1:].strip()
            prompt_text = parts[1].strip()

        # Decide Version vs Model Name
        version_hash = None
        replicate_model_name = None
        
        if model_name == "flux-pro":
             # Use Model Endpoint
             replicate_model_name = "black-forest-labs/flux-1.1-pro"
             # Flux 1.1 Pro often requires output_format params or strictly typed inputs
             input_data = {
                 "prompt": prompt_text,
                 "prompt_upsampling": True # As per user request snippet
             }
        elif job.kind == "video":
             # SVD
             version_hash = "3f0457e4619daac51203dedb952c1103d8d21c327575399554483ae59441113b"
             input_data = {
                 "prompt": prompt_text, 
                 # SVD usually needs image. If text provided, we really should use AnimateDiff
                 # But sticking to SVD hash for now as defined previously. 
                 # Actually SVD is img2video. AnimateDiff is text2video.
                 # Let's switch to AnimateDiff hash for better UX on "text prompt".
                 # "beecf59c..."
             }
             version_hash = "beecf59c4aee8d81bf04f0381033dfa10dc16e845b4ae00d281e2fa377e48a9f"
        else:
             # Default Image (Flux Schnell)
             version_hash = "bf25d41f77d346618e11e037136f33d74914c62e5421a12e2f60228747f4d546"
             input_data = {
                "prompt": prompt_text,
                "go_fast": True
             }
        
        # 3. Submit
        try:
            # Note: submit_replicate_job signature updated to (input_data, api_key, webhook_url, version, model)
            provider_job_id = submit_replicate_job(
                input_data=input_data,
                api_key=api_key,
                webhook_url=webhook_url,
                version=version_hash,
                model=replicate_model_name
            )
            
            job.status = "running"
            job.provider_job_id = provider_job_id
            job.provider = "replicate"
            session.commit()
            
            logger.info(f"Submitted job {job.id} to Replicate: {provider_job_id}")
            return f"Submitted: {provider_job_id}"
            
        except ReplicateError as e:
            logger.error(f"Replicate Submission Error: {e}")
            job.status = "failed"
            job.error_message = str(e)
            # Todo: Refund Logic here too? Or relies on user 'Retry'? 
            # Ideally refund immediately if submission failed.
            # But process_job is sync. Refund needs async DB session usually if reusing logic.
            # For MVP, we mark failed. Admin can refund or we add sync refund logic later.
            session.commit()
            raise self.retry(exc=e, countdown=10)

    except Exception as e:
        session.rollback()
        logger.exception("Worker Error")
        # In a real app we'd mark job failed after max retries
        raise self.retry(exc=e, countdown=5)
    finally:
        session.close()
