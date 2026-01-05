import pytest
from unittest.mock import MagicMock, patch
from app.domain.providers.replicate_service import ReplicateService
import httpx

# Mock Response Data
MOCK_SCHEMA = {
    "openapi_schema": {
        "components": {
            "schemas": {
                "Input": {
                    "properties": {
                        "prompt": {
                            "type": "string",
                            "title": "Prompt",
                            "default": "A puppy",
                            "description": "Input prompt"
                        },
                        "aspect_ratio": {
                            "type": "string",
                            "enum": ["1:1", "16:9", "4:3"],
                            "default": "1:1"
                        },
                        "width": {
                            "type": "integer",
                            "minimum": 256,
                            "maximum": 1024
                        }
                    }
                }
            }
        }
    }
}

MOCK_RESPONSE = {
    "url": "https://api.replicate.com/v1/models/owner/name",
    "name": "name",
    "description": "A cool model",
    "owner": "owner",
    "latest_version": MOCK_SCHEMA
}

@pytest.fixture
def service():
    return ReplicateService(api_key="test_key")

def test_fetch_capabilities_success(service):
    with patch("httpx.Client.get") as mock_get:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = MOCK_RESPONSE
        mock_get.return_value = mock_response
        
        result = service.fetch_model_capabilities("owner/name")
        
        assert result["raw_response"] == MOCK_RESPONSE
        
        caps = result["normalized_caps"]
        assert caps["title"] == "name"
        assert len(caps["inputs"]) == 3
        
        # Verify Prompt
        prompt = next(i for i in caps["inputs"] if i["name"] == "prompt")
        assert prompt["type"] == "string"
        assert prompt["default"] == "A puppy"
        
        # Verify Enum
        ar = next(i for i in caps["inputs"] if i["name"] == "aspect_ratio")
        assert ar["type"] == "select"
        assert ar["options"] == ["1:1", "16:9", "4:3"]
        
        # Verify Integer
        width = next(i for i in caps["inputs"] if i["name"] == "width")
        assert width["type"] == "integer"
        assert width["min"] == 256

def test_fetch_capabilities_error(service):
    with patch("httpx.Client.get") as mock_get:
        mock_response = MagicMock()
        mock_response.status_code = 404
        mock_get.return_value = mock_response
        
        with pytest.raises(ValueError):
            service.fetch_model_capabilities("owner/unknown")

def test_map_type(service):
    # Test internal helper
    assert service._map_type({"type": "integer"}) == "integer"
    assert service._map_type({"type": "string", "format": "uri"}) == "file"
    assert service._map_type({"type": "array"}) == "list"
