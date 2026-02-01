from typing import List, Dict, Any
from app.domain.catalog.schemas import UIParameter, ParameterOption

class SchemaToUIConverter:
    """
    Converts raw OpenAPI schemas (or Normalized schemas) into Canonical UI Specifications.
    """
    
    def convert_to_ui_spec(self, input_schema: Dict[str, Any], root_schema: Dict[str, Any] = None) -> List[UIParameter]:
        """
        Converts raw schema properties into a list of Canonical UIParameters.
        """
        params = []
        props = input_schema
        self.root_schema = root_schema or {}
        
        # Priority mapping for ordering
        # Core params first
        priority = ["prompt", "aspect_ratio", "width", "height", "output_quality", "num_outputs", "num_inference_steps", "guidance_scale", "seed"]
        
        # Sort keys by priority then alpha
        keys = sorted(props.keys(), key=lambda k: (priority.index(k) if k in priority else 999, k))

        # Blacklist removed - using smarter traversal in Service instead

        
        for key in keys:
            
            details = props[key]
            
            # Skip hidden/blacklisted params logic?
            # Keeping it simple for now, can filter later
            
            # RESOLVE REF / ALLOF
            resolved_details = self._resolve_schema(details) 
            
            # Logic: If 'enum' is in resolved, use it.
            effective_enum = details.get("enum") or resolved_details.get("enum")
            effective_type = details.get("type") or resolved_details.get("type")
            raw_type = effective_type

            p_type = "text"
            options = None
            
            if effective_enum:
                p_type = "select"
                options = [
                    ParameterOption(label=str(val).title().replace("_", " "), value=val)
                    for val in effective_enum
                ]
            elif "anyOf" in details or "oneOf" in details or "allOf" in details:
                # Handle combinators
                schemas = []
                if "anyOf" in details: schemas.extend(details["anyOf"])
                if "oneOf" in details: schemas.extend(details["oneOf"])
                
                found_enum = []
                for s in schemas:
                    s_res = self._resolve_schema(s)
                    if "enum" in s_res: found_enum.extend(s_res["enum"])
                    elif "const" in s_res: found_enum.append(s_res["const"])
                
                if found_enum:
                    p_type = "select"
                    unique_vals = sorted(list(set([v for v in found_enum if v is not None])), key=lambda x: str(x))
                    options = [
                        ParameterOption(label=str(val).title().replace("_", " "), value=val) 
                        for val in unique_vals
                    ]
            elif raw_type == "integer":
                p_type = "number"
            elif raw_type == "number":
                p_type = "number"
            elif raw_type == "boolean":
                p_type = "boolean"
            elif key == "prompt" or key == "negative_prompt":
                p_type = "textarea"
                
            if key == "aspect_ratio":
                p_type = "select"
                if not options:
                     # Match frontend heuristic (use-model-editor.ts)
                     defaults = ["1:1", "16:9", "9:16", "4:3", "3:4"]
                     options = [ParameterOption(label=v, value=v) for v in defaults]
                
            title = details.get("title") or details.get("label")
            if not title:
                title = key.replace("_", " ").title()
                
            param = UIParameter(
                id=key,
                label=str(title).strip(),
                type=p_type,
                default=details.get("default"),
                description=details.get("description"),
                min=details.get("minimum"),
                max=details.get("maximum"),
                step=1 if raw_type == "integer" else None,
                options=options,
                group_id="advanced" if key not in priority[:4] else "basic",
                hidden=False
            )
            
            if key == "prompt":
                param.group_id = "basic"
                param.required = True
                
            params.append(param)
            
        return params

    def _resolve_schema(self, schema: Dict[str, Any]) -> Dict[str, Any]:
        """
        Resolves $ref.
        """
        if not schema: return {}
        
        if "$ref" in schema:
            ref = schema["$ref"]
            if ref.startswith("#/"):
                parts = ref.split("/")[1:]
                current = self.root_schema
                try:
                    for part in parts:
                        current = current.get(part)
                        if not current: break
                    if current:
                         return self._resolve_schema(current)
                except Exception:
                    pass
            return {}

        if "allOf" in schema:
            merged = {}
            for sub in schema["allOf"]:
                resolved = self._resolve_schema(sub)
                merged.update(resolved)
            for k, v in schema.items():
                 if k != "allOf": merged[k] = v
            return merged
            
        return schema
