import httpx
import logging
from typing import Any, Dict, List, Optional, Union
import json

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
        
        Args:
            model_ref (str): "owner/name" e.g. "black-forest-labs/flux-schnell"
            
        Returns:
            dict: {
                "raw_response": dict, # The full JSON response from Replicate
                "normalized_caps": dict # properly structured UI capabilities
            }
        """
        # 1. Validation
        if "/" not in model_ref:
            raise ValueError(f"Invalid model_ref '{model_ref}'. Expected format 'owner/name'")
            
        owner, name = model_ref.split("/", 1)
        # Handle version if present? API uses models/{owner}/{name} usually.
        # If user passes owner/name:version, we strip version for the model info endpoint?
        # Actually, let's strictly use owner/name.
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
                
                # Extract Schema from latest version if available
                normalized = self._normalize_capabilities(data)
                
                return {
                    "raw_response": data,
                    "normalized_caps": normalized
                }
                
        except httpx.RequestError as e:
            logger.error(f"Network error fetching capabilities for {model_ref}: {e}")
            raise e

    def _normalize_capabilities(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Normalizes raw Replicate model data into a standard UI capability format.
        """
        caps = {
            "title": data.get("name", ""),
            "description": data.get("description", ""),
            "owner": data.get("owner", ""),
            "inputs": [],
            "defaults": {}
        }
        
        # Get Latest Version Schema
        latest_version = data.get("latest_version")
        if not latest_version:
            # Maybe it's a private model without public versions listing?
            # Or simplified structure. Return empty caps logic.
            return caps

        schema = latest_version.get("openapi_schema", {})
        
        # Flatten Input Props
        # Replicate Schema: components -> schemas -> Input -> properties
        input_schema = {}
        if "components" in schema and "schemas" in schema["components"]:
             input_schema = schema["components"]["schemas"].get("Input", {}).get("properties", {})
        elif "properties" in schema:
             # Direct properties (sometimes happens)
             input_schema = schema["properties"]
             
        # Normalize Fields
        normalized_inputs = []
        
        for key, prop in input_schema.items():
            field = {
                "name": key,
                "label": prop.get("title", key.replace("_", " ").title()),
                "type": self._map_type(prop),
                "required": False, # Todo: check 'required' list in schema root? 
                "default": prop.get("default"),
                "help": prop.get("description", ""),
                "hidden": False
            }
            
            # Constraints
            if "minimum" in prop: field["min"] = prop["minimum"]
            if "maximum" in prop: field["max"] = prop["maximum"]
            
            # Enum handling
            if "enum" in prop:
                field["type"] = "select"
                field["options"] = prop["enum"]
                
            # Special Handling for known keys
            if key == "aspect_ratio":
                field["type"] = "select"
                # If enum missing, provide defaults? 
                # Some models have aspect_ratio as string but no enum in schema (rare).
                # Usually they provide enum.
                
            if key == "image" or key == "input_image":
                field["type"] = "image"
                
            normalized_inputs.append(field)
            
            # Extract Defaults for quick access
            if "default" in prop:
                caps["defaults"][key] = prop["default"]

        caps["inputs"] = normalized_inputs
        return caps

    def _map_type(self, prop: Dict) -> str:
        t = prop.get("type", "string")
        fmt = prop.get("format", "")
        
        if t == "integer": return "integer"
        if t == "number": return "float"
        if t == "boolean": return "boolean"
        if t == "string":
            if fmt == "uri": return "file"
            return "string"
        if t == "array": return "list"
        return "string"

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.domain.providers.models import ProviderConfig
from app.domain.providers.service import decrypt_key

async def get_replicate_client(db: AsyncSession) -> ReplicateService:
    # Fetch API Key from ProviderConfig
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


