
from typing import Dict, Any

def extract_input_properties(raw_schema: Dict[str, Any]) -> Dict[str, Any]:
    """
    Traverses OpenAPI (or Replicate-style) schema to find the actual input parameters definition.
    
    Strategies:
    1. Standard OpenAPI components/schemas/Input
    2. Nested 'parameters' or 'input' object (common in some wrappers)
    3. Root 'properties' (fallback)
    """
    if not raw_schema: 
        return {}
        
    try:
        # 1. Standard OpenAPI/Replicate
        input_props = raw_schema.get("components", {}).get("schemas", {}).get("Input", {}).get("properties")
        
        if not input_props:
            # 2. Nested/Wrapped Checks
            root_props = raw_schema.get("properties", {})
            
            if "parameters" in root_props:
                 params_def = root_props["parameters"]
                 if "properties" in params_def:
                     input_props = params_def["properties"]
                 elif "$ref" in params_def:
                     # Simple local ref resolve
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
            
        return input_props or {}
        
    except Exception:
        return {}
