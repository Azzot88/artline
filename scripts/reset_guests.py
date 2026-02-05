import asyncio
import sys
import os

# Add root to path so we can import app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.db import AsyncSessionLocal
from app.domain.users.guest_models import GuestProfile
from sqlalchemy import update

async def reset_balances():
    async with AsyncSessionLocal() as db:
        try:
            print("Resetting all guest balances to 25...")
            stmt = update(GuestProfile).values(balance=25)
            result = await db.execute(stmt)
            await db.commit()
            print(f"Successfully reset {result.rowcount} guest profiles.")
        except Exception as e:
            print(f"Error resetting balances: {e}")
            await db.rollback()

if __name__ == "__main__":
    asyncio.run(reset_balances())
