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
    session = SessionLocal()
    try:
        # 1. Fetch Job & Provider Config
        job = session.execute(select(Job).where(Job.id == job_id)).scalar_one_or_none()
        if not job: return "Job not found"

        provider_cfg = session.execute(
            select(ProviderConfig).where(ProviderConfig.provider_id == 'replicate', ProviderConfig.is_active == True)
        ).scalars().first()
        
        if not provider_cfg:
            job.status = "failed"
            job.error_message = "No active Replicate provider."
            session.commit()
            return "No Provider"

        try:
            api_key = decrypt_key(provider_cfg.encrypted_api_key)
        except Exception:
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

        # 4. Build Strict Payload
        raw_params["prompt"] = prompt_text
        allowed_inputs = []
        if ai_model and ai_model.normalized_caps_json:
             allowed_inputs = ai_model.normalized_caps_json.get("inputs", [])
             
        if allowed_inputs:
             payload = service.build_payload(raw_params, allowed_inputs)
             # Safety: Ensure prompt exists if allowed_inputs was somehow missing it or empty
             if "prompt" not in payload and "prompt" in raw_params:
                  payload["prompt"] = raw_params["prompt"] 
        else:
             logger.info("Using permissive sanitization (No schema)")
             payload = service.sanitize_input(raw_params)

        # 5. Execute
        webhook_url = f"{settings.WEBHOOK_HOST or 'http://54.234.247.24'}/webhooks/replicate"
        
        try:
            provider_job_id = service.submit_prediction(
                model_ref=replicate_model_ref,
                input_data=payload,
                webhook_url=webhook_url
            )
            
            job.status = "running"
            job.provider_job_id = provider_job_id
            job.provider = "replicate"
            session.commit()
            return f"Submitted: {provider_job_id}"
            
        except Exception as e:
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
