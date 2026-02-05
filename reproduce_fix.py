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

# The NEW logic from SchemaProcessingPipeline.process (Normalization)
def normalize_and_merge(params: List[UIParameter], ui_config: Dict[str, Any]) -> List[UIParameter]:
    # --- Normalization Logic ---
    if "parameters" in ui_config and isinstance(ui_config["parameters"], dict):
            ui_config = ui_config["parameters"]
            
    elif "parameter_configs" in ui_config:
            p_configs = ui_config["parameter_configs"]
            flat_config = {}
            if isinstance(p_configs, list):
                for cfg in p_configs:
                    if isinstance(cfg, dict) and "parameter_id" in cfg:
                        flat_config[cfg["parameter_id"]] = cfg
                        
            elif isinstance(p_configs, dict):
                for cfg in p_configs.values():
                    if isinstance(cfg, dict) and "parameter_id" in cfg:
                        flat_config[cfg["parameter_id"]] = cfg
            
            if flat_config:
                ui_config = flat_config
    # ---------------------------

    existing_ids = {p.id for p in params}
    
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

# Test Case 1: Ideogram V3 structure (Bad -> Should be fixed now)
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

# Test Case 2: Flux Krea Dev structure (Good)
good_config = {
    "prompt": {"parameter_id": "prompt", "enabled": True},
    "aspect_ratio": {"parameter_id": "aspect_ratio", "enabled": True}
}

print("--- Testing Bad Config (After Fix) ---")
params = []
params = normalize_and_merge(params, bad_config)
print("\nGenerated Params:", params)

print("\n--- Testing Good Config (After Fix) ---")
params = []
params = normalize_and_merge(params, good_config)
print("\nGenerated Params:", params)
