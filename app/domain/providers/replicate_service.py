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
        Normalizes raw Replicate model data.
        """
        caps = {
            "title": data.get("name", ""),
            "description": data.get("description", ""),
            "owner": data.get("owner", ""),
            "inputs": [],
            "defaults": {}
        }
        
        latest_version = data.get("latest_version")
        if not latest_version:
            return caps

        schema = latest_version.get("openapi_schema", {})
        input_schema = {}
        if "components" in schema and "schemas" in schema["components"]:
             input_schema = schema["components"]["schemas"].get("Input", {}).get("properties", {})
        elif "properties" in schema:
             input_schema = schema["properties"]
             
        normalized_inputs = []
        
        for key, prop in input_schema.items():
            field = {
                "name": key,
                "label": prop.get("title", key.replace("_", " ").title()),
                "type": self._map_type(prop),
                "required": False, 
                "default": prop.get("default"),
                "help": prop.get("description", ""),
                "hidden": False
            }
            
            if "minimum" in prop: field["min"] = prop["minimum"]
            if "maximum" in prop: field["max"] = prop["maximum"]
            if "enum" in prop:
                field["type"] = "select"
                field["options"] = prop["enum"]
                
            if key == "aspect_ratio": field["type"] = "select"
            if key == "image" or key == "input_image": field["type"] = "image"
                
            normalized_inputs.append(field)
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

    def submit_prediction(self, model_ref: str, input_data: Dict[str, Any], webhook_url: Optional[str] = None) -> str:
        """
        Submits a prediction job to Replicate.
        """
        sanitized_input = self.sanitize_input(input_data)
        
        payload = {"input": sanitized_input}
        if webhook_url:
            payload["webhook"] = webhook_url
            payload["webhook_events_filter"] = ["completed"]

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
                resp = client.post(url, json=payload, headers=self.headers)
                
                if resp.status_code not in [200, 201]:
                    # Log error body for debug
                    logger.error(f"Replicate API Error: {resp.text}")
                    raise IOError(f"Replicate API returned {resp.status_code}: {resp.text}")
                    
                return resp.json()["id"]
                
        except httpx.RequestError as e:
            logger.error(f"Replicate Submission Failed: {e}")
            raise e

    def sanitize_input(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Cleans and casts input parameters.
        """
        clean = input_data.copy()
        
        # 1. Parse JSON Strings
        for k, v in list(clean.items()):
            if isinstance(v, str) and v.strip().startswith("[") and v.strip().endswith("]"):
                try: clean[k] = json.loads(v)
                except: pass
                    
        # 2. Aspect Ratio Mapping
        if "aspect_ratio" in clean:
            val = str(clean["aspect_ratio"])
            if "x" in val and val.replace("x","").isdigit():
                 try:
                     w,h = map(int, val.split("x"))
                     r = w/h
                     if abs(r - 1) < 0.1: clean["aspect_ratio"] = "1:1"
                     elif abs(r - 16/9) < 0.1: clean["aspect_ratio"] = "16:9"
                     elif abs(r - 9/16) < 0.1: clean["aspect_ratio"] = "9:16"
                     elif abs(r - 4/3) < 0.1: clean["aspect_ratio"] = "4:3"
                     elif abs(r - 3/4) < 0.1: clean["aspect_ratio"] = "3:4"
                 except: pass

        # 3. Type Casting
        INT_KEYS = {"width", "height", "seed", "num_inference_steps", "num_frames"}
        FLOAT_KEYS = {"guidance_scale", "prompt_strength", "lora_scale"}
        
        for k, v in list(clean.items()):
            if v == "" or v is None:
                del clean[k]
                continue
            if k in INT_KEYS:
                try: clean[k] = int(v)
                except: del clean[k]
            elif k in FLOAT_KEYS:
                try: clean[k] = float(v)
                except: del clean[k]
                
        # 4. Filter Empty Lists
        for k, v in list(clean.items()):
            if isinstance(v, list) and not v:
                del clean[k]
                
        return clean

    async def generate_preview(self, model_ref: str, input_data: Dict[str, Any]) -> str:
        """
        Runs a prediction and returns the output URL (simple sync wrapper or async wait).
        For admin preview, we want the result URL.
        """
        # Note: This method was expected by admin_models.py but missing.
        # It needs to wait for completion.
        
        provider_id = self.submit_prediction(model_ref, input_data)
        
        # Poll for result (Simple polling for MVP)
        import asyncio
        for _ in range(60): # 60 seconds timeout
            await asyncio.sleep(1)
            status, output = self.check_prediction(provider_id)
            if status == "succeeded":
                # Output might be list or string
                if isinstance(output, list) and output: return output[0]
                return str(output)
            if status == "failed":
                raise IOError("Prediction failed during preview.")
                
        raise TimeoutError("Preview timed out")

    def check_prediction(self, prediction_id: str):
        url = f"{self.BASE_URL}/predictions/{prediction_id}"
        with httpx.Client(timeout=10.0) as client:
            resp = client.get(url, headers=self.headers)
            if resp.status_code != 200: return "unknown", None
            data = resp.json()
            return data["status"], data.get("output")

    def build_payload(self, input_data: Dict[str, Any], allowed_inputs: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Constructs a strict payload based on allowed inputs whitelist.
        :param input_data: Raw user input dictionary
        :param allowed_inputs: List of input definitions (from normalized_caps['inputs'])
        :return: Cleaned dictionary ready for API
        """
        payload = {}
        allowed_keys = {item['name']: item for item in allowed_inputs}
        dropped_keys = []
        
        # 0. Always Allow Prompt? Usually yes, but let's check schema.
        # Actually schema usually has 'prompt'.
        
        # Pre-process: sanitize basic types first (casts) using existing logic, 
        # but then filter strictly.
        sanitized = self.sanitize_input(input_data)
        
        for key, value in sanitized.items():
            if key in allowed_keys:
                field_def = allowed_keys[key]
                expected_type = field_def.get('type')
                
                # Validation Logic
                if expected_type == 'integer':
                    if not isinstance(value, int):
                         logger.warning(f"Validation Warn: {key} expected int, got {type(value)}")
                         # Sanitize already tried to cast, so if it failed or is float, maybe drop?
                         # sanitize_input returns int for int-like strings.
                         # check simple type match
                         if isinstance(value, float): value = int(value)
                         elif not isinstance(value, int): 
                             dropped_keys.append(f"{key}(type)")
                             continue
                             
                elif expected_type == 'float' or expected_type == 'number':
                     if not isinstance(value, (float, int)):
                         dropped_keys.append(f"{key}(type)")
                         continue
                         
                elif expected_type == 'boolean':
                     if not isinstance(value, bool):
                          # map strings "true"/"false" if sanitize didn't?
                          if str(value).lower() == 'true': value = True
                          elif str(value).lower() == 'false': value = False
                          else:
                              dropped_keys.append(f"{key}(type)")
                              continue

                elif expected_type == 'select':
                     options = field_def.get('options', [])
                     if options and value not in options:
                          logger.warning(f"Validation Warn: {key} value '{value}' not in options {options}")
                          dropped_keys.append(f"{key}(enum)")
                          continue
                          
                payload[key] = value
            else:
                dropped_keys.append(key)
                
        if dropped_keys:
            logger.info(f"Dropped params for strict payload: {dropped_keys}")
            
        return payload

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
