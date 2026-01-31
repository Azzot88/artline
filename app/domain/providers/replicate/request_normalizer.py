from typing import Any, Dict, List
from app.domain.providers.normalization.base import RequestNormalizer
from app.domain.providers.normalization.request_normalizer import RequestNormalizerAuth

class ReplicateRequestNormalizer(RequestNormalizer, RequestNormalizerAuth):
    """
    Replicate specific request normalization.
    """
    
    def normalize(self, input_data: Dict[str, Any], schema: Dict[str, Any]) -> Dict[str, Any]:
        """
        Normalize input for Replicate API.
        """
        cleaned = {}
        
        # Determine strict schema properties
        properties = schema.get("inputs", []) if "inputs" in schema else schema
        
        schema_map = {}
        if isinstance(properties, list):
            for item in properties:
                schema_map[item["name"]] = item
        else:
            schema_map = properties

        for key, value in input_data.items():
            if key not in schema_map:
                # Pass through 'prompt' always if present, effectively "Global" input
                if key == "prompt":
                    cleaned[key] = self.normalize_string(value, {"maxLength": 25000})
                continue

            field_def = schema_map[key]
            
            try:
                norm_value = self._normalize_field(value, field_def)
                if norm_value is not None:
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
            if field_def.get("name") == "seed" and int(float(value)) == -1:
                return -1 # Bypass min checks for -1
            return self.normalize_integer(value, field_def)
            
        elif ftype == "number" or ftype == "float":
            return self.normalize_float(value, field_def)
            
        elif ftype == "boolean":
            return self.normalize_boolean(value, field_def)
            
        elif ftype == "image" or ftype == "file":
             return self.normalize_file_input(value, field_def)
             
        elif ftype == "list" or ftype == "array":
             return self.normalize_array(value, field_def, self._normalize_field)
             
        else:
            # Special case: Scheduler should be lowercase?
            val = self.normalize_string(value, field_def)
            if field_def.get("name") == "scheduler":
                return val.lower()
            return val
