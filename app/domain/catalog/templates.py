from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from datetime import datetime
import uuid

class NormalizationTemplate(BaseModel):
    id: str
    name: str # e.g. "SDXL Standard"
    description: Optional[str] = None
    config: Dict[str, Any] # The ui_config dictionary
    created_at: datetime = datetime.utcnow()
    
class TemplateCreate(BaseModel):
    name: str
    description: Optional[str] = None
    config: Dict[str, Any]

class TemplateRead(BaseModel):
    id: str
    name: str
    description: Optional[str]
    config_summary: int # Count of rules
    created_at: datetime
