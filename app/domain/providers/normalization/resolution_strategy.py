
from abc import ABC, abstractmethod
from typing import Dict, Any, Tuple

class ResolutionStrategy(ABC):
    """
    Strategy for calculating/overriding width & height based on meta-parameters.
    """
    @abstractmethod
    def apply(self, params: Dict[str, Any], schema_map: Dict[str, Any]) -> Dict[str, Any]:
        pass

class CinemaResolutionStrategy(ResolutionStrategy):
    """
    Applies logic to convert 'orientation' + 'format' into specific 'width'/'height'
    or 'resolution' string, primarily for Flux/SDXL models.
    """
    def apply(self, params: Dict[str, Any], schema_map: Dict[str, Any]) -> Dict[str, Any]:
        # Priority: Native Enum Params > Cinema Logic
        has_native_override = (
            ("aspect_ratio" in params and "aspect_ratio" in schema_map) or
            ("resolution" in params and "resolution" in schema_map)
        )

        if "orientation" in params and not has_native_override:
             orientation = params.get("orientation", "portrait").lower()
             fmt = params.get("format", "standard").lower()
             
             w, h = 1024, 1024 # Default Square Standard
             
             # 1. Resolve Matrix
             if orientation == "square":
                 if fmt == "hd": w, h = 2048, 2048
                 elif fmt == "4k": w, h = 4096, 4096 
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
             if "width" in schema_map: params["width"] = w
             if "height" in schema_map: params["height"] = h
             
             # 3. Synthesize 'resolution' string if model wants that instead
             if "resolution" in schema_map:
                  # Some models want "WxH", others "1024x1024"
                  params["resolution"] = f"{w}x{h}"

        # Legacy Splitter (Keep for safety if someone sends raw resolution string manually)
        elif "resolution" in params and "resolution" not in schema_map:
             if "width" in schema_map and "height" in schema_map:
                  res_str = str(params["resolution"])
                  if "x" in res_str:
                       try:
                            w, h = res_str.split("x")
                            params["width"] = int(w)
                            params["height"] = int(h)
                       except:
                            pass
                            
        return params

class NativeResolutionStrategy(ResolutionStrategy):
    """
    Does not modify resolution, allows native passthrough.
    """
    def apply(self, params: Dict[str, Any], schema_map: Dict[str, Any]) -> Dict[str, Any]:
        return params
