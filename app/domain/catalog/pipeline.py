
import hashlib
import json
from typing import Dict, Any, List, Tuple, Optional
from app.domain.catalog.schemas import ModelUISpec, UIParameter, ParameterGroup, UIParameterConfig, PricingRule, ParameterOption
from app.domain.catalog.schema_converter import SchemaToUIConverter
from app.domain.catalog.access_control import AccessControlService

class SchemaProcessingPipeline:
    """
    Coordinates the transformation of raw OpenAPI schemas into Access-Controlled UI Specifications.
    Handles extraction, conversion, configuration injection, and tier filtering.
    """
    
    def __init__(self):
        self.converter = SchemaToUIConverter()
        self.access_control = AccessControlService()

    def process(
        self, 
        model_id: str,
        raw_schema: Dict[str, Any], 
        ui_config: Dict[str, Any], 
        user_tier: str = "starter"
    ) -> Tuple[ModelUISpec, str]:
        """
        Executes the full pipeline.
        Returns the simplified UI Spec and a content hash for versioning.
        """
        # 0. Safety Checks
        raw_schema = raw_schema or {}
        ui_config = ui_config or {}

        # 1. Calculate Schema Version Hash
        # We hash the raw_schema + ui_config to detect changes
        content_hash = self._calculate_hash(raw_schema, ui_config)

        # 2. Extract Input Properties from OpenAPI
        input_props = self._extract_input_properties(raw_schema)
        
        # 3. Convert to Initial UI Parameters
        base_params = self.converter.convert_to_ui_spec(input_props, root_schema=raw_schema)
        
        # 4. Inject Parameters from UI Config (that don't exist in schema)
        merged_params = self._merge_config_params(base_params, ui_config)
        
        # 5. Apply Access Control, Overrides, and Granular Logic
        final_params, pricing_rules = self._apply_overrides_and_access(merged_params, ui_config, user_tier)
        
        # 6. Construct Final Spec
        # TODO: Groups could be dynamic based on config
        groups = [
             ParameterGroup(id="basic", label="Basic Settings", collapsed_by_default=False),
             ParameterGroup(id="advanced", label="Advanced Settings", collapsed_by_default=True)
        ]
        
        spec = ModelUISpec(
            model_id=model_id,
            groups=groups,
            parameters=final_params,
            pricing_rules=pricing_rules
        )
        
        return spec, content_hash

    def _calculate_hash(self, schema: Dict, config: Dict) -> str:
        """Generates a consistent hash of the inputs."""
        try:
            # Sort keys for consistency
            s_str = json.dumps(schema, sort_keys=True, default=str)
            c_str = json.dumps(config, sort_keys=True, default=str)
            return hashlib.sha256((s_str + c_str).encode()).hexdigest()
        except Exception:
            return "unknown"



    def _merge_config_params(self, params: List[UIParameter], ui_config: Dict[str, Any]) -> List[UIParameter]:
        """
        Injects parameters defined ONLY in UI Config (Synthetic Parameters).
        """
        existing_ids = {p.id for p in params}
        
        for param_id, config in ui_config.items():
            if not isinstance(config, dict): continue
            if param_id in existing_ids: continue # Already exists
            
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
            
        return params

    def _apply_overrides_and_access(
        self, 
        params: List[UIParameter], 
        ui_config: Dict[str, Any], 
        user_tier: str
    ) -> Tuple[List[UIParameter], List[PricingRule]]:
        """
        Filters parameters by tier, applies overrides, and generates pricing rules.
        """
        final_params = []
        all_pricing_rules = []

        for p in params:
            config = ui_config.get(p.id, {})
            if not isinstance(config, dict): config = {}

            # 1. Access Control
            if not self.access_control.can_access_parameter(config, user_tier):
                continue
            
            # 2. Overrides
            if "label" in config: p.label = config["label"]
            if "default" in config: p.default = config["default"]
            if "group" in config: p.group_id = config["group"]
            if "description" in config: p.description = config["description"]
            if "min" in config: p.min = config["min"]
            if "max" in config: p.max = config["max"]

            # 3. Options & Pricing
            values_config = config.get("values")
            if values_config and isinstance(values_config, list):
                allowed_options = []
                generated_rules = []
                
                for v_conf in values_config:
                    # Check Access for Option
                    if not self.access_control.can_access_value(v_conf, user_tier):
                        continue
                    
                    # Create Option
                    opt_label = v_conf.get("label") or str(v_conf.get("value"))
                    allowed_options.append(ParameterOption(
                        label=opt_label,
                        value=v_conf.get("value"),
                        surcharge=v_conf.get("price", 0)
                    ))
                    
                    # Create Pricing Rule
                    price = v_conf.get("price", 0)
                    if price > 0:
                        rule = PricingRule(
                            id=f"pr_{p.id}_{v_conf.get('value')}",
                            param_id=p.id,
                            operator="eq",
                            value=v_conf.get("value"),
                            surcharge=price,
                            label=f"{opt_label} Surcharge"
                        )
                        generated_rules.append(rule)

                if allowed_options:
                    p.options = allowed_options
                    p.type = "select"
                    
                    # Set default from config if marked
                    default_val_conf = next((v for v in values_config if v.get("is_default")), None)
                    if default_val_conf:
                         p.default = default_val_conf.get("value")
                
                if generated_rules:
                    all_pricing_rules.extend(generated_rules)
            
            final_params.append(p)
            
        return final_params, all_pricing_rules
