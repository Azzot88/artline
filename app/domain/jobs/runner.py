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
    logger = logging.getLogger("runner")
    logger.info(f"Starting process_job for {job_id}")
    session = SessionLocal()
    try:
        # 1. Fetch Job & Provider Config
        job = session.execute(select(Job).where(Job.id == job_id)).scalar_one_or_none()
        if not job: 
            logger.error("Job NOT FOUND in DB!")
            # Debug: Dump all jobs to see what IS there
            all_jobs = session.execute(select(Job.id, Job.status, Job.prompt)).all()
            logger.debug(f"Dump of Jobs in DB ({len(all_jobs)} found)")
            return "Job not found"
        
        logger.info(f"Job found: {job.id}, Status: {job.status}")

        provider_cfg = session.execute(
            select(ProviderConfig).where(ProviderConfig.provider_id == 'replicate', ProviderConfig.is_active == True)
        ).scalars().first()
        
        if not provider_cfg:
            logger.error("No Active Replicate Provider Config found!")
            job.status = "failed"
            job.error_message = "No active Replicate provider."
            session.commit()
            return "No Provider"

        try:
            api_key = decrypt_key(provider_cfg.encrypted_api_key)
        except Exception as e:
            logger.error(f"Key Decryption Error: {e}")
            job.status = "failed"
            job.error_message = "Key decryption failed."
            session.commit()
            return "Key Error"
            
        service = ReplicateService(api_key=api_key)

        # 2. Parse User Input (Coordinator delegates to Service)
        model_identifier, raw_params, prompt_text = service.parse_input_string(job.prompt or "")
        logger.info(f"Job {job.id}: Model={model_identifier}, PromptLen={len(prompt_text)}")

        # 3. Resolve Model (DB Logic)
        ai_model = None
        replicate_model_ref = "black-forest-labs/flux-schnell" # Default
        
        try:
            model_uuid = uuid.UUID(model_identifier)
            ai_model = session.execute(select(AIModel).where(AIModel.id == model_uuid)).scalar_one_or_none()
        except ValueError:
            pass # Use default or legacy logic
            
        if ai_model:
            replicate_model_ref = ai_model.model_ref 
            if ai_model.version_id:
                 replicate_model_ref += f":{ai_model.version_id}"
            
            # Merge Defaults from AIModel Config
            if ai_model.ui_config:
                 for k, conf in ai_model.ui_config.items():
                      if k not in raw_params and "default" in conf:
                           raw_params[k] = conf["default"]
        
        elif model_identifier == "flux-pro":
             replicate_model_ref = "black-forest-labs/flux-1.1-pro"

        # 4. Build Strict Payload (Using CatalogService for Truth)
        from app.domain.catalog.service import CatalogService
        catalog = CatalogService()
        
        allowed_inputs = []
        if ai_model:
             # Resolve authoritative spec
             spec = catalog.resolve_ui_spec(ai_model)
             # Map UIParameters to allowed_input dicts
             for p in spec.parameters:
                 allowed_inputs.append({
                     "name": p.id,
                     "type": p.type,
                     # Extract raw values for enum check
                     "options": [o.value for o in p.options] if p.options else None
                 })
                 
        raw_params["prompt"] = prompt_text
              
        if allowed_inputs:
             payload = service.build_payload(raw_params, allowed_inputs)
             # Safety: Ensure prompt exists if allowed_inputs was somehow missing it or empty
             if "prompt" not in payload and "prompt" in raw_params:
                  payload["prompt"] = raw_params["prompt"] 
        else:
             logger.info("Using permissive sanitization (No schema)")
             payload = service.sanitize_input(raw_params)

        # 5. Execute
        webhook_host = settings.WEBHOOK_HOST or 'https://api.artline.dev'
        if not webhook_host.startswith("https://") and not "api.artline.dev" in webhook_host:
             # If using raw IP (http), Replicate will reject (422).
             # We disable webhook in this case and rely on polling/manual sync.
             webhook_url = None
        else:
             webhook_url = f"{webhook_host}/webhooks/replicate"
        
        try:
            logger.info(f"Submitting prediction to Ref: {replicate_model_ref}")
            provider_job_id = service.submit_prediction(
                model_ref=replicate_model_ref,
                input_data=payload,
                webhook_url=webhook_url
            )
            logger.info(f"Submitted successfully. Provider ID: {provider_job_id}")
            
            job.status = "running"
            job.provider_job_id = provider_job_id
            job.provider = "replicate"
            session.commit()
            return f"Submitted: {provider_job_id}"
            
        except Exception as e:
            logger.error(f"Submission Exception: {e}")
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
