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
    is_public: bool = False
    is_curated: bool = False
    likes: int = 0
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Ledger/Balance
class BalanceRead(BaseModel):
    amount: int
