from pydantic import BaseModel, EmailStr, ConfigDict, Field
from typing import Optional
from datetime import datetime
import uuid

# User Schemas
class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserRead(BaseModel):
    id: uuid.UUID
    email: EmailStr
    username: Optional[str] = None
    avatar_url: Optional[str] = None
    balance: int
    is_admin: bool = False
    language: str = "ru"
    total_generations: int = 0
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str

# Job Schemas
class JobCreate(BaseModel):
    kind: str  # "image" or "video"
    prompt: str

class JobRead(BaseModel):
    id: str
    kind: str
    prompt: str
    status: str
    progress: int
    result_url: Optional[str] = None
    logs: Optional[str] = None
    
    # Metadata
    model_id: Optional[uuid.UUID] = None
    cost_credits: int = 0

    input_type: str = "text"
    input_image_url: Optional[str] = None
    format: str = "square"
    resolution: str = "1080"
    width: Optional[int] = None
    height: Optional[int] = None
    duration: Optional[int] = None
    cover_image_url: Optional[str] = None
    credits_spent: int = 0
    
    # Social
    is_public: bool = False
    is_curated: bool = False
    likes: int = 0
    views: int = 0
    
    created_at: datetime
    completed_at: Optional[datetime] = None
    
    # Performance
    predict_time: Optional[float] = None
    provider_cost: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)

class ModelPerformanceStats(BaseModel):
    avg_predict_time_24h: Optional[float] = None
    avg_predict_time_7d: Optional[float] = None
    total_runs_24h: int = 0
    total_runs_7d: int = 0
    est_cost_per_run: Optional[float] = None # Calculated average cost

# Ledger/Balance
class BalanceRead(BaseModel):
    amount: int


# Admin Schemas
class AdminStats(BaseModel):
    total_users: int
    total_jobs: int
    active_jobs: int
    total_credits: int
    
    # Global Performance
    avg_predict_time_24h: Optional[float] = None
    est_cost_24h: Optional[float] = None
    
    # Breakdown
    breakdown: Optional[dict[str, dict]] = None 
    # { "image": { "count": 10, "avg_time": 5.5, "cost": 0.1 }, ... }

class TypeStats(BaseModel):
    label: str
    count: int
    avg_time: float
    total_cost: float

class UserWithBalance(UserRead):
    balance: int
    is_admin: bool

class CreditGrantRequest(BaseModel):
    amount: int


# SPA Schemas
class UserContext(BaseModel):
    user: Optional[UserRead] = None
    is_guest: bool
    balance: int
    guest_id: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)

class JobRequestSPA(BaseModel):
    model_id: str
    prompt: str
    params: dict = {}
    kind: str = "image"

    model_config = ConfigDict(protected_namespaces=())


# Provider Schemas
class ProviderRead(BaseModel):
    provider_id: str
    env_vars: Optional[dict] = None
    is_active: bool
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class ProviderCreate(BaseModel):
    provider_id: str
    api_key: str  # Plaintext, will be encrypted
    env_vars: Optional[dict] = {}

class ProviderUpdate(BaseModel):
    api_key: Optional[str] = None
    env_vars: Optional[dict] = None
    is_active: Optional[bool] = None

# AI Model Schemas
class AIModelRead(BaseModel):
    id: uuid.UUID
    # Return display_name as name for frontend compatibility
    name: str = Field(validation_alias="display_name")
    
    display_name: str
    description: Optional[str] = None
    provider: str
    model_ref: str # replicate ref
    version_id: Optional[str] = None
    
    type: str # image/video
    credits_per_generation: int
    is_active: bool
    
    cover_image_url: Optional[str] = None
    
    # Advanced
    capabilities: Optional[list[str]] = []
    ui_config: Optional[dict] = None
    
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True, populate_by_name=True, protected_namespaces=())

class AIModelCreate(BaseModel):
    # 'name' in request is mapped to display_name (or just use display_name)
    display_name: Optional[str] = None
    description: Optional[str] = None
    
    provider: str
    model_ref: str
    version_id: Optional[str] = None
    
    type: str = "image" # Default to image
    credits_per_generation: int = 5
    is_active: bool = True
    
    cover_image_url: Optional[str] = None
    capabilities: list[str] = []

    model_config = ConfigDict(protected_namespaces=())

class AIModelUpdate(BaseModel):
    display_name: Optional[str] = None
    description: Optional[str] = None
    model_ref: Optional[str] = None
    version_id: Optional[str] = None
    credits_per_generation: Optional[int] = None
    is_active: Optional[bool] = None
    
    cover_image_url: Optional[str] = None
    capabilities: Optional[list[str]] = None
    ui_config: Optional[dict] = None
    normalized_caps_json: Optional[dict] = None 
    cost_config_json: Optional[dict] = None

    model_config = ConfigDict(protected_namespaces=())

class ModelSchemaRequest(BaseModel):
    model_ref: str # owner/name or owner/name:version

    model_config = ConfigDict(protected_namespaces=())
