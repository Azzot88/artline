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

        # Pre-process 'Cinema Resolution' meta-params
        if "orientation" in input_data:
             orientation = input_data.get("orientation", "portrait").lower()
             fmt = input_data.get("format", "standard").lower()
             
             w, h = 1024, 1024 # Default Square Standard
             
             # 1. Resolve Matrix
             if orientation == "square":
                 if fmt == "hd": w, h = 2048, 2048
                 elif fmt == "4k": w, h = 4096, 4096 # Or 3840? Let's stick to 2048 for HD as safe max for Flux
                 else: w, h = 1024, 1024
                 
             elif orientation == "portrait":
                 if fmt == "hd": w, h = 1080, 1920
                 elif fmt == "4k": w, h = 2160, 3840
                 else: w, h = 896, 1152 # Optimal SDXL Portrait
                 
             elif orientation == "landscape":
                 if fmt == "hd": w, h = 1920, 1080
                 elif fmt == "4k": w, h = 3840, 2160
                 else: w, h = 1152, 896 # Optimal SDXL Landscape

             # 2. Inject into input if schema supports it
             if "width" in schema_map: input_data["width"] = w
             if "height" in schema_map: input_data["height"] = h
             
             # 3. Synthesize 'resolution' string if model wants that instead
             if "resolution" in schema_map:
                  # Some models want "WxH", others "1024x1024"
                  input_data["resolution"] = f"{w}x{h}"

        # Legacy Splitter (Keep for safety if someone sends raw resolution)
        elif "resolution" in input_data and "resolution" not in schema_map:
             if "width" in schema_map and "height" in schema_map:
                  res_str = str(input_data["resolution"])
                  if "x" in res_str:
                       try:
                            w, h = res_str.split("x")
                            input_data["width"] = int(w)
                            input_data["height"] = int(h)
                       except:
                            pass

        for key, value in input_data.items():
            if key not in schema_map:
                # Pass through 'prompt' always if present
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
            return self.normalize_string(value, field_def)
