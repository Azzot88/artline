import logging
from typing import Any, Optional
from app.domain.providers.registry import get_provider_entry
from app.domain.providers.models import ProviderConfig, AIModel

logger = logging.getLogger(__name__)

class ProviderFactory:
    """
    Creates instances of Provider Services with correct configuration and injected normalizers.
    """
    
    @staticmethod
    def create_service(provider_id: str, api_key: str):
        entry = get_provider_entry(provider_id)
        if not entry:
            raise ValueError(f"Provider '{provider_id}' is not registered.")
            
        ServiceClass = entry["service"]
        RequestNormClass = entry.get("request_normalizer")
        ResponseNormClass = entry.get("response_normalizer")
        
        # Instantiate Normalizers if class types provided
        req_norm = RequestNormClass() if RequestNormClass else None
        res_norm = ResponseNormClass() if ResponseNormClass else None
        
        # Instantiate Service injecting normalizers if supported
        # We assume the service constructor accepts (api_key, request_normalizer, response_normalizer)
        # or just api_key for legacy support. 
        # Ideally, we standardize the __init__.
        
        # For now, let's assume we update services to accept them optionally
        try:
            return ServiceClass(
                api_key=api_key, 
                request_normalizer=req_norm, 
                response_normalizer=res_norm
            )
        except TypeError:
            # Fallback for services that don't accept normalizers yet (Legacy)
            return ServiceClass(api_key=api_key)

class ProviderRouter:
    """
    Routes requests to the appropriate provider service.
    """
    
    def __init__(self, provider_configs: list[ProviderConfig]):
        self.configs = {cfg.provider_id: cfg for cfg in provider_configs if cfg.is_active}
        
    def get_service(self, provider_id: str) -> Any:
        cfg = self.configs.get(provider_id)
        if not cfg:
            raise ValueError(f"No active configuration for provider '{provider_id}'")
            
        # Decrypt key (assuming helper is available or passed in context)
        # Here we might need the decrypt function. 
        # Typically the Router might be initialized with ready-to-use services or factories.
        # But to keep it simple, we'll import decrypt here or assume caller handled it?
        # Better: Router takes the factory and config and returns service on demand.
        
        from app.domain.providers.service import decrypt_key
        api_key = decrypt_key(cfg.encrypted_api_key)
        
        return ProviderFactory.create_service(provider_id, api_key)
        
    def route_model(self, model: AIModel) -> Any:
        return self.get_service(model.provider)
