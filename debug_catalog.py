import sys
import os
sys.path.append(os.getcwd())

from app.domain.catalog.service import CatalogService
from app.domain.providers.models import AIModel
from app.domain.catalog.schemas import ParameterValueConfig

# Mock Model
model = AIModel(
    id="123",
    raw_schema_json={
        "properties": {
            "aspect_ratio": {"type": "string", "default": "1:1"}
        }
    },
    ui_config={
        "aspect_ratio": {
            "values": [
                {"value": "1:1", "label": "Square"},
                {"value": "16:9", "label": "Wide"}
            ]
        }
    }
)

service = CatalogService()
print("Resolving UI Spec...")
try:
    spec = service.resolve_ui_spec(model)
    print("Spec Resolved Successfully.")
    
    # Check options type
    ar_param = next(p for p in spec.parameters if p.id == "aspect_ratio")
    print(f"Param Type: {ar_param.type}")
    print(f"Options: {ar_param.options}")
    
    if ar_param.options:
        first_opt = ar_param.options[0]
        print(f"First Option Type: {type(first_opt)}")
        print(f"First Option Value: {first_opt.value}")

except Exception as e:
    print(f"CRASH: {e}")
    import traceback
    traceback.print_exc()
