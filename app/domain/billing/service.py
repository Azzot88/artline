from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.domain.billing.models import LedgerEntry
from app.domain.users.models import User
import uuid

async def get_user_balance(db: AsyncSession, user_id: uuid.UUID) -> int:
    result = await db.execute(
        select(func.sum(LedgerEntry.amount)).where(LedgerEntry.user_id == user_id)
    )
    balance = result.scalar()
    return balance if balance else 0

async def add_ledger_entry(
    db: AsyncSession, 
    user_id: uuid.UUID, 
    amount: int, 
    reason: str, 
    external_id: str | None = None
) -> LedgerEntry:
    entry = LedgerEntry(
        user_id=user_id,
        amount=amount,
        reason=reason,
        external_id=external_id,
        currency="credits"
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry
