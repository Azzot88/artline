import sys
from typing import Dict, Any, List

# Mock Classes from pipeline.py dependencies
class UIParameter:
    def __init__(self, id, label, type, default, required):
        self.id = id
        self.label = label
        self.type = type
        self.default = default
        self.required = required
    def __repr__(self):
        return f"UIParameter(id={self.id})"

# The logic from SchemaProcessingPipeline._merge_config_params
def _merge_config_params(params: List[UIParameter], ui_config: Dict[str, Any]) -> List[UIParameter]:
    existing_ids = {p.id for p in params}
    
    # ---------------------------------------------------------
    # ISSUE HYPOTHESIS: 
    # ui_config["parameter_configs"] might be a dict {"0": {}, "1": {}} 
    # but the code might expect a list or iterate differently.
    # Wait, the code in pipeline.py iterates `ui_config.items()`.
    # Let's check how parameter_configs is used.
    # ---------------------------------------------------------
    
    # In pipeline.py provided earlier:
    # for param_id, config in ui_config.items():
    #     if not isinstance(config, dict): continue
    
    # If ui_config has "parameter_configs" as a key, 
    # AND "parameter_configs" is a dict (from the bad dump),
    # then `config` becomes that dict.
    # It creates a new UIParameter with id="parameter_configs".
    # This seems wrong if "parameter_configs" is meant to be metadata, not a parameter itself.
    
    for param_id, config in ui_config.items():
        if not isinstance(config, dict): continue
        if param_id in existing_ids: continue 
        
        print(f"Processing potential param: {param_id}")
        
        default_val = config.get("default")
        inferred_type = "text"
        if isinstance(default_val, (int, float)) and not isinstance(default_val, bool):
                inferred_type = "number"
        elif isinstance(default_val, bool) or str(default_val).lower() in ["true", "false"]:
                inferred_type = "boolean"
        elif config.get("values"):
                inferred_type = "select"

        new_param = UIParameter(
            id=param_id,
            label=config.get("label_override") or param_id.replace("_", " ").title(),
            type=inferred_type,
            default=default_val,
            required=False
        )
        params.append(new_param)
        existing_ids.add(param_id)
        
    return params

# Test Case 1: Ideogram V3 structure (Bad)
bad_config = {
    "parameter_configs": {
        "0": {"parameter_id": "aspect_ratio", "enabled": True},
        "1": {"parameter_id": "image", "enabled": False}
    },
    "default_values": {"aspect_ratio": "1:1"},
    "parameters": {
        "aspect_ratio": {"parameter_id": "aspect_ratio"}
    }
}

# Test Case 2: Flux Krea Dev structure (Good?)
good_config = {
    "prompt": {"parameter_id": "prompt", "enabled": True},
    "aspect_ratio": {"parameter_id": "aspect_ratio", "enabled": True}
}

print("--- Testing Bad Config ---")
params = []
params = _merge_config_params(params, bad_config)
print("\nGenerated Params:", params)

print("\n--- Testing Good Config ---")
params = []
params = _merge_config_params(params, good_config)
print("\nGenerated Params:", params)
