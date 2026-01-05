
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
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    # Use strings to avoid circular imports at runtime
    ledger_entries: Mapped[list["LedgerEntry"]] = relationship("app.domain.billing.models.LedgerEntry", back_populates="user", cascade="all, delete-orphan")
    jobs: Mapped[list["Job"]] = relationship("app.domain.jobs.models.Job", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User {self.email}>"
