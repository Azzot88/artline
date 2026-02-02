
from typing import List, Dict, Any, Optional
from app.domain.catalog.schemas import UIParameter, ModelUISpec, ParameterGroup, UIParameterConfig, PricingRule, ParameterOption
from app.domain.providers.models import AIModel
from app.domain.catalog.schema_converter import SchemaToUIConverter
from app.domain.catalog.access_control import AccessControlService

class CatalogService:
    def __init__(self):
        self.schema_converter = SchemaToUIConverter()
        self.access_control = AccessControlService()

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
                # 1. Standard OpenAPI/Replicate
                input_props = raw_schema.get("components", {}).get("schemas", {}).get("Input", {}).get("properties")
                
                if not input_props:
                    # 2. Check for wrapped structure (Pydantic/LangChain style)
                    # If root properties contain 'parameters' or 'input', drill down.
                    root_props = raw_schema.get("properties", {})
                    if "parameters" in root_props:
                         # It's likely a wrapper. Need to resolve if ref or direct.
                         # Simplified: assuming direct for now or let convert handle specific sub-dict?
                         # Actually, SchemaConverter expects a dict of properties. 
                         # If 'parameters' is an object with 'properties', we want THAT.
                         params_def = root_props["parameters"]
                         if "properties" in params_def:
                             input_props = params_def["properties"]
                         elif "$ref" in params_def:
                             # Resolve Ref (Limited)
                             # Doing a quick local resolve if possible
                             ref_name = params_def["$ref"].split("/")[-1]
                             ref_def = raw_schema.get("definitions", {}).get(ref_name, {}) or \
                                       raw_schema.get("$defs", {}).get(ref_name, {})
                             input_props = ref_def.get("properties", {})

                    elif "input" in root_props:
                         input_def = root_props["input"]
                         if "properties" in input_def:
                             input_props = input_def["properties"]

                if not input_props:
                    # 3. Fallback to root (but be careful - if we found nothing above, maybe root IS the props)
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
        all_pricing_rules = []
        
        for p in params:
            config = ui_config.get(p.id, {})
            # Safety check
            if not isinstance(config, dict):
                config = {}
            
            # A. & B. Access Control (Visibility + Tier)
            if not self.access_control.can_access_parameter(config, user_tier):
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

            # E. Granular Values & Pricing
            values_config = config.get("values")
            if values_config and isinstance(values_config, list):
                allowed_options = []
                pricing_generated = []
                
                for v_conf in values_config:
                    # 1. Access Check for specific value
                    if not self.access_control.can_access_value(v_conf, user_tier):
                        continue
                    
                    # 2. Add to Options
                    # Convert to ParameterOption
                    opt_label = v_conf.get("label") or str(v_conf.get("value"))
                    allowed_options.append(ParameterOption(
                        label=opt_label,
                        value=v_conf.get("value"),
                        surcharge=v_conf.get("price", 0)
                    ))
                    
                    # 3. Pricing Rule
                    price = v_conf.get("price", 0)
                    if price > 0:
                        # Create implicit pricing rule
                        # Note: This is simplified. Real system might aggregate these differently.
                        # But for UI estimation, we can expose it.
                        rule = PricingRule(
                            id=f"pr_{p.id}_{v_conf.get('value')}",
                            param_id=p.id,
                            operator="eq",
                            value=v_conf.get("value"),
                            surcharge=price,
                            label=f"{opt_label} Surcharge"
                        )
                        pricing_generated.append(rule)

                if allowed_options:
                    p.options = allowed_options
                    p.type = "select"
                    
                    default_val_conf = next((v for v in values_config if v.get("is_default")), None)
                    if default_val_conf:
                         p.default = default_val_conf.get("value")
                
                if pricing_generated:
                    all_pricing_rules.extend(pricing_generated)
            
            final_params.append(p)
            
        # 3. Define Groups (Static for now, can be dynamic later)
        groups = [
             ParameterGroup(id="basic", label="Basic Settings", collapsed_by_default=False),
             ParameterGroup(id="advanced", label="Advanced Settings", collapsed_by_default=True)
        ]
        
        return ModelUISpec(
            model_id=model_id,
            groups=groups,
            parameters=final_params,
            pricing_rules=all_pricing_rules
        )
