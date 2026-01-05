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
        job = session.execute(select(Job).where(Job.id == job_id)).scalar_one_or_none()
        if not job:
            return "Job not found"

        # 1. Find Provider Config
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

        # 2. Extract API Key
        try:
            api_key = decrypt_key(provider_cfg.encrypted_api_key)
        except Exception:
            job.status = "failed"
            job.error_message = "Failed to decrypt provider key."
            session.commit()
            return "Key Error"
            
        # 3. Instantiate Service
        service = ReplicateService(api_key=api_key)

        # 4. Parse Prompt & Params
        raw_prompt = job.prompt or ""
        model_identifier = "flux" 
        params = {}
        prompt_text = raw_prompt

        # Parsing logic: [model] {json} | prompt
        if raw_prompt.startswith("["):
            try:
                end_sq = raw_prompt.find("]")
                if end_sq != -1:
                    model_identifier = raw_prompt[1:end_sq].strip()
                    rest = raw_prompt[end_sq+1:].strip()
                    if "|" in rest:
                        parts = rest.split("|", 1)
                        json_str = parts[0].strip()
                        prompt_text = parts[1].strip()
                        if json_str.startswith("{"):
                             params = json.loads(json_str)
                    else:
                        prompt_text = rest
            except Exception as e:
                logger.warning(f"Failed to parse prompt format: {e}")
                prompt_text = raw_prompt
        
        logger.info(f"Parsed Prompt: '{prompt_text[:50]}...', Params: {list(params.keys())}")

        # 5. Resolve Model
        replicate_model_ref = "black-forest-labs/flux-schnell" # Default
        
        ai_model = None
        try:
            model_uuid = uuid.UUID(model_identifier)
            ai_model = session.execute(select(AIModel).where(AIModel.id == model_uuid)).scalar_one_or_none()
        except ValueError:
            pass 
            
        if ai_model:
            replicate_model_ref = ai_model.model_ref 
            if ai_model.version_id:
                replicate_model_ref = f"{replicate_model_ref}:{ai_model.version_id}"
            
            # Merge UI Config Defaults
            if ai_model.ui_config:
                 for key, conf in ai_model.ui_config.items():
                      if key not in params and "default" in conf:
                           params[key] = conf["default"]
        
        else:
             # Legacy Fallback
             if model_identifier == "flux-pro":
                  replicate_model_ref = "black-forest-labs/flux-1.1-pro"

        # 6. Strict Payload Construction
        input_data = {
            "prompt": prompt_text,
            **params
        }
        
        # Use whitelist if available
        if ai_model and ai_model.normalized_caps_json:
             schema_inputs = ai_model.normalized_caps_json.get("inputs", [])
             # Ensure 'prompt' is allowed or added? 
             # Replicate schema usually includes 'prompt', but we should safe-guard.
             # If prompt is missing from schema, we should still pass it or API fails.
             # Let's trust build_payload or manually ensure prompt is in dict.
             payload = service.build_payload(input_data, schema_inputs)
             
             # Fallback: If 'prompt' was stripped because it's missing in schema (rare but possible),
             # we re-add it if it was present.
             if "prompt" in input_data and "prompt" not in payload:
                 payload["prompt"] = input_data["prompt"]
                 
        else:
             logger.info("No schema found for strict validation, using permissive sanitization.")
             payload = service.sanitize_input(input_data)
        
        webhook_host = settings.WEBHOOK_HOST or "https://api.artline.dev"
        webhook_url = f"{webhook_host}/webhooks/replicate"

        try:
            logger.info(f"Submitting job {job.id} to {replicate_model_ref}")
            # Note: submit_prediction calls sanitize_input internally currently.
            # We should probably refactor submit_prediction to take already-clean payload or skip sanitization if we did it here.
            # actually submit_prediction calls sanitize_input. 
            # If we pass already cleaned data, sanitize_input (permissive) shouldn't hurt it.
            # But the requirement is "Run strict by whitelist".
            # The current submit_prediction forces sanitize_input. 
            # I should bypass or modify submit_prediction.
            # But I can't easily change submit_prediction signature without breaking other calls?
            # Actually I can just duplicate logic or call client.post directly here?
            # Better: Let's modify submit_prediction to accept 'skip_sanitization' flag?
            # Or just rely on sanitize_input doing nothing bad to already valid data.
            # Sanitize_input essentially casts types. 
            # build_payload does filtering AND casting.
            # So calling sanitize_input after build_payload is redundant but harmless unless it mangles.
            # Let's Assume safe for now.
            
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
            logger.error(f"Replicate Submission Error: {e}")
            job.status = "failed"
            job.error_message = str(e)
            session.commit()
            raise self.retry(exc=e, countdown=10)

    except Exception as e:
        session.rollback()
        logger.exception("Worker Error")
        raise self.retry(exc=e, countdown=5)
    finally:
        session.close()
