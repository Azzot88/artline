from typing import Any, Dict, List
import copy

class ReplicateSchemaParser:
    """
    Parses Replicate OpenAI Schema format.
    Refactored from ReplicateCapabilitiesService.
    """
    
    def __init__(self):
        self.root_schema = {}

    def parse_schema(self, openapi_schema: Dict[str, Any]) -> Dict[str, Any]:
        """
        Parses raw OpenAPI schema into internal NormalizationSchema format.
        """
        self.root_schema = openapi_schema
        
        input_component = {}
        if "components" in openapi_schema and "schemas" in openapi_schema["components"]:
             input_component = openapi_schema["components"]["schemas"].get("Input", {})
        elif "properties" in openapi_schema:
             input_component = openapi_schema
             
        input_props = input_component.get("properties", {})
        required_fields = input_component.get("required", [])
        
        normalized_inputs = []
        defaults = {}
        
        for key, details in input_props.items():
            # Resolve Refs/AllOf
            prop = self._resolve_schema(details)
            
            field = {
                "name": key,
                "type": self._map_type_strict(prop, key),
                "options": prop.get("enum") if "enum" in prop else None,
                "min": prop.get("minimum"),
                "max": prop.get("maximum"),
                "step": prop.get("multipleOf"),
                "default": prop.get("default"),
                "required": key in required_fields
            }
            
            # Special Handling
            if key == "prompt": field["maxLength"] = 25000
            
            # Standardize Resolution
            if key == "resolution":
                 field["type"] = "select"
                 if not field["options"]:
                     field["options"] = [
                         "1024x1024", "1152x896", "896x1152", 
                         "1216x832", "832x1216", "1344x768", "768x1344",
                         "1536x640", "640x1536"
                     ]
            
            normalized_inputs.append(field)
            if "default" in prop:
                 defaults[key] = prop["default"]
                 
        return {
            "inputs": normalized_inputs,
            "defaults": defaults
        }

    def _resolve_schema(self, schema: Dict[str, Any]) -> Dict[str, Any]:
        """
        Resolves $ref and merges allOf/anyOf schemas to find the effective type/enum.
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
            # Merge local props
            for k, v in schema.items():
                if k != "allOf": merged[k] = v
            return merged

        return schema

    def _map_type_strict(self, prop: Dict, key: str) -> str:
        t = prop.get("type", "string")
        if "enum" in prop: return "select"
        if t == "integer": return "integer"
        if t == "number": return "float"
        if t == "boolean": return "boolean"
        if t == "string":
            if prop.get("format") == "uri": return "file"
            if key in ["image", "input_image", "mask", "video", "audio"]: return "file"
            
            # Standardize Resolution
            if key == "resolution":
                return "select"
                
            return "string"
        if t == "array": return "list"
        return "string"
