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

