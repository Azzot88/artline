import replicate
from app.domain.providers.models import ProviderConfig, AIModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import logging
from app.domain.providers.service import decrypt_key

class ReplicateService:
    def __init__(self, api_key: str):
        self.api_key = api_key
        # Initialize client with the specific token
        self.client = replicate.Client(api_token=api_key)

    async def fetch_model_schema(self, model_ref: str):
        """
        Fetches the latest version and schema for a given model (e.g. 'black-forest-labs/flux-schnell')
        Returns a dict with version_id and schema.
        """
        try:
            # model_ref expected as 'owner/name'
            # synchronous call, might want to run in executor if blocking event loop too much
            model = self.client.models.get(model_ref)
            latest_version = model.latest_version
            
            return {
                "version_id": latest_version.id,
                "schema": latest_version.openapi_schema
            }
        except Exception as e:
            logging.error(f"Error fetching Replicate model {model_ref}: {e}")
            raise e

    async def generate_preview(self, version_id: str, inputs: dict) -> str:
        """
        Runs a prediction and returns the output URL (first item).
        """
        try:
            # We use the raw client to run. 
            # Note: For production we normally use background tasks, but for Admin Preview simple blocking/wait is okay for MVP.
            # Or use async run.
            
            output = self.client.run(
                version_id, # format: "owner/name:version" or just version hash? run() takes "owner/name:version" usually
                input=inputs
            )
            
            # Replicate output is usually a list of strings (URLs) or FileObjects.
            # Since we're in admin preview, we can handle list or string.
            if isinstance(output, list) and len(output) > 0:
                result = output[0]
            else:
                result = str(output)
                
            # If it's a FileOutput object, we need to read/url? 
            # Replicate 1.0 breaking change says it returns FileOutput.
            # We should check if we can get URL from it or if we need to stream it.
            # Simplified: result usually has .url for public URLs if supported, or we assume string for now.
            if hasattr(result, "url"):
                return result.url
                
            return str(result)
            
        except Exception as e:
            logging.error(f"Error running preview: {e}")
            raise e

async def get_replicate_client(db: AsyncSession) -> ReplicateService:
    # Fetch API Key from ProviderConfig
    # Assuming 'replicate' is the provider ID
    # Use order_by desc + limit 1 to handle potential duplicates (get latest)
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
