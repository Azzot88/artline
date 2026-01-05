import pytest
from app.domain.providers.replicate_service import ReplicateService

@pytest.fixture
def service():
    return ReplicateService(api_key="test")

def test_build_payload_whitelist(service):
    # Schema
    inputs = [
        {"name": "prompt", "type": "string"},
        {"name": "width", "type": "integer", "min": 1},
        {"name": "aspect_ratio", "type": "select", "options": ["1:1", "16:9"]}
    ]
    
    # Request with extra params and wrong types
    req = {
        "prompt": "foo",
        "width": "1024", # String, should cast
        "aspect_ratio": "16:9",
        "bad_param": "evil",
        "another_bad": 123
    }
    
    payload = service.build_payload(req, inputs)
    
    assert "prompt" in payload
    assert payload["width"] == 1024 # Cast confirmed
    assert payload["aspect_ratio"] == "16:9"
    assert "bad_param" not in payload
    assert "another_bad" not in payload

def test_build_payload_enum_validation(service):
    inputs = [
        {"name": "aspect_ratio", "type": "select", "options": ["1:1", "16:9"]}
    ]
    
    # Invalid Enum
    req = {"aspect_ratio": "21:9"}
    payload = service.build_payload(req, inputs)
    
    assert "aspect_ratio" not in payload # Should drop invalid enum

def test_build_payload_type_validation(service):
    inputs = [
        {"name": "strength", "type": "float"},
        {"name": "count", "type": "integer"}
    ]
    
    req = {
        "strength": "not a float",
        "count": 10.5 # Float passed to int
    }
    
    payload = service.build_payload(req, inputs)
    
    assert "strength" not in payload
    # Count: sanitize_input might cast 10.5 to int? 
    # Python int(10.5) = 10. sanitize_input usually handles int-like strings.
    # sanitize_input loop: if k in INT_KEYS tries int(v).
    # if "count" is NOT in hardcoded INT_KEYS of sanitize_input, it stays float.
    # build_payload then checks isinstance(int). 
    # If 10.5 stays float, build_payload logic: if float -> int(v).
    # So it should become 10. 
    # But wait, logic says `if isinstance(value, float): value = int(value)`
    assert payload.get("count") == 10

def test_boolean_casting(service):
    inputs = [
        {"name": "is_ok", "type": "boolean"}
    ]
    req = {"is_ok": "true"}
    payload = service.build_payload(req, inputs)
    assert payload["is_ok"] is True
