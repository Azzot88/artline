from typing import Any, Dict, Optional, List

class ResponseNormalizerBase:
    """
    Shared logic for response normalization. 
    Can be used by provider specific implementations to reduce boilerplate.
    """

    def map_status(self, provider_status: str, status_map: Dict[str, str]) -> str:
        """
        Maps provider specific status string to internal JobStatus.
        Default mapping: queued, running, succeeded, failed.
        """
        return status_map.get(provider_status.lower(), "queued")

    def extract_result_urls(self, output: Any) -> List[str]:
        """
        Safely extracts a list of result URLs from a varied output (str, list, dict).
        """
        if not output:
            return []
            
        if isinstance(output, str):
            return [output]
            
        if isinstance(output, list):
            # Filter strings
            return [str(x) for x in output if x]
            
        if isinstance(output, dict):
            # Try to find common keys? Or just values?
            # Replicate strictly uses list or string usually, but custom could be dict
            return [str(v) for v in output.values() if isinstance(v, str)]
            
        return []

    def infer_kind_from_url(self, url: str) -> str:
        """
        Infers job kind (image, video, audio) from file extension.
        """
        if not url: return "image"
        
        lower = url.lower()
        if any(x in lower for x in [".mp4", ".mov", ".webm", ".mkv"]):
            return "video"
        if any(x in lower for x in [".mp3", ".wav", ".ogg", ".flac"]):
            return "audio"
            
        return "image"
