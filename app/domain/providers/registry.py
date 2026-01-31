from typing import Dict, Type, Any, Optional

# Registry to hold provider service classes and their associated normalizers
_PROVIDER_REGISTRY: Dict[str, Dict[str, Any]] = {}

def register_provider(
    provider_id: str, 
    service_class: Type, 
    request_normalizer: Optional[Type] = None,
    response_normalizer: Optional[Type] = None
):
    """
    Register a provider implementation.
    """
    _PROVIDER_REGISTRY[provider_id] = {
        "service": service_class,
        "request_normalizer": request_normalizer,
        "response_normalizer": response_normalizer
    }

def get_provider_entry(provider_id: str) -> Optional[Dict[str, Any]]:
    return _PROVIDER_REGISTRY.get(provider_id)

def get_registered_providers():
    return list(_PROVIDER_REGISTRY.keys())
