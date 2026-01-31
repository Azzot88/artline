import logging
import json
from app.tasks.worker import celery_app
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.domain.jobs.models import Job
from app.models import User
from app.domain.billing.models import LedgerEntry
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
        # 1. Fetch Job
        job = session.execute(select(Job).where(Job.id == job_id)).scalar_one_or_none()
        if not job: 
            logger.error("Job NOT FOUND in DB!")
            return "Job not found"
        
        logger.info(f"Job found: {job.id}, Status: {job.status}")

        # 2. Initialize Router with Active Configs
        try:
             configs = session.execute(select(ProviderConfig).where(ProviderConfig.is_active == True)).scalars().all()
             from app.domain.providers.router import ProviderRouter
             router = ProviderRouter(list(configs))
        except Exception as e:
             logger.error(f"Failed to initialize ProviderRouter: {e}")
             return _fail_job(session, job, f"Provider Config Error: {e}")

        # 3. Parse User Input (Internal Format)
        model_identifier, raw_params, prompt_text = _parse_input_string(job.prompt or "")
        logger.info(f"Job {job.id}: Model={model_identifier}, PromptLen={len(prompt_text)}")

        # 4. Resolve Model & Provider
        ai_model = None
        provider_id = "replicate" # Default
        model_ref = "black-forest-labs/flux-schnell" # Default
        
        try:
            model_uuid = uuid.UUID(model_identifier)
            ai_model = session.execute(select(AIModel).where(AIModel.id == model_uuid)).scalar_one_or_none()
        except ValueError:
            pass
            
        if ai_model:
            provider_id = ai_model.provider
            model_ref = ai_model.model_ref
            if ai_model.version_id:
                 model_ref += f":{ai_model.version_id}"
            
            # Merge Defaults
            if ai_model.ui_config:
                 for k, conf in ai_model.ui_config.items():
                      if k not in raw_params and "default" in conf:
                           raw_params[k] = conf["default"]
        elif model_identifier == "flux-pro":
             model_ref = "black-forest-labs/flux-1.1-pro"

        # 5. Get Service
        try:
            service = router.get_service(provider_id)
        except Exception as e:
            logger.error(f"Provider not available: {e}")
            return _fail_job(session, job, f"Provider Error: {e}")

        # 6. Normalize Payload
        from app.domain.catalog.service import CatalogService
        catalog = CatalogService()
        
        allowed_inputs = []
        if ai_model:
             spec = catalog.resolve_ui_spec(ai_model)
             for p in spec.parameters:
                 allowed_inputs.append({
                     "name": p.id,
                     "type": p.type,
                     "options": [o.value for o in p.options] if p.options else None,
                     "min": p.min,
                     "max": p.max,
                     "default": p.default
                 })
                 
        raw_params["prompt"] = prompt_text
        
        schema = {"inputs": allowed_inputs} if allowed_inputs else {"inputs": [{"name": "prompt", "type": "string"}]}
        payload = service.normalize_payload(raw_params, schema)
        
        if not payload: payload = raw_params # Fallback

        # 7. Execute
        webhook_host = settings.WEBHOOK_HOST or 'https://api.artline.dev'
        if not webhook_host.startswith("https://") and "api.artline.dev" not in webhook_host:
             webhook_url = None
        else:
             webhook_url = f"{webhook_host}/webhooks/{provider_id}"
        
        try:
            logger.info(f"Submitting to {provider_id} Ref: {model_ref}")
            provider_job_id = service.submit_prediction(
                model_ref=model_ref,
                input_data=payload,
                webhook_url=webhook_url
            )
            logger.info(f"Submitted successfully. Provider ID: {provider_job_id}")
            
            job.status = "running"
            job.provider_job_id = provider_job_id
            job.provider = provider_id
            session.commit()
            return f"Submitted: {provider_job_id}"
            
        except Exception as e:
            logger.error(f"Submission Exception: {e}")
            
            current_retries = self.request.retries or 0
            max_retries = self.max_retries or 3
            
            if current_retries >= max_retries:
                return _fail_job(session, job, str(e))
            else:
                logger.warning(f"Retrying... ({current_retries + 1})")
            
            raise self.retry(exc=e, countdown=10)

    except Exception as e:
        logger.exception(f"Worker Crash for job {job_id}")
        session.rollback()
        # Retry or Fail logic...
        # For brevity, implementing fail:
        _fail_job(session, job, f"Worker Crash: {str(e)}")
        raise self.retry(exc=e, countdown=10)
    finally:
        session.close()

def _fail_job(session, job, error_msg):
    logger.error(f"Failing job {job.id}: {error_msg}")
    try:
        job.status = "failed"
        job.error_message = error_msg
        
        if job.user_id and job.cost_credits > 0:
            refund = LedgerEntry(
                user_id=job.user_id,
                amount=job.cost_credits,
                reason=f"Refund for failed job {job.id}",
                related_job_id=job.id,
                currency="credits"
            )
            session.add(refund)
        session.commit()
    except Exception as e:
        logger.error(f"Failed to fail job safely: {e}")
    return "Job Failed"

def _parse_input_string(raw_text: str):
    model_identifier = "flux"
    params = {}
    prompt_text = raw_text
    
    if not raw_text: return model_identifier, params, prompt_text
        
    if raw_text.startswith("["):
        try:
            end_sq = raw_text.find("]")
            if end_sq != -1:
                model_identifier = raw_text[1:end_sq].strip()
                rest = raw_text[end_sq+1:].strip()
                if "|" in rest:
                    parts = rest.split("|", 1)
                    json_str = parts[0].strip()
                    prompt_text = parts[1].strip()
                    if json_str.startswith("{"):
                            try: params = json.loads(json_str)
                            except: pass
                else:
                    prompt_text = rest
        except: pass
    return model_identifier, params, prompt_text
