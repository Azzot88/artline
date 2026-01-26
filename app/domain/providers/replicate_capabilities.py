from typing import Any, List, Dict
import re
from app.domain.catalog.schemas import UIParameter, ParameterOption

class ReplicateCapabilitiesService:
    """
    Parses Replicate OpenAI Schemas to derive UI capabilities (Modes, Resolutions, Durations).
    """
    
    def to_canonical(self, input_schema: Dict[str, Any], defaults: Dict[str, Any] = None) -> List[UIParameter]:
        """
        Converts raw Replicate schema into a list of Canonical UIParameters.
        """
        params = []
        props = input_schema
        
        # Priority mapping for ordering
        # Core params first
        priority = ["prompt", "aspect_ratio", "width", "height", "output_quality", "num_outputs", "num_inference_steps", "guidance_scale", "seed"]
        
        # Sort keys by priority then alpha
        keys = sorted(props.keys(), key=lambda k: (priority.index(k) if k in priority else 999, k))

        for key in keys:
            details = props[key]
            
            # Skip hidden/blacklisted params
            if key in ["scheduler", "refine"]: # Example blacklist, maybe configurable? 
                 # For now, include scheduler as advanced
                 pass
            
            p_type = "text"
            options = None
            
            # Determine Type
            raw_type = details.get("type")
            
            if "enum" in details:
                p_type = "select"
                # Build options
                options = [
                    ParameterOption(label=str(val).title().replace("_", " "), value=val)
                    for val in details["enum"]
                ]
            # Handle anyOf / oneOf (common in newer schemas)
            elif "anyOf" in details or "oneOf" in details or "allOf" in details:
                # Aggregate schemas from all possible combinators
                schemas = []
                if "anyOf" in details: schemas.extend(details["anyOf"])
                if "oneOf" in details: schemas.extend(details["oneOf"])
                if "allOf" in details: schemas.extend(details["allOf"])

                # Look for const/enum inside schema list
                 # Example: [{"type": "string", "enum": ["a", "b"]}, {"type": "null"}]
                found_enum = []
                for s in schemas:
                    if "enum" in s:
                        found_enum.extend(s["enum"])
                    elif "const" in s:
                         found_enum.append(s["const"])
                
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
