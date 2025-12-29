import httpx
import logging

logger = logging.getLogger(__name__)

REPLICATE_API_URL = "https://api.replicate.com/v1/predictions"

class ReplicateError(Exception):
    pass

def submit_replicate_job(input_data: dict, api_key: str, webhook_url: str | None = None, version: str | None = None, model: str | None = None) -> str:
    """
    Submits a prediction job to Replicate via HTTP API.
    Returns the prediction ID (provider_job_id).
    
    :param input_data: Dict containing 'prompt', etc.
    :param api_key: Replicate API token
    :param webhook_url: URL to receive status updates
    :param version: The model version hash (for v1/predictions)
    :param model: The model name 'owner/name' (for v1/models/.../predictions)
    """
    headers = {
        "Authorization": f"Bearer {api_key}", # Switched to Bearer as per Flux Pro docs
        "Content-Type": "application/json",
        "Prefer": "wait" if not webhook_url else "respond-async" # Use async if webhook
    }
    
    payload = {
        "input": input_data,
    }
    
    if webhook_url:
        payload["webhook"] = webhook_url
        payload["webhook_events_filter"] = ["completed"]

    target_url = REPLICATE_API_URL
    if model:
        # Use Model Endpoint
        # API: https://api.replicate.com/v1/models/{model_owner}/{model_name}/predictions
        target_url = f"https://api.replicate.com/v1/models/{model}/predictions"
        # Version is NOT needed in payload for Model endpoint usually, it uses latest
    elif version:
        # Use Version Endpoint
        payload["version"] = version
    else:
        raise ReplicateError("Either 'version' or 'model' must be specified")

    try:
        with httpx.Client(timeout=30.0) as client:
            response = client.post(target_url, json=payload, headers=headers)
            
            if response.status_code not in [200, 201]:
                logger.error(f"Replicate Error: {response.text}")
                raise ReplicateError(f"Replicate API returned {response.status_code}: {response.text}")
            
            data = response.json()
            return data["id"]
            
    except httpx.RequestError as e:
        logger.error(f"Replicate Request Failed: {e}")
        raise ReplicateError(f"Connection to Replicate failed: {e}")

def cancel_replicate_job(prediction_id: str, api_key: str):
    headers = {"Authorization": f"Token {api_key}"}
    url = f"{REPLICATE_API_URL}/{prediction_id}/cancel"
    
    with httpx.Client(timeout=10.0) as client:
        client.post(url, headers=headers)

def fetch_model_schema(model_ref: str, api_key: str) -> dict:
    """
    Fetches the input schema for a Replicate model and converts it to our UI format.
    model_ref: "owner/name" or "owner/name:version"
    """
    headers = {"Authorization": f"Bearer {api_key}"}
    
    # 1. Resolve Version
    owner, name = model_ref.split("/", 1) if "/" in model_ref else ("stability-ai", "sdxl") 
    version_id = None
    if ":" in name:
        name, version_id = name.split(":", 1)
        
    client = httpx.Client(timeout=15.0)
    try:
        schema_src = {}
        
        if version_id:
            # Fetch specific version
            url = f"https://api.replicate.com/v1/models/{owner}/{name}/versions/{version_id}"
            resp = client.get(url, headers=headers)
            if resp.status_code == 200:
                schema_src = resp.json().get("openapi_schema", {})
        else:
            # Fetch latest
            url = f"https://api.replicate.com/v1/models/{owner}/{name}"
            resp = client.get(url, headers=headers)
            if resp.status_code == 200:
                latest = resp.json().get("latest_version")
                if latest:
                    schema_src = latest.get("openapi_schema", {})

        if not schema_src:
             # Fallback or Error
             raise ReplicateError("Could not fetch model schema or no latest version found.")

        # 2. Convert to UI Schema
        # Replicate schema is OpenAPI-like: {"components": {"schemas": {"Input": {"properties": {...}}}}}
        # Or sometimes directly in root depending on version api. 
        # Usually it is components -> schemas -> Input.
        
        input_props = {}
        if "components" in schema_src and "schemas" in schema_src["components"]:
             input_props = schema_src["components"]["schemas"].get("Input", {}).get("properties", {})
        elif "properties" in schema_src: # Sometimes logic varies?
             input_props = schema_src["properties"]
             
        fields = []
        for key, prop in input_props.items():
            field = {
                "name": key,
                "label": prop.get("title", key.replace("_", " ").title()),
                "default": prop.get("default"),
                "help": prop.get("description"),
            }
            
            # Type Mapping
            t = prop.get("type", "string")
            if "enum" in prop:
                field["type"] = "select"
                field["choices"] = [{"label": str(v), "value": v} for v in prop["enum"]]
            elif t == "integer":
                field["type"] = "integer"
                field["min"] = prop.get("minimum")
                field["max"] = prop.get("maximum")
            elif t == "number":
                field["type"] = "number"
                field["min"] = prop.get("minimum")
                field["max"] = prop.get("maximum")
            elif t == "boolean":
                field["type"] = "boolean"
            elif t == "string":
                field["type"] = "text" # default
                # Detect format
                if prop.get("format") == "uri":
                    field["type"] = "file" # or image/video upload
            
            # Order / Grouping (Optional, simple for now)
            fields.append(field)
            
        return {
            "title": f"{owner}/{name}",
            "fields": fields,
            "raw_source": "replicate"
        }

    except Exception as e:
        logger.error(f"Schema Fetch Error: {e}")
        raise ReplicateError(f"Failed to fetch schema: {e}")
    finally:
        client.close()
