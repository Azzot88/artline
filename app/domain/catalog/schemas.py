
from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional, Any, Union, Literal

class ParameterOption(BaseModel):
    label: str
    value: Any
    description: Optional[str] = None
    icon: Optional[str] = None # Lucide icon name or URL

class UIParameter(BaseModel):
    id: str  # Matches the API param name (e.g. "width", "scheduler")
    label: str
    type: Literal["text", "number", "select", "boolean", "slider", "textarea"]
    
    default: Any = None
    
    # Constraints
    required: bool = False
    min: Optional[Union[int, float]] = None
    max: Optional[Union[int, float]] = None
    step: Optional[Union[int, float]] = None
    
    options: Optional[List[ParameterOption]] = None
    
    # UI Hints
    description: Optional[str] = None
    placeholder: Optional[str] = None
    group_id: Optional[str] = "settings" # generic grouping
    hidden: bool = False # If true, never shown (admin override)
    
    model_config = ConfigDict(extra="ignore")

class ParameterGroup(BaseModel):
    id: str
    label: str
    description: Optional[str] = None
    collapsed_by_default: bool = False


class PricingRule(BaseModel):
    id: str  # unique rule id
    param_id: str
    operator: Literal["eq", "neq", "gt", "gte", "lt", "lte", "in", "contains"]
    value: Any
    surcharge: int = 0
    surcharge_percent: float = 0.0
    
    label: Optional[str] = None # Description for the bill, e.g. "High Resolution Fee"

class UIParameterConfig(BaseModel):
    """
    Configuration overlay for a parameter.
    Stored in AIModel.ui_config (keyed by param_id).
    """
    param_id: str
    visible: bool = True
    hidden: bool = False # Legacy compat
    
    # Tiered Access
    # If None or empty, available to all.
    # Otherwise, user must have one of these tiers.
    access_tiers: Optional[List[str]] = ["starter", "pro", "studio"] 
    
    # Input Customization
    label_override: Optional[str] = None
    description_override: Optional[str] = None
    
    # File Input specific
    allowed_file_types: Optional[List[str]] = None # e.g. ["image/png", "application/json"]
    
    # Validation constraints override
    min_override: Optional[Union[int, float]] = None
    max_override: Optional[Union[int, float]] = None
    
    model_config = ConfigDict(extra="ignore")

class ModelUISpec(BaseModel):
    model_id: str
    groups: List[ParameterGroup]
    parameters: List[UIParameter]
    pricing_rules: List[PricingRule] = [] # Exposed rules for frontend estimation if needed
    
    model_config = ConfigDict(protected_namespaces=())
