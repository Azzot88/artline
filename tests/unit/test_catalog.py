
import pytest
from app.domain.providers.replicate_capabilities import ReplicateCapabilitiesService
from app.domain.catalog.schemas import UIParameter

def test_to_canonical_mapping():
    service = ReplicateCapabilitiesService()
    
    # Sample Schema from Flux-Schnell or similar
    input_schema = {
        "prompt": {
            "type": "string",
            "title": "Prompt",
            "default": "A cat",
            "description": "Input prompt"
        },
        "aspect_ratio": {
            "type": "string",
            "title": "Aspect Ratio",
            "default": "1:1",
            "enum": ["1:1", "16:9", "2:3"]
        },
        "num_inference_steps": {
            "type": "integer",
            "title": "Steps",
            "default": 4,
            "minimum": 1,
            "maximum": 50
        }
    }
    
    params = service.to_canonical(input_schema)
    
    assert len(params) == 3
    
    # Verify Prompt
    p_prompt = next(p for p in params if p.id == "prompt")
    assert p_prompt.type == "textarea"
    assert p_prompt.group_id == "basic"
    assert p_prompt.required is True
    
    # Verify Enum
    p_ar = next(p for p in params if p.id == "aspect_ratio")
    assert p_ar.type == "select"
    assert len(p_ar.options) == 3
    assert p_ar.options[1].value == "16:9"
    
    # Verify Number/Range
    p_steps = next(p for p in params if p.id == "num_inference_steps")
    assert p_steps.type == "number"
    assert p_steps.min == 1
    assert p_steps.max == 50
    assert p_steps.step == 1
