import pytest
from app.domain.providers.replicate.request_normalizer import ReplicateRequestNormalizer

@pytest.fixture
def normalizer():
    return ReplicateRequestNormalizer()

def test_normalize_string(normalizer):
    schema = {"inputs": [{"name": "prompt", "type": "string", "maxLength": 10}]}
    
    # 1. Standard
    assert normalizer.normalize({"prompt": "hello"}, schema) == {"prompt": "hello"}
    
    # 2. Truncate
    assert normalizer.normalize({"prompt": "hello world this is too long"}, schema) == {"prompt": "hello worl"}
    
    # 3. Trim
    assert normalizer.normalize({"prompt": "  hello  "}, schema) == {"prompt": "hello"}

def test_normalize_int(normalizer):
    schema = {"inputs": [{"name": "steps", "type": "integer", "min": 1, "max": 10, "step": 2}]}
    
    # 1. Valid
    assert normalizer.normalize({"steps": 5}, schema) == {"steps": 5}
    
    # 2. String to Int
    assert normalizer.normalize({"steps": "5"}, schema) == {"steps": 5}
    
    # 3. Float to Int
    assert normalizer.normalize({"steps": 5.9}, schema) == {"steps": 5}
    
    # 4. Clamp Min
    assert normalizer.normalize({"steps": -5}, schema) == {"steps": 1}
    
    # 5. Clamp Max
    assert normalizer.normalize({"steps": 100}, schema) == {"steps": 10}
    
def test_normalize_float(normalizer):
    schema = {"inputs": [{"name": "guidance", "type": "number", "min": 0.0, "max": 10.0}]}
    
    assert normalizer.normalize({"guidance": "7.5"}, schema) == {"guidance": 7.5}
    assert normalizer.normalize({"guidance": 15}, schema) == {"guidance": 10.0}

def test_normalize_bool(normalizer):
    schema = {"inputs": [{"name": "safety", "type": "boolean"}]}
    
    assert normalizer.normalize({"safety": "true"}, schema) == {"safety": True}
    assert normalizer.normalize({"safety": "False"}, schema) == {"safety": False}
    assert normalizer.normalize({"safety": 1}, schema) == {"safety": True}
    assert normalizer.normalize({"safety": 0}, schema) == {"safety": False}
    
def test_enum_validation(normalizer):
    schema = {"inputs": [{"name": "scheduler", "type": "select", "options": ["A", "B"]}]}
    
    assert normalizer.normalize({"scheduler": "A"}, schema) == {"scheduler": "A"}
    
    # Invalid (dropped/skipped in current implementation, or raises if handled differently)
    # The current impl catches ValueError and skips the field
    assert normalizer.normalize({"scheduler": "C"}, schema) == {} 

def test_unknown_fields_dropped(normalizer):
    schema = {"inputs": [{"name": "prompt", "type": "string"}]}
    
    data = {"prompt": "hi", "random_junk": 123}
    assert normalizer.normalize(data, schema) == {"prompt": "hi"}

# Media Tests (Mocked)
# We won't test actual moviepy/librosa execution here to avoid heavy dependencies in lightweight unit tests,
# but we can verify logic paths if needed.
