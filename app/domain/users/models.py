
import uuid
import datetime
from typing import TYPE_CHECKING
from sqlalchemy import String, Integer, DateTime, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.core.db import Base

if TYPE_CHECKING:
    from app.domain.billing.models import LedgerEntry
    from app.domain.jobs.models import Job

class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String, nullable=False)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Profile
    username: Mapped[str | None] = mapped_column(String, unique=True, nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String, nullable=True)
    language: Mapped[str] = mapped_column(String, default="ru")
    
    # Stats / Cache
    balance: Mapped[int] = mapped_column(Integer, default=0)
    total_generations: Mapped[int] = mapped_column(Integer, default=0)
    total_credits_spent: Mapped[int] = mapped_column(Integer, default=0)
    
    # Email Verification
    is_email_verified: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    email_verification_code: Mapped[str | None] = mapped_column(String(6), nullable=True)
    email_verification_code_expires_at: Mapped[datetime.datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    email_verification_sent_at: Mapped[datetime.datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    email_verification_reminder_3d_sent: Mapped[bool] = mapped_column(Boolean, default=False)
    email_verification_reminder_15d_sent: Mapped[bool] = mapped_column(Boolean, default=False)
    
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    # Use strings to avoid circular imports at runtime
    ledger_entries: Mapped[list["LedgerEntry"]] = relationship("app.domain.billing.models.LedgerEntry", back_populates="user", cascade="all, delete-orphan")
    jobs: Mapped[list["Job"]] = relationship("app.domain.jobs.models.Job", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User {self.email}>"
