from typing import Any, Dict, List
from app.domain.providers.normalization.base import ResponseNormalizer
from app.domain.providers.normalization.response_normalizer import ResponseNormalizerBase

class ReplicateResponseNormalizer(ResponseNormalizer, ResponseNormalizerBase):
    """
    Replicate specific response normalization.
    """
    
    STATUS_MAP = {
        "starting": "running",
        "processing": "running",
        "succeeded": "succeeded",
        "failed": "failed",
        "canceled": "failed"
    }

    def normalize_job_response(self, raw_response: Dict[str, Any], provider_context: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Maps Replicate API prediction object to internal Job structure.
        """
        if not raw_response:
             return {"status": "failed", "error": "Empty response from Replicate"}

        status = self.map_status(raw_response.get("status", ""), self.STATUS_MAP)
        
        # Extract Output
        output = raw_response.get("output")
        result_urls = self.extract_result_urls(output)
        
        # Primary result (first url)
        result_url = result_urls[0] if result_urls else None
        
        # Metrics
        metrics = raw_response.get("metrics", {})
        duration = metrics.get("predict_time") or 0.0
        
        # Logs
        logs = raw_response.get("logs", "")
        
        # Error
        error = raw_response.get("error")

        return {
            "provider_job_id": raw_response.get("id"),
            "status": status,
            "result_url": result_url,
            "result_urls": result_urls,
            "duration": duration,
            "cost_credits": 0, # Calculator service handles this usually, or we infer
            "logs": logs,
            "error_message": error,
            "meta": {
                "version": raw_response.get("version"),
                "created_at": raw_response.get("created_at"),
                "completed_at": raw_response.get("completed_at")
            }
        }
