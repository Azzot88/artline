from typing import Any, List, Dict, Optional
import re
from app.domain.catalog.schemas import UIParameter, ParameterOption

class ReplicateCapabilitiesService:
    """
    Parses Replicate OpenAI Schemas to derive:
    1. UI capabilities (Modes, Resolutions, Durations)
    2. Strict Normalization Schema (for backend validation)
    """
    
    def generate_strict_schema(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyzes the raw Replicate model data and produces the standardized normalization schema.
        Matches the structure required by ReplicateNormalizer.
        """
        caps = {
            "inputs": [],
            "defaults": {}
        }
        
        # Extract Schema Properties
        latest_version = data.get("latest_version")
        if not latest_version:
            return caps

        schema = latest_version.get("openapi_schema", {})
        
        # Locate Input Properties
        input_component = {}
        if "components" in schema and "schemas" in schema["components"]:
             input_component = schema["components"]["schemas"].get("Input", {})
        elif "properties" in schema:
             input_component = schema
             
        input_props = input_component.get("properties", {})
        required_fields = input_component.get("required", [])
        
        self.root_schema = schema # Context for ref resolution
        
        normalized_inputs = []
        
        for key, details in input_props.items():
            # Resolve Refs/AllOf
            prop = self._resolve_schema(details)
            
            # Basic Field Definition
            field = {
                "name": key,
                "label": prop.get("title", key.replace("_", " ").title()),
                "type": self._map_type_strict(prop, key),
                "required": key in required_fields,
                "default": prop.get("default"),
                "help": prop.get("description", ""),
                "hidden": False
            }
            
            # --- Apply Specific Normalization Rules (Per User Spec) ---
            
            # 1. String Rules
            if field["type"] == "string":
                # User Rule: Limit length (e.g. 2000 for prompt)
                if key == "prompt":
                    field["maxLength"] = 2000
                elif "maxLength" in prop:
                    field["maxLength"] = prop["maxLength"]
                    
                # User Rule: Lowercase needed? (scheduler) - handled in Normalizer logic usually, 
                # but we can flag it here.
                if key == "scheduler":
                    field["format"] = "lowercase"

            # 2. Number Rules (Int/Float)
            if field["type"] in ["integer", "float"]:
                if "minimum" in prop: field["min"] = prop["minimum"]
                if "maximum" in prop: field["max"] = prop["maximum"]
                if "multipleOf" in prop: field["step"] = prop["multipleOf"]
                
                # User Rule: Seed -1 handling
                if key == "seed":
                     # Ensure we allow -1 even if API says min 0
                     current_min = field.get("min", 0)
                     if current_min > -1: field["min"] = -1
                     
            # 3. Enum Handling
            # Use resolved enum
            if "enum" in prop:
                field["type"] = "select" # Enforce select for enums
                field["options"] = prop["enum"]
                
                # User Rule: Scheduler casing?
                # If scheduler, ensure lowercase versions exist or rely on normalizer fuzzy match
                
            # 4. Special Aspect Ratio Handling
            if key == "aspect_ratio":
                field["type"] = "select"
                if "options" not in field:
                     field["options"] = ["1:1", "16:9", "9:16", "3:2", "2:3", "4:5", "5:4"]
            
            normalized_inputs.append(field)
            
            if "default" in prop:
                caps["defaults"][key] = prop["default"]

        caps["inputs"] = normalized_inputs
        return caps

    def _map_type_strict(self, prop: Dict, key: str) -> str:
        """
        Maps OpenAPI types to Strict Internal Types:
        select, integer, float, boolean, string, image, file, list, object
        """
        t = prop.get("type", "string")
        fmt = prop.get("format", "")
        
        if "enum" in prop: return "select"
        
        if t == "integer": return "integer"
        if t == "number": return "float"
        if t == "boolean": return "boolean"
        
        if t == "string":
            if fmt == "uri": return "file"
            if key in ["image", "input_image", "mask", "video", "audio"]: return "file"
            return "string"
            
        if t == "array": return "list"
        if t == "object": return "object"
        
        return "string"

    def to_canonical(self, input_schema: Dict[str, Any], root_schema: Dict[str, Any] = None) -> List[UIParameter]:
        """
        Converts raw Replicate schema into a list of Canonical UIParameters.
        """
        params = []
        props = input_schema
        self.root_schema = root_schema or {}
        
        # Priority mapping for ordering
        # Core params first
        priority = ["prompt", "aspect_ratio", "width", "height", "output_quality", "num_outputs", "num_inference_steps", "guidance_scale", "seed"]
        
        # Sort keys by priority then alpha
        keys = sorted(props.keys(), key=lambda k: (priority.index(k) if k in priority else 999, k))

        for key in keys:
            details = props[key]
            
            # Skip hidden/blacklisted params
            if key in ["scheduler", "refine"]: 
                 pass
            
            # RESOLVE REF / ALLOF
            # If details itself has $ref or allOf, resolve it to get the "real" type/enum
            resolved_details = self._resolve_schema(details) 
            # Merge resolved props back into details for parsing (but keep original overrides like description)
            # We prioritize resolved_details for type/enum, but details for title/default
            
            # Logic: If 'enum' is in resolved, use it.
            effective_enum = details.get("enum") or resolved_details.get("enum")
            effective_type = details.get("type") or resolved_details.get("type")
            raw_type = effective_type

            p_type = "text"
            options = None
            
            if effective_enum:
                p_type = "select"
                # Build options
                options = [
                    ParameterOption(label=str(val).title().replace("_", " "), value=val)
                    for val in effective_enum
                ]
            # Handle anyOf / oneOf (common in newer schemas)
            elif "anyOf" in details or "oneOf" in details or "allOf" in details:
                # Aggregate schemas from all possible combinators
                schemas = []
                if "anyOf" in details: schemas.extend(details["anyOf"])
                if "oneOf" in details: schemas.extend(details["oneOf"])
                # allOf is handled by _resolve_schema mostly, but mixed cases might exist
                
                # Look for const/enum inside schema list
                found_enum = []
                for s in schemas:
                    # Resolve sub-schema too
                    s_res = self._resolve_schema(s)
                    if "enum" in s_res:
                         found_enum.extend(s_res["enum"])
                    elif "const" in s_res:
                         found_enum.append(s_res["const"])
                
                if found_enum:
                    p_type = "select"
                    # Dedupe and Sort (Filter out None/null)
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
                
            # Override for specific keys
            if key == "aspect_ratio":
                p_type = "select"
                
            # Create Param
            param = UIParameter(
                id=key,
                label=details.get("title") or key.replace("_", " ").title(),
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
            
            # If prompt, make it basic and required (usually)
            if key == "prompt":
                param.group_id = "basic"
                param.required = True
                
            params.append(param)
            
        return params

    def parse_capabilities(self, input_schema: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main entry point.
        Input: schema['components']['schemas']['Input']['properties']
        Output: { 'modes': [], 'resolutions': [], 'durations': [], 'defaults': {} }
        """
        props = input_schema
        
        return {
            "modes": self._detect_modes(props),
            "resolutions": self._detect_resolutions(props),
            "durations": self._detect_durations(props),
            "defaults": self._extract_defaults(props)
        }

    def _extract_defaults(self, props: Dict[str, Any], prefix: str = "") -> Dict[str, Any]:
        """
        Recursively extracts defaults, enums, titles, and constraints.
        Results are flattened into a UI-friendly dictionary.
        """
        defaults = {}
        
        for key, details in props.items():
            full_key = f"{prefix}{key}"
            
            # Handle nested objects
            if details.get("type") == "object" and "properties" in details:
                nested = self._extract_defaults(details["properties"], prefix=f"{full_key}.")
                defaults.update(nested)
                continue

            # Capture Default
            if "default" in details:
                val = details["default"]
                if isinstance(val, (str, int, float, bool)) or val is None:
                     defaults[full_key] = val

            # Capture UI Metadata
            # Title/Label
            if "title" in details:
                defaults[f"{full_key}_label"] = details["title"]
            
            # Description
            if "description" in details:
                defaults[f"{full_key}_help"] = details["description"][:200] # Limit length

            # Enums (Select options)
            if "enum" in details:
                defaults[f"{full_key}_options"] = details["enum"]

            # Constraints
            if details.get("type") in ["integer", "number"]:
                if "minimum" in details:
                    defaults[f"{full_key}_min"] = details["minimum"]
                if "maximum" in details:
                    defaults[f"{full_key}_max"] = details["maximum"]
            
            # Always mark as visible if found, unless explicit hidden?
            # We'll handle visibility logic in the UI or simple heuristic here.
            # For now, just dumping the metadata allows the frontend to decide.

        return defaults

    def _detect_modes(self, props: Dict[str, Any]) -> List[str]:
        modes = set()
        
        # 1. Text to Image (Default assumption if prompt exists, but verify)
        if "prompt" in props:
            modes.add("text-to-image")
            
        # 2. Image to Image (Input Image)
        # Check for 'image', 'input_image', 'source_image'
        if any(k in props for k in ["image", "input_image", "source_image", "init_image"]):
            modes.add("image-to-image")
            
        # 3. Video Logic
        # Indicators: 'fps', 'num_frames', 'video_length', 'duration'
        is_video = any(k in props for k in ["fps", "num_frames", "video_length", "duration", "frames"])
        
        if is_video:
            # If it was text-to-image, upgrade to text-to-video
            if "text-to-image" in modes:
                modes.remove("text-to-image")
                modes.add("text-to-video")
            
            # If it was image-to-image, upgrade to image-to-video
            if "image-to-image" in modes:
                modes.remove("image-to-image")
                modes.add("image-to-video")

        return list(modes)

    def _detect_resolutions(self, props: Dict[str, Any]) -> List[str]:
        resolutions = []
        
        # Strategy A: 'aspect_ratio' Enum (Best Case)
        # Often seen in Flux/SDXL models
        ar_prop = props.get("aspect_ratio")
        if ar_prop and "enum" in ar_prop:
            return ar_prop["enum"] # e.g. ["1:1", "16:9"]
            
        # Strategy B: Width/Height Enums
        # If specific sizes are enforced
        w_prop = props.get("width")
        h_prop = props.get("height")
        
        if w_prop and "enum" in w_prop and h_prop and "enum" in h_prop:
             # Just combine? Or return common ones. 
             # For simplicity, if explicitly listed, return square combos or list distinct
             return [f"{w}x{h}" for w, h in zip(w_prop["enum"], h_prop["enum"])] if len(w_prop["enum"]) == len(h_prop["enum"]) else []

        # Strategy C: Standard Buckets for Sliders (Fallback)
        # If range (min/max) allows 1024, suggest standard buckets
        # This is a heuristic.
        w_max = w_prop.get("maximum", 2048) if w_prop else 1024
        
        if w_max >= 1024:
            resolutions = ["1024x1024", "1152x896", "896x1152", "16:9", "9:16"] # Standard SDXL
        elif w_max >= 512:
            resolutions = ["512x512", "768x512", "512x768"] # Standard SD1.5
            
        return resolutions

    def _detect_durations(self, props: Dict[str, Any]) -> List[int]:
        # Look for duration or num_frames
        dur_prop = props.get("duration") or props.get("video_length")
        frames_prop = props.get("num_frames") or props.get("frames")
        fps_prop = props.get("fps")
        
        # 1. Direct Seconds
        if dur_prop:
            if "default" in dur_prop:
                 return [dur_prop["default"]]
            if "maximum" in dur_prop:
                 return [dur_prop["maximum"]] # Return max capability
        
        # 2. Frames to Seconds (Assume 24fps if not found)
        if frames_prop:
            fps = 24
            if fps_prop and "default" in fps_prop:
                fps = fps_prop["default"]
            
            # If enum, convert all
            if "enum" in frames_prop:
                return [int(f / fps) for f in frames_prop["enum"]]
            
            # If range, take max
            if "maximum" in frames_prop:
                return [int(frames_prop["maximum"] / fps)]
                
        return []

    def _resolve_schema(self, schema: Dict[str, Any]) -> Dict[str, Any]:
        """
        Resolves $ref and merges allOf/anyOf schemas to find the effective type/enum.
        """
        if not schema:
            return {}

        # 1. Resolve $ref
        if "$ref" in schema:
            ref = schema["$ref"]
            # Typically "#/components/schemas/Name"
            if ref.startswith("#/"):
                parts = ref.split("/")[1:] # Skip #
                # Walk the root
                current = self.root_schema
                try:
                    for part in parts:
                        current = current.get(part)
                        if not current: break
                    
                    if current:
                         # Recursively resolve the target in case it is also a ref
                         return self._resolve_schema(current)
                except Exception:
                    pass
            return {}

        # 2. Extract from allOf (merge)
        # If allOf exists, we want to find the one that has the enum or type
        if "allOf" in schema:
            merged = {}
            for sub in schema["allOf"]:
                resolved = self._resolve_schema(sub)
                merged.update(resolved)
            
            # Merge local props on top (e.g. default, description)
            # (Use a shadow copy to avoid mutating original schema in memory if re-used)
            # Actually simplest is to just return the resolved enum if found
            if "enum" in merged:
                return merged
            return merged

        return schema
