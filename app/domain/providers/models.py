
import uuid
import datetime
from sqlalchemy import String, Integer, DateTime, Text, Boolean, JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func
from app.core.db import Base

class ProviderConfig(Base):
    __tablename__ = "provider_configs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    provider_id: Mapped[str] = mapped_column(String, nullable=False) # e.g. "openai", "stability"
    name: Mapped[str] = mapped_column(String, nullable=True) # User defined alias "My OpenAI"
    encrypted_api_key: Mapped[str] = mapped_column(String, nullable=False)
    
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    status: Mapped[str] = mapped_column(String, default="not_tested") # "valid", "invalid", "not_tested"
    last_tested_at: Mapped[datetime.datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), onupdate=func.now(), nullable=True)


class AIModel(Base):
    __tablename__ = "ai_models"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    display_name: Mapped[str] = mapped_column(String, nullable=False)
    provider: Mapped[str] = mapped_column(String, nullable=False) # e.g. "replicate"
    model_ref: Mapped[str] = mapped_column(String, nullable=False) # e.g. "stability-ai/sdxl"
    version_id: Mapped[str] = mapped_column(String, nullable=True)
    
    type: Mapped[str] = mapped_column(String, default="image") # image, video
    
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    # Schemas
    param_schema: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    default_params: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    
    # Capabilities (JSON fields)
    modes: Mapped[list[str] | None] = mapped_column(JSON, nullable=True) # ["text-to-image", "image-to-video", etc]
    resolutions: Mapped[list[str] | None] = mapped_column(JSON, nullable=True) # ["1024x1024", "16:9"]
    durations: Mapped[list[int] | None] = mapped_column(JSON, nullable=True) # [5, 10] (seconds)
    costs: Mapped[dict | None] = mapped_column(JSON, nullable=True) # {"base": 1, "duration_5": 2}

    # UI Config
    ui_config: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    cover_image_url: Mapped[str | None] = mapped_column(String, nullable=True)

    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), onupdate=func.now(), nullable=True)



