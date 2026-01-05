import logging
import json
from app.tasks.worker import celery_app
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.domain.jobs.models import Job
from app.models import User # Fix: Ensure User mapper is loaded for Job relationship
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
            
    # ... (Session setup) ...
        # 2. Extract Model & Params from Prompt
        raw_prompt = job.prompt
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
                    
                    # Check for params
                    if "|" in rest:
                        import json
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
        
        # 3. Resolve Model
        replicate_version = None 
        replicate_model_ref = "black-forest-labs/flux-schnell" # Default to confirmed working model
        
        # Check if UUID (Dynamic Model)
        from app.domain.providers.models import AIModel
        import uuid
        
        ai_model = None
        try:
            # Try parsing as UUID
            model_uuid = uuid.UUID(model_identifier)
            # Fetch from DB
            ai_model = session.execute(select(AIModel).where(AIModel.id == model_uuid)).scalar_one_or_none()
        except ValueError:
            pass # Not a UUID, use legacy map
            
        if ai_model:
            replicate_model_ref = ai_model.model_ref # "stability-ai/sdxl"
            replicate_version = ai_model.version_id
            
            # Merge defaults from ui_config if params missing?
            # User input params (from prompt) override defaults.
            # But params only contains what form sent.
            # We should probably merge: default < override
            if ai_model.ui_config:
                 for key, conf in ai_model.ui_config.items():
                      if key not in params and "default" in conf:
                           params[key] = conf["default"]
        
        else:
             # Legacy Logic fallback
             if model_identifier == "runway": 
                  pass # ... (keep simple fallback or map to known)
             elif model_identifier == "flux-pro":
                  replicate_model_ref = "black-forest-labs/flux-1.1-pro"

        # 4. Input Data Construction
        # Sanitize and cast params to correct types for Replicate API
        sanitized_params = params.copy()
        
        # integer fields
        for int_field in ["width", "height", "seed", "num_inference_steps", "num_frames", "num_outputs"]:
            if int_field in sanitized_params and sanitized_params[int_field] is not None:
                try:
                    sanitized_params[int_field] = int(sanitized_params[int_field])
                except (ValueError, TypeError):
                    pass # Leave as is if casting fails

        # float fields 
        for float_field in ["guidance_scale", "prompt_strength", "lora_scale"]:
            if float_field in sanitized_params and sanitized_params[float_field] is not None:
                try:
                    sanitized_params[float_field] = float(sanitized_params[float_field])
                except (ValueError, TypeError):
                    pass

        # array fields (sometimes single url passed as string)
        if "input_images" in sanitized_params:
             val = sanitized_params["input_images"]
             if isinstance(val, str):
                  if val.strip():
                       sanitized_params["input_images"] = [val.strip()]
                  else:
                       del sanitized_params["input_images"] # Remove empty string
             elif isinstance(val, list):
                  # Filter out empty strings
                  sanitized_params["input_images"] = [v for v in val if isinstance(v, str) and v.strip()]
                  if not sanitized_params["input_images"]:
                       del sanitized_params["input_images"]

        # resolution enum: ensure it's valid or remove it
        if "resolution" in sanitized_params:
             if sanitized_params["resolution"] not in ["match_input_image", "0.5 MP", "1 MP", "2 MP", "4 MP"]:
                  # If invalid (e.g. random string "1024"), maybe try to map or remove?
                  # For now, remove to let model default kick in if invalid
                  logger.warning(f"Removing invalid resolution param: {sanitized_params['resolution']}")
                  del sanitized_params["resolution"]

        input_data = {
            "prompt": prompt_text,
            **sanitized_params
        }
        
        logger.info(f"Submitting to Replicate: {json.dumps(input_data, default=str)}")
        
        # 5. Submit
        # Ensure WEBHOOK_HOST is configured, otherwise fallback to example (or raise error in strict mode)
        webhook_host = settings.WEBHOOK_HOST or "https://api.artline.dev"
        webhook_url = f"{webhook_host}/webhooks/replicate"

        try:
            # We pass model=replicate_model_ref which allows client.run(ref) behavior
            # If ref is None, it uses version
            provider_job_id = submit_replicate_job(
                input_data=input_data,
                api_key=api_key,
                webhook_url=webhook_url,
                version=replicate_version,
                model=replicate_model_ref
            )
            
            job.status = "running"
            job.provider_job_id = provider_job_id
            job.provider = "replicate"
            session.commit()
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
