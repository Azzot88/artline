
from typing import Any, Dict, List
from app.domain.providers.normalization.base import RequestNormalizer
from app.domain.providers.normalization.type_normalizers import BaseTypeNormalizer
from app.domain.providers.normalization.resolution_strategy import CinemaResolutionStrategy

from app.domain.catalog.schema_utils import extract_input_properties

class ReplicateRequestNormalizer(RequestNormalizer, BaseTypeNormalizer):
    """
    Replicate specific request normalization.
    Uses BaseTypeNormalizer for primitive types and CinemaResolutionStrategy for dimensions.
    """
    
    def __init__(self):
        self.resolution_strategy = CinemaResolutionStrategy()
    
    def normalize(self, input_data: Dict[str, Any], schema: Dict[str, Any]) -> Dict[str, Any]:
        """
        Normalize input for Replicate API.
        """
        cleaned = {}
        
        # Determine strict schema properties
        # 1. Check for normalized caps 'inputs' list (Legacy/Cache)
        if "inputs" in schema and isinstance(schema["inputs"], list):
            properties = schema["inputs"]
            schema_map = {}
            for item in properties:
                schema_map[item["name"]] = item
                
        # 2. Check for OpenAPI raw structure
        elif "components" in schema or "properties" in schema:
            properties = extract_input_properties(schema)
            # properties is Dict[name, details]
            schema_map = properties
            
        else:
            # Assume it's already a map of {name: details}
            schema_map = schema

        # Apply Resolution Strategy (Cinema Logic)
        # Mutates input_data copy effectively but we are working on the dict passed in?
        # Ideally we should work on a copy to avoid side effects if reused, 
        # but for this pipeline it's likely transient.
        input_data = self.resolution_strategy.apply(input_data, schema_map)

        for key, value in input_data.items():
            if key not in schema_map:
                # Pass through 'prompt' always if present
                if key == "prompt":
                    cleaned[key] = self.normalize_string(value, {"maxLength": 25000})
                continue

            field_def = schema_map[key]
            
            try:
                norm_value = self._normalize_field(value, field_def)
                if norm_value is not None and norm_value != "":
                    cleaned[key] = norm_value
            except ValueError:
                # Log? Skip invalid fields
                pass
                
        return cleaned

    def validate(self, input_data: Dict[str, Any], schema: Dict[str, Any]) -> bool:
        # TODO: Implement strict validation if needed
        return True

    def _normalize_field(self, value: Any, field_def: Dict[str, Any]) -> Any:
        ftype = field_def.get("type", "string")

        # Handle Enums first
        if "options" in field_def and field_def["options"] or "enum" in field_def:
             allowed = field_def.get("options") or field_def.get("enum")
             value = self.validate_enum(value, allowed)

        if ftype == "integer":
            # Replicate Specific: Handle seed -1
            if field_def.get("name") == "seed":
                try:
                    if int(float(value)) == -1:
                        return -1 # Bypass min checks for -1
                except: pass
            return self.normalize_integer(value, field_def)
            
        elif ftype == "number" or ftype == "float":
            return self.normalize_float(value, field_def)
            
        elif ftype == "boolean":
            return self.normalize_boolean(value, field_def)
            
        elif ftype == "image" or ftype == "file":
             return self.normalize_file_input(value, field_def)
             
        elif ftype == "list" or ftype == "array":
             # Pass self._normalize_field as callback for recursion
             return self.normalize_array(value, field_def, self._normalize_field)
             
        else:
            return self.normalize_string(value, field_def)
