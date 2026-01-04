from typing import Any, List, Dict
import re

class ReplicateCapabilitiesService:
    """
    Parses Replicate OpenAI Schemas to derive UI capabilities (Modes, Resolutions, Durations).
    """

    def parse_capabilities(self, input_schema: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main entry point.
        Input: schema['components']['schemas']['Input']['properties'] (or similar)
        Output: { 'modes': [], 'resolutions': [], 'durations': [] }
        """
        props = input_schema
        
        return {
            "modes": self._detect_modes(props),
            "resolutions": self._detect_resolutions(props),
            "durations": self._detect_durations(props)
        }

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
