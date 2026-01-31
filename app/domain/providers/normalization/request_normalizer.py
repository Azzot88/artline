import logging
import json
from typing import Any, Dict, List, Optional, Union
from typing import get_type_hints

logger = logging.getLogger(__name__)

class RequestNormalizerAuth:
    """
    Shared utilities for normalizing request inputs.
    Intended to be used by provider-specific RequestNormalizer implementations via composition or inheritance.
    """

    def normalize_string(self, value: Any, rules: Dict[str, Any]) -> str:
        if value is None: return ""
        s = str(value).strip()
        
        max_len = rules.get("maxLength")
        if max_len and len(s) > max_len:
            s = s[:max_len]
            
        return s

    def normalize_integer(self, value: Any, rules: Dict[str, Any]) -> int:
        try:
            val = int(float(value))
        except (ValueError, TypeError):
            if rules.get("default") is not None:
                return int(rules["default"])
            raise ValueError(f"Invalid integer: {value}")
            
        min_val = rules.get("min") or rules.get("minimum")
        max_val = rules.get("max") or rules.get("maximum")
        
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
        if value in allowed: return value
        
        str_allowed = [str(a) for a in allowed]
        if str(value) in str_allowed:
            idx = str_allowed.index(str(value))
            return allowed[idx]
            
        # Loose check (case insensitive)
        if isinstance(value, str):
             lower_map = {str(a).lower(): a for a in allowed}
             if value.lower() in lower_map:
                 return lower_map[value.lower()]
                 
        raise ValueError(f"Value '{value}' not in allowed options: {allowed}")

    def normalize_array(self, value: Any, rules: Dict[str, Any], item_normalizer_callback=None) -> List[Any]:
        if isinstance(value, str):
            if value.startswith("["):
                 try: value = json.loads(value)
                 except: pass
            else:
                 value = [value]
                 
        if not isinstance(value, list):
            value = [value]
            
        # If passed a callback to normalize items (e.g. to recurse), use it
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
        # Basic pass-through validation, strict logic can be added in MediaProcessor
        return value
