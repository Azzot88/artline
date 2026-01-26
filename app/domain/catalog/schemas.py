
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

class ModelUISpec(BaseModel):
    model_id: str
    groups: List[ParameterGroup]
    parameters: List[UIParameter]
    
    model_config = ConfigDict(protected_namespaces=())
