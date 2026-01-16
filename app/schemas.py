from pydantic import BaseModel, EmailStr, ConfigDict
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
    
    # Metadata
    input_type: str = "text"
    input_image_url: Optional[str] = None
    format: str = "square"
    resolution: str = "1080"
    duration: Optional[int] = None
    credits_spent: int = 0
    
    # Social
    is_public: bool = False
    is_curated: bool = False
    likes: int = 0
    views: int = 0
    
    created_at: datetime
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

# Ledger/Balance
class BalanceRead(BaseModel):
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
    name: str # internal slug
    display_name: str
    provider: str
    model_ref: str # replicate ref
    version_id: Optional[str] = None
    
    type: str # image/video
    credits: int
    is_active: bool
    is_pro: bool
    
    cover_image_url: Optional[str] = None
    
    # Advanced
    capabilities: list[str] = []
    ui_config: Optional[dict] = None
    
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class AIModelCreate(BaseModel):
    name: str 
    display_name: str
    provider: str
    model_ref: str
    version_id: Optional[str] = None
    type: str = "image"
    credits: int = 5
    is_active: bool = True
    is_pro: bool = False
    cover_image_url: Optional[str] = None
    capabilities: list[str] = []
    # ui_config, cost_config etc can be added later or via update

class AIModelUpdate(BaseModel):
    display_name: Optional[str] = None
    model_ref: Optional[str] = None
    version_id: Optional[str] = None
    credits: Optional[int] = None
    is_active: Optional[bool] = None
    is_pro: Optional[bool] = None
    cover_image_url: Optional[str] = None
    capabilities: Optional[list[str]] = None
    ui_config: Optional[dict] = None
    normalized_caps_json: Optional[dict] = None # For syncing schema
    cost_config_json: Optional[dict] = None
