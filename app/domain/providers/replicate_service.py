import httpx
import logging
from typing import Any, Dict, List, Optional, Union
import json
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.domain.providers.models import ProviderConfig
from app.domain.providers.service import decrypt_key

# Setup logging
logger = logging.getLogger(__name__)

class ReplicateService:
    """
    Service to interact with Replicate API.
    Agnostic of specific frameworks (FastAPI/Celery) - pure Python logic.
    """
    BASE_URL = "https://api.replicate.com/v1"

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "User-Agent": "ArtLine/1.0"
        }

    def fetch_model_capabilities(self, model_ref: str) -> Dict[str, Any]:
        """
        Fetches full model details from Replicate and normalizes them.
        """
        # 1. Validation
        if "/" not in model_ref:
            raise ValueError(f"Invalid model_ref '{model_ref}'. Expected format 'owner/name'")
            
        owner, name = model_ref.split("/", 1)
        if ":" in name:
            name = name.split(":")[0]

        url = f"{self.BASE_URL}/models/{owner}/{name}"
        
        try:
            with httpx.Client(timeout=10.0) as client:
                response = client.get(url, headers=self.headers)
                
                if response.status_code == 404:
                    raise ValueError(f"Model {model_ref} not found on Replicate.")
                if response.status_code != 200:
                    raise IOError(f"Replicate API error: {response.status_code} {response.text}")
                    
                data = response.json()
                from app.domain.providers.replicate_capabilities import ReplicateCapabilitiesService
                caps_service = ReplicateCapabilitiesService()
                normalized = caps_service.generate_strict_schema(data)
                
                return {
                    "raw_response": data,
                    "normalized_caps": normalized
                }
                
        except httpx.RequestError as e:
            logger.error(f"Network error fetching capabilities for {model_ref}: {e}")
            raise e

    async def analyze_model_schema(self, model_ref: str, version_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Fetch 2.0: Deep analysis of model schema using Replicate's version endpoint.
        """
        if "/" not in model_ref:
             raise ValueError(f"Invalid model_ref '{model_ref}'. Expected 'owner/name'")
        
        owner, name = model_ref.split("/", 1)
        if ":" in name: # Handle owner/name:version if passed in ref
            name, ver = name.split(":", 1)
            if not version_id: version_id = ver
            
        base_url = self.BASE_URL
        headers = self.headers
        
        async with httpx.AsyncClient(timeout=20.0) as client:
            # Step 1: Get Model Info (if no version provided)
            target_version = version_id
            if not target_version:
                model_url = f"{base_url}/models/{owner}/{name}"
                resp = await client.get(model_url, headers=headers)
                if resp.status_code != 200:
                    raise IOError(f"Failed to fetch model info: {resp.status_code} {resp.text}")
                model_data = resp.json()
                target_version = model_data.get("latest_version", {}).get("id")
                
            if not target_version:
                 raise ValueError("Could not determine version ID from model info.")

            # Step 2: Get Version Details (Schema)
            # Optimization: If we already have the schema from Step 1 (latest_version), use it.
            schema = None
            if not version_id: # Only if we auto-resolved latest
                 latest_obj = model_data.get("latest_version", {})
                 if latest_obj.get("id") == target_version and "openapi_schema" in latest_obj:
                     schema = latest_obj["openapi_schema"]

            if not schema:
                version_url = f"{base_url}/models/{owner}/{name}/versions/{target_version}"
                resp = await client.get(version_url, headers=headers)
                if resp.status_code != 200:
                     # Fallback: If version lookup fails but we had a version ID, maybe try to be lenient?
                     # For now, raise but maybe log warning
                     raise IOError(f"Failed to fetch version info: {resp.status_code} {resp.text}")
                
                version_data = resp.json()
                schema = version_data.get("openapi_schema", {})
            
            # Extract Components
            components = schema.get("components", {}).get("schemas", {})
            input_schema = components.get("Input", {}).get("properties", {})
            output_schema = components.get("Output", {})
            
            # Helper to extract formats
            all_formats = []
            if output_schema.get("properties", {}).get("format", {}).get("enum"):
                 all_formats = output_schema["properties"]["format"]["enum"]

            return {
                "version_id": target_version,
                "inputs": input_schema,
                "outputs": output_schema,
                "allFormats": all_formats,
                "full_schema": schema # Include full schema just in case
            }

    def submit_prediction(self, model_ref: str, input_data: Dict[str, Any], webhook_url: Optional[str] = None) -> str:
        """
        Submits a prediction job to Replicate.
        """
        input_data_payload = {"input": input_data}
        if webhook_url:
            input_data_payload["webhook"] = webhook_url
            input_data_payload["webhook_events_filter"] = ["completed"]

        if ":" in model_ref:
             owner_name, version = model_ref.split(":", 1)
             owner, name = owner_name.split("/", 1)
             url = f"{self.BASE_URL}/models/{owner}/{name}/versions/{version}/predictions"
        else:
             if "/" not in model_ref: raise ValueError(f"Invalid model_ref {model_ref}")
             owner, name = model_ref.split("/", 1)
             url = f"{self.BASE_URL}/models/{owner}/{name}/predictions"

        try:
            with httpx.Client(timeout=30.0) as client:
                resp = client.post(url, json=input_data_payload, headers=self.headers)
                
                if resp.status_code not in [200, 201]:
                    # Log error body for debug
                    logger.error(f"Replicate API Error: {resp.text}")
                    raise IOError(f"Replicate API returned {resp.status_code}: {resp.text}")
                    
                return resp.json()["id"]
                
        except httpx.RequestError as e:
            logger.error(f"Replicate Submission Failed: {e}")
            raise e

    def normalize_payload(self, input_data: Dict[str, Any], schema: Dict[str, Any]) -> Dict[str, Any]:
        """
        Uses the separate Normalizer engine to enforce strict schema compliance.
        """
        from app.domain.providers.replicate.normalization import ReplicateNormalizer
        normalizer = ReplicateNormalizer()
        logging.info(f"Normalizing input with schema keys: {list(schema.keys())}")
        return normalizer.normalize(input_data, schema)

    async def get_prediction(self, provider_job_id: str):
        """Fetch status of a prediction."""
        url = f"{self.BASE_URL}/predictions/{provider_job_id}"
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url, headers=self.headers)
            if resp.status_code != 200:
                logger.error(f"Failed to get prediction {provider_job_id}: {resp.status_code}")
                return None
                
            data = resp.json()
            return {
                "id": data.get("id"),
                "status": data.get("status"),
                "output": data.get("output"),
                "error": data.get("error"),
                "logs": data.get("logs"),
                "metrics": data.get("metrics", {})
            }

    def parse_input_string(self, raw_text: str) -> tuple[str, Dict[str, Any], str]:
        """
        Parses internal app format: [model_id] {json_params} | prompt_text
        Returns: (model_identifier, params, prompt)
        """
        model_identifier = "flux" # Default
        params = {}
        prompt_text = raw_text
        
        if not raw_text:
            return model_identifier, params, prompt_text
            
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
            except Exception:
                pass # parsing failed, fallback to defaults
                
        return model_identifier, params, prompt_text

async def get_replicate_client(db: AsyncSession) -> ReplicateService:
    q = await db.execute(
        select(ProviderConfig)
        .where(ProviderConfig.provider_id == 'replicate')
        .order_by(ProviderConfig.created_at.desc())
        .limit(1)
    )
    config = q.scalar_one_or_none()
    
    if not config or not config.encrypted_api_key:
        raise ValueError("Replicate provider not configured")
        
    plain_key = decrypt_key(config.encrypted_api_key)
    return ReplicateService(api_key=plain_key)
