
import uuid
import datetime
from typing import TYPE_CHECKING
from sqlalchemy import String, Integer, DateTime, ForeignKey, Text, JSON, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.core.db import Base

if TYPE_CHECKING:
    from app.domain.users.models import User

class Job(Base):
    __tablename__ = "jobs"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Ownership: either user_id or guest_id should be present
    user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    guest_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("guest_profiles.id"), nullable=True, index=True)
    
    owner_type: Mapped[str] = mapped_column(String, default="user") # "user" | "guest"
    expires_at: Mapped[datetime.datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    kind: Mapped[str] = mapped_column(String, nullable=False)  # "image" | "video"
    prompt: Mapped[str] = mapped_column(Text, nullable=False)
    provider: Mapped[str] = mapped_column(String, default="mock")
    model_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("ai_models.id"), nullable=True)
    provider_job_id: Mapped[str | None] = mapped_column(String, index=True, nullable=True)
    
    # Input Metadata
    input_type: Mapped[str] = mapped_column(String, default="text") # text | image
    input_image_url: Mapped[str | None] = mapped_column(String, nullable=True)
    
    # Generation Params
    format: Mapped[str] = mapped_column(String, default="square")
    resolution: Mapped[str] = mapped_column(String, default="1080")
    duration: Mapped[int | None] = mapped_column(Integer, nullable=True)
    generation_params: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    
    status: Mapped[str] = mapped_column(String, default="queued", index=True) # "queued", "running", "succeeded", "failed"
    cost_credits: Mapped[int] = mapped_column(Integer, default=0)
    progress: Mapped[int] = mapped_column(Integer, default=0)
    
    # Gallery & Curation
    # Gallery & Curation
    is_public: Mapped[bool] = mapped_column(default=False, index=True)
    is_curated: Mapped[bool] = mapped_column(default=False, index=True)
    likes: Mapped[int] = mapped_column(Integer, default=0)
    views: Mapped[int] = mapped_column(Integer, default=0)
    
    result_url: Mapped[str | None] = mapped_column(String, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    logs: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=True)
    completed_at: Mapped[datetime.datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    
    @property
    def credits_spent(self) -> int:
        return self.cost_credits

    user: Mapped["User"] = relationship("app.domain.users.models.User", back_populates="jobs")
