import abc
from typing import Any, Dict, List, Optional, Union
from dataclasses import dataclass
from enum import Enum

@dataclass
class NormalizationSchema:
    """
    Standardized schema definition for normalization.
    """
    inputs: List[Dict[str, Any]]
    defaults: Dict[str, Any]

class RequestNormalizer(abc.ABC):
    """
    Abstract Base Class for Inbound Request Normalization.
    User Input -> Provider API Payload
    """
    
    @abc.abstractmethod
    def normalize(self, input_data: Dict[str, Any], schema: Dict[str, Any]) -> Dict[str, Any]:
        """
        Normalize user input data against a provided schema.
        
        :param input_data: Raw dictionary of user parameters
        :param schema: Schema definition to validate against
        :return: Cleaned and typed dictionary ready for the Provider API
        """
        pass

    @abc.abstractmethod
    def validate(self, input_data: Dict[str, Any], schema: Dict[str, Any]) -> bool:
        """
        Validate input without transforming it.
        """
        pass

class ResponseNormalizer(abc.ABC):
    """
    Abstract Base Class for Outbound Response Normalization.
    Provider API Response -> Frontend/Domain Model
    """
    
    @abc.abstractmethod
    def normalize_job_response(self, raw_response: Dict[str, Any], provider_context: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Normalize a job status/result response from the provider.
        
        :param raw_response: The raw JSON response from the provider API
        :param provider_context: Optional context (e.g. model_id, queue_time)
        :return: Standardized dictionary matching the 'Generation' or 'Job' domain model
        """
        pass

class FieldValidator:
    """
    Shared validation logic.
    """
    @staticmethod
    def is_valid_url(url: str) -> bool:
        return isinstance(url, str) and url.startswith(("http://", "https://"))

    @staticmethod
    def is_valid_base64(data: str) -> bool:
        return isinstance(data, str) and data.startswith("data:")
