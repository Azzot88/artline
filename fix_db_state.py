
import asyncio
from app.core.db import engine
from sqlalchemy import text

async def main():
    async with engine.begin() as conn:
        print("Resetting alembic_version...")
        # Check if table exists first preventing errors if it's already gone/borked
        try:
            await conn.execute(text("DELETE FROM alembic_version"))
            print("Successfully cleared alembic_version table.")
        except Exception as e:
            # If table doesn't exist, that's fine too for our purpose (stamp will create it)
            print(f"Note: {e}")
            print("Proceeding...")

if __name__ == "__main__":
    asyncio.run(main())
