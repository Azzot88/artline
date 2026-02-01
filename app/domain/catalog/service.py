
from typing import List, Dict, Any, Optional
from app.domain.catalog.schemas import UIParameter, ModelUISpec, ParameterGroup, UIParameterConfig
from app.domain.providers.models import AIModel
from app.domain.catalog.schema_converter import SchemaToUIConverter

class CatalogService:
    def __init__(self):
        self.schema_converter = SchemaToUIConverter()

    def resolve_ui_spec(self, model: AIModel, user_tier: str = "starter") -> ModelUISpec:
        return self.resolve_from_schema(
            model_id=str(model.id),
            raw_schema=model.raw_schema_json,
            ui_config=model.ui_config,
            user_tier=user_tier
        )

    def resolve_from_schema(
        self, 
        model_id: str, 
        raw_schema: Optional[Dict[str, Any]], 
        ui_config: Optional[Dict[str, Any]], 
        user_tier: str = "starter"
    ) -> ModelUISpec:
        """
        Generates UI Spec from raw data (decoupled from DB model).
        """
        # 1. Start with Base Params from Schema
        params: List[UIParameter] = []
        
        # Parse inputs from normalized schema if available, else raw
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
        ui_config = ui_config or {}
        existing_ids = {p.id for p in params}
        
        for param_id, config in ui_config.items():
            # Safety check: Config must be a dict
            if not isinstance(config, dict):
                continue

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
        
        for p in params:
            config = ui_config.get(p.id, {})
            # Safety check
            if not isinstance(config, dict):
                config = {}
            
            # A. Global Visibility Override
            # If explicit hidden in config
            if config.get("hidden") is True:
                continue
            
            # B. Tiered Access Check
            # access_tiers: ["pro", "studio"] or None/Empty (All)
            allowed_tiers = config.get("access_tiers")
            
            if allowed_tiers and len(allowed_tiers) > 0:
                 levels = {"starter": 1, "pro": 2, "studio": 3, "admin": 99}
                 # Simple check: user_tier must be in allowed list or 'all'
                 if user_tier not in allowed_tiers and "all" not in allowed_tiers:
                     # Exception: Admin sees everything?
                     if user_tier != "admin":
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
            model_id=model_id,
            groups=groups,
            parameters=final_params
        )
