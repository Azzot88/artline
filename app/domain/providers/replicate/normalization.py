import logging
import json
import base64
import re
import os
import uuid
from typing import Any, Dict, List, Optional, Union, Tuple
from pathlib import Path
import tempfile
import requests
from urllib.parse import urlparse

# Optional imports for media processing (handled if missing)
try:
    from PIL import Image
    import numpy as np
except ImportError:
    Image = None
    np = None

try:
    import moviepy.editor as mp
except ImportError:
    mp = None

try:
    import librosa
    import matplotlib.pyplot as plt
except ImportError:
    librosa = None

logger = logging.getLogger(__name__)

class ReplicateNormalizer:
    """
    Central engine for normalizing Replicate API parameters based on OpenAPI schema.
    Enforces strict typing, validates enumerations, and processes media inputs.
    """

    def __init__(self):
        self.download_timeout = 30
        self.max_file_size_mb = 50

    def normalize(self, input_data: Dict[str, Any], schema: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main entry point. Validates and normalizes input_data against the provided schema.
        
        :param input_data: Raw user input dictionary.
        :param schema: Normalized UI schema (from AIModel.normalized_caps_json) AND/OR 
                       raw OpenAPI properties map. We expect a map of {param_name: specific_schema}.
        :return: Cleaned, type-safe dictionary ready for Replicate API.
        """
        cleaned = {}
        
        # Determine if schema is the full caps object or just the properties
        properties = schema.get("inputs", []) if "inputs" in schema else schema
        
        # Convert list-based inputs (our internal format) to dict for easier lookup if needed,
        # but typically 'schema' passed here might be the raw OpenAPI 'properties' dict 
        # OR our normalized 'inputs' list. Let's handle both.
        
        schema_map = {}
        if isinstance(properties, list):
            for item in properties:
                schema_map[item["name"]] = item
        else:
            schema_map = properties # Assume it's already a dict of schemes

        # 1. Iterate over provided inputs
        for key, value in input_data.items():
            if key not in schema_map:
                # If param is not in schema, decide whether to keep or drop.
                # For safety, we usually drop unless it's a known global (like 'prompt' which might be implicit)
                if key == "prompt":
                    cleaned[key] = self._normalize_string(value, {})
                continue

            field_def = schema_map[key]
            
            # 2. Apply Type-Specific Normalization
            try:
                norm_value = self._normalize_field(value, field_def)
                if norm_value is not None:
                    cleaned[key] = norm_value
            except ValueError as e:
                logger.warning(f"Validation failed for {key}: {e}")
                # We can either raise or skip. For now, we skip invalid fields to prevent job failure if possible,
                # or we could set to default.
                pass

        # 3. Apply Defaults for missing required fields (if we implement strict requirement checks)
        # (skipped for now to keep it loose enough for partial updates, but can be added)

        return cleaned

    def _normalize_field(self, value: Any, field_def: Dict[str, Any]) -> Any:
        """
        Dispatches validation based on field type.
        """
        # Our normalized schema uses 'type' (select, integer, number, boolean, string, image)
        # OpenAPI uses 'type' (string, integer, number, boolean, array, object)
        
        ftype = field_def.get("type", "string")
        
        # Handle Enum (Select) first as it applies to multiple types
        if "options" in field_def and field_def["options"] or "enum" in field_def:
             allowed = field_def.get("options") or field_def.get("enum")
             value = self._validate_enum(value, allowed)
             # After enum check, we still might need type coercion (e.g. enum of ints)
        
        if ftype == "integer":
            return self._normalize_int(value, field_def)
        elif ftype == "number" or ftype == "float":
            return self._normalize_float(value, field_def)
        elif ftype == "boolean":
            return self._normalize_bool(value, field_def)
        elif ftype == "image" or ftype == "file":
             return self._process_file_input(value, field_def)
        elif ftype == "list" or ftype == "array":
             return self._normalize_array(value, field_def)
        else:
            return self._normalize_string(value, field_def)

    def _normalize_string(self, value: Any, rules: Dict[str, Any]) -> str:
        if value is None: return ""
        s = str(value).strip()
        
        # Length limit
        max_len = rules.get("maxLength", 25000) # Replicate usually generous, but let's cap
        if len(s) > max_len:
            s = s[:max_len]
            
        # Lowercase if requested (implicit in some schedulers, but usually explicit in schema)
        # if rules.get("format") == "lowercase": s = s.lower()
        
        return s

    def _normalize_int(self, value: Any, rules: Dict[str, Any]) -> int:
        try:
            val = int(float(value)) # Handle "50.0" strings
        except (ValueError, TypeError):
            if rules.get("default") is not None:
                return int(rules["default"])
            raise ValueError(f"Invalid integer: {value}")
            
        # Clamping
        min_val = rules.get("min") or rules.get("minimum")
        max_val = rules.get("max") or rules.get("maximum")
        
        if min_val is not None: val = max(int(min_val), val)
        if max_val is not None: val = min(int(max_val), val)
        
        # Multiple Of (Step)
        step = rules.get("step") or rules.get("multipleOf")
        if step:
            # Round to nearest step
            # e.g. val=512, step=8 -> 512
            # val=515, step=8 -> 512 or 520
            val = round(val / step) * step
            
        return val

    def _normalize_float(self, value: Any, rules: Dict[str, Any]) -> float:
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
        
        return round(val, 5) # Reasonable precision

    def _normalize_bool(self, value: Any, rules: Dict[str, Any]) -> bool:
        if isinstance(value, bool): return value
        if isinstance(value, str):
            lower = value.lower()
            if lower in ("true", "1", "yes", "on"): return True
            if lower in ("false", "0", "no", "off"): return False
        if isinstance(value, int):
            return bool(value)
            
        # Fallback
        if rules.get("default") is not None:
            return bool(rules["default"])
        return False

    def _validate_enum(self, value: Any, allowed: List[Any]) -> Any:
        # Strict check?
        # Try to match stringified versions
        if value in allowed: return value
        
        str_allowed = [str(a) for a in allowed]
        if str(value) in str_allowed:
            # Return the original typed value from allowed list
            idx = str_allowed.index(str(value))
            return allowed[idx]
            
        # If strict, raise. If loose, define heuristic.
        # Check casing
        if isinstance(value, str):
             lower_map = {str(a).lower(): a for a in allowed}
             if value.lower() in lower_map:
                 return lower_map[value.lower()]
                 
        raise ValueError(f"Value '{value}' not in allowed options: {allowed}")

    def _normalize_array(self, value: Any, rules: Dict[str, Any]) -> List[Any]:
        if isinstance(value, str):
            # Try to parse JSON array ? or comma separated?
            if value.startswith("["):
                 try: value = json.loads(value)
                 except: pass
            else:
                 # Treat as single item?
                 value = [value]
                 
        if not isinstance(value, list):
            value = [value]
            
        # Validate items if 'items' schema exists
        item_schema = rules.get("items") or rules.get("item_schema")
        if item_schema:
             normalized_list = []
             for item in value:
                 try:
                     normalized_list.append(self._normalize_field(item, item_schema))
                 except ValueError:
                     pass
             return normalized_list
             
        return value

    def _process_file_input(self, value: Any, rules: Dict[str, Any]) -> str:
        """
        Handles URL validation, Base64 checks, and optionally media processing.
        """
        if not value or not isinstance(value, str):
             return None
             
        # 1. Check if URL
        if value.startswith("http"):
             # TODO: Validate URL reachability?
             return value
             
        # 2. Check if Base64 (Data URI)
        if value.startswith("data:"):
             return value # Valid for Replicate
             
        # 3. If it's a raw base64 string without header, fix it?
        # (Replicate usually requires data uri or http url)
        
        return value


    # --- Media Processing (The "Worker" Aspect) ---
    
    def generate_video_thumbnail(self, video_url: str) -> Optional[str]:
        """
        Downloads video, extracts middle frame, saves/uploads, returns URL.
        """
        if not mp or not np:
             logger.warning("MoviePy/Numpy not available for thumbnail generation")
             return None
             
        try:
             with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp_vid:
                 self._download_file(video_url, tmp_vid.name)
                 
                 clip = mp.VideoFileClip(tmp_vid.name)
                 duration = clip.duration
                 frame_time = duration / 2.0
                 
                 # Extract frame
                 frame = clip.get_frame(frame_time) # Numpy array
                 
                 # Save frame
                 if Image:
                     img = Image.fromarray(frame)
                     out_path = tmp_vid.name + "_thumb.jpg"
                     img.save(out_path, quality=85)
                     
                     # Result: For now, return file path or mock S3 upload
                     # In real prod, this would optimize to S3
                     return self._mock_upload(out_path)
                     
        except Exception as e:
            logger.error(f"Thumbnail generation failed: {e}")
            return None
            
    def generate_audio_waveform(self, audio_url: str) -> Optional[str]:
        """
        Generates waveform image from audio.
        """
        if not librosa or not np or not Image:
             logger.warning("Librosa unavailable")
             return None
             
        try:
            with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp_audio:
                 self._download_file(audio_url, tmp_audio.name)
                 
                 y, sr = librosa.load(tmp_audio.name, duration=30)
                 
                 import matplotlib
                 matplotlib.use('Agg') # Non-interactive backend
                 
                 plt.figure(figsize=(10, 2))
                 librosa.display.waveshow(y, sr=sr, color="blue")
                 plt.axis('off')
                 plt.tight_layout()
                 
                 out_path = tmp_audio.name + "_wave.png"
                 plt.savefig(out_path, transparent=True)
                 plt.close()
                 
                 return self._mock_upload(out_path)
                 
        except Exception as e:
            logger.error(f"Waveform generation failed: {e}")
            return None

    def _download_file(self, url: str, target_path: str):
        with requests.get(url, stream=True, timeout=self.download_timeout) as r:
            r.raise_for_status()
            with open(target_path, 'wb') as f:
                for chunk in r.iter_content(chunk_size=8192):
                    f.write(chunk)

    def _mock_upload(self, file_path: str) -> str:
        # In a real scenario, upload to S3 here.
        # For now, we assume the worker shares a volume or we just return a "file://"
        # But to be robust for the "Capabilities Page" request, let's keep it simple.
        return f"file://{file_path}"
