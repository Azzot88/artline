
import uuid
import datetime
from sqlalchemy import String, Integer, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.core.db import Base

class PricingQuote(Base):
    __tablename__ = "pricing_quotes"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    
    # Context
    job_id: Mapped[str | None] = mapped_column(String, index=True, nullable=True) # Linked after job creation
    model_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("ai_models.id"), nullable=False)
    user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    guest_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("guest_profiles.id"), nullable=True)
    
    # Financials
    total_credits: Mapped[int] = mapped_column(Integer, nullable=False)
    breakdown: Mapped[dict] = mapped_column(JSON, default={}) # e.g. [{"item": "base", "cost": 10}, {"item": "duration", "cost": 5}]
    
    # Versioning
    policy_version: Mapped[str] = mapped_column(String, default="v1")
    
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
