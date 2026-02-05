
import logging
import json
from typing import Any, Dict, List, Optional, Union, Tuple

logger = logging.getLogger(__name__)

class BaseTypeNormalizer:
    """
    Unified base class for normalizing primitive types.
    Consolidates logic from RequestNormalizerAuth and ReplicateNormalizer.
    """

    def normalize_string(self, value: Any, rules: Dict[str, Any]) -> str:
        if value is None: 
            return ""
        s = str(value).strip()
        
        max_len = rules.get("maxLength")
        if max_len and len(s) > max_len:
            s = s[:max_len]
            
        return s

    def normalize_integer(self, value: Any, rules: Dict[str, Any]) -> int:
        try:
            # Handle string floats "50.0" -> 50
            val = int(float(value))
        except (ValueError, TypeError):
            if rules.get("default") is not None:
                return int(rules["default"])
            raise ValueError(f"Invalid integer: {value}")
            
        min_val = rules.get("min") or rules.get("minimum")
        max_val = rules.get("max") or rules.get("maximum")
        
        # Bypass checks if it's a specific sentinal (like seed -1)? 
        # Ideally this should be in a subclass or via a hook, but for now strict checking:
        if min_val is not None: val = max(int(min_val), val)
        if max_val is not None: val = min(int(max_val), val)
        
        step = rules.get("step") or rules.get("multipleOf")
        if step:
            val = round(val / step) * step
            
        return val

    def normalize_float(self, value: Any, rules: Dict[str, Any]) -> float:
        try:
            val = float(value)
        except (ValueError, TypeError):
             if rules.get("default") is not None:
                return float(rules["default"])
             raise ValueError(f"Invalid float: {value}")
        
        min_val = rules.get("min") or rules.get("minimum")
        max_val = rules.get("max") or rules.get("maximum")
        
        if min_val is not None: val = max(float(min_val), val)
        if max_val is not None: val = min(float(max_val), val)
        
        return round(val, 5)

    def normalize_boolean(self, value: Any, rules: Dict[str, Any]) -> bool:
        if isinstance(value, bool): return value
        if isinstance(value, str):
            lower = value.lower()
            if lower in ("true", "1", "yes", "on"): return True
            if lower in ("false", "0", "no", "off"): return False
        if isinstance(value, int):
            return bool(value)
        
        if rules.get("default") is not None:
            return bool(rules["default"])
        return False

    def validate_enum(self, value: Any, allowed: List[Any]) -> Any:
        # Handle empty/none - return None so caller can decide (usually drop field)
        if value is None or (isinstance(value, str) and not value.strip()):
            return None
            
        if value in allowed: return value
        
        str_allowed = [str(a) for a in allowed]
        if str(value) in str_allowed:
            idx = str_allowed.index(str(value))
            return allowed[idx]
            
        # Case insensitive check
        if isinstance(value, str):
             lower_map = {str(a).lower(): a for a in allowed}
             if value.lower() in lower_map:
                 return lower_map[value.lower()]
                 
        # If strict validation fails:
        # Return None to signal "invalid value, drop field".
        # This allows Replicate default to take over if field isn't required.
        # If required and missing, Replicate will 422, which we now handle.
        return None

    def normalize_array(self, value: Any, rules: Dict[str, Any], item_normalizer_callback=None) -> List[Any]:
        if isinstance(value, str):
            if value.startswith("["):
                 try: value = json.loads(value)
                 except: pass
            else:
                 value = [value]
                 
        if not isinstance(value, list):
            value = [value]
            
        if item_normalizer_callback:
             item_schema = rules.get("items") or rules.get("item_schema")
             if item_schema:
                  normalized_list = []
                  for item in value:
                      try:
                          normalized_list.append(item_normalizer_callback(item, item_schema))
                      except ValueError:
                          pass
                  return normalized_list
                  
        return value

    def normalize_file_input(self, value: Any, rules: Dict[str, Any]) -> Optional[str]:
        if not value or not isinstance(value, str):
             return None
        # Basic pass-through validation
        return value
