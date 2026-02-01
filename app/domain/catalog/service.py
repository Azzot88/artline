
from typing import List, Dict, Any, Optional
from app.domain.catalog.schemas import UIParameter, ModelUISpec, ParameterGroup, UIParameterConfig
from app.domain.providers.models import AIModel
from app.domain.catalog.schema_converter import SchemaToUIConverter

class CatalogService:
    def __init__(self):
        self.schema_converter = SchemaToUIConverter()

    def resolve_ui_spec(self, model: AIModel, user_tier: str = "starter") -> ModelUISpec:
        """
        Generates the final UI Specification for a model, respecting:
        1. Normalized Capabilities (from Replicate/Provider)
        2. UI Config Overrides (Admin configured labels, defaults)
        3. Tiered Access (Visibility based on user plan)
        """
        
        # 1. Start with Base Params from Schema
        params: List[UIParameter] = []
        
        # Parse inputs from normalized schema if available, else raw
        raw_schema = model.raw_schema_json
        if raw_schema:
            try:
                input_props = raw_schema.get("components", {}).get("schemas", {}).get("Input", {}).get("properties", {})
                if not input_props:
                    input_props = raw_schema.get("properties", {})
                
                params = self.schema_converter.convert_to_ui_spec(input_props, root_schema=raw_schema)
            except Exception as e:
                print(f"Schema Parse Error: {e}")
                # Fallback empty or logging
        
        # 1.5 Inject Parameters from UI Config (if missing in schema)
        ui_config = model.ui_config or {}
        existing_ids = {p.id for p in params}
        
        for param_id, config in ui_config.items():
            if param_id not in existing_ids:
                # Infer type
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
        
        # 2. Apply UI Config Overrides & Tier Filtering
        final_params = []
        
        # Convert list of dicts/objs to a lookup map if needed, 
        # but model.ui_config is a Dict[param_id, ConfigDict]
        ui_config = model.ui_config or {}
        
        for p in params:
            config = ui_config.get(p.id, {})
            
            # A. Global Visibility Override
            # If explicit hidden in config
            if config.get("hidden") is True:
                continue
            
            # B. Tiered Access Check
            # access_tiers: ["pro", "studio"] or None/Empty (All)
            allowed_tiers = config.get("access_tiers")
            
            # If allowed_tiers is set and not empty, check if user_tier is in it
            # We assume "studio" includes "pro" includes "starter" usually, but for now exact match or list containment
            # Logic: If tiers are defined, user MUST be in one of them.
            # Hierarchy: studio > pro > starter.
            # If Tier is "starter", they can access items marked "starter".
            # If item is marked ["pro"], starter cannot see it.
            # If item is marked ["starter", "pro"], starter can see it.
            # If item is marked ["all"] or empty, everyone sees it.
            
            if allowed_tiers and len(allowed_tiers) > 0:
                 # Hierarchy Logic (Simple containment for MVP)
                 # We need to know if user_tier satisfies requirements.
                 # E.g. if item requires "pro", and user is "starter" -> Hide.
                 # If user is "studio", and item requires "pro" -> Show (needs hierarchy awareness)
                 
                 # Let's define hierarchy levels
                 levels = {"starter": 1, "pro": 2, "studio": 3, "admin": 99}
                 user_level = levels.get(user_tier, 1)
                 
                 # Find min level required? Or is it an allowlist?
                 # Let's assume allowlist but we can infer min level if we only tag the min tier.
                 # Standard logic: If 'pro' is in list, it means Pro and above? Or ONLY Pro?
                 # Let's treat it as: "Available to these specific tiers". 
                 # But usually we want "Pro and above".
                 # Let's use simpler logic: If user_tier in allowed_tiers -> OK.
                 # This implies Admin must tag ["pro", "studio"] for a Pro feature.
                 if user_tier not in allowed_tiers and "all" not in allowed_tiers:
                     continue
            
            # C. Input Customization
            if "label" in config: 
                p.label = config["label"]
            
            if "default" in config:
                p.default = config["default"]
                
            if "group" in config:
                p.group_id = config["group"]

            if "description" in config:
                p.description = config["description"]

            # D. Validation Overrides
            if "min" in config: p.min = config["min"]
            if "max" in config: p.max = config["max"]
            
            final_params.append(p)
            
        # 3. Define Groups (Static for now, can be dynamic later)
        groups = [
             ParameterGroup(id="basic", label="Basic Settings", collapsed_by_default=False),
             ParameterGroup(id="advanced", label="Advanced Settings", collapsed_by_default=True)
        ]
        
        return ModelUISpec(
            model_id=str(model.id),
            groups=groups,
            parameters=final_params
        )
