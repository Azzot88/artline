
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.domain.users.guest_models import GuestProfile

async def get_or_create_guest(db: AsyncSession, guest_id: uuid.UUID | None) -> GuestProfile:
    if guest_id:
        result = await db.execute(select(GuestProfile).where(GuestProfile.id == guest_id))
        guest = result.scalar_one_or_none()
        if guest:
            return guest
            
    # Create new
    new_guest = GuestProfile()
    db.add(new_guest)
    await db.commit()
    await db.refresh(new_guest)
    return new_guest

async def get_guest(db: AsyncSession, guest_id: uuid.UUID) -> GuestProfile | None:
    result = await db.execute(select(GuestProfile).where(GuestProfile.id == guest_id))
    return result.scalar_one_or_none()
