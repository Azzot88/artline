
import uuid
import datetime
from typing import TYPE_CHECKING
from sqlalchemy import String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.core.db import Base

if TYPE_CHECKING:
    from app.domain.users.models import User

class LedgerEntry(Base):
    __tablename__ = "ledger_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    amount: Mapped[int] = mapped_column(Integer, nullable=False)  # Positive for topup, negative for spend
    currency: Mapped[str] = mapped_column(String, default="credits")
    reason: Mapped[str] = mapped_column(String, nullable=False)  # "topup", "job_cost", "refund"
    external_id: Mapped[str | None] = mapped_column(String, nullable=True)  # Payment provider ID
    
    related_job_id: Mapped[str | None] = mapped_column(ForeignKey("jobs.id"), nullable=True)
    
    # Money Tracking
    payment_amount: Mapped[int | None] = mapped_column(Integer, nullable=True) # In cents
    payment_currency: Mapped[str] = mapped_column(String, default="USD")
    balance_before: Mapped[int | None] = mapped_column(Integer, nullable=True)
    balance_after: Mapped[int | None] = mapped_column(Integer, nullable=True)
    
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship("User", back_populates="ledger_entries")
