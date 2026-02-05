
import asyncio
import sys
import os

# Add root folder to sys path
sys.path.append(os.getcwd())

from app.core.db import async_session_maker
from app.domain.users.guest_models import GuestProfile
from sqlalchemy import select, update

async def fix_guest_balances():
    async with async_session_maker() as session:
        # Find guests with 1000 balance (old default)
        query = select(GuestProfile).where(GuestProfile.balance == 1000)
        result = await session.execute(query)
        guests = result.scalars().all()
        
        print(f"Found {len(guests)} guests with 1000 balance.")
        
        if not guests:
            print("No guests to update.")
            return

        # Update them to 25
        stmt = update(GuestProfile).where(GuestProfile.balance == 1000).values(balance=25)
        await session.execute(stmt)
        await session.commit()
        
        print(f"Updated {len(guests)} guests to balance 25.")

if __name__ == "__main__":
    asyncio.run(fix_guest_balances())
