
import asyncio
from sqlalchemy import create_engine, text
from app.core.config import settings

def main():
    # Use Sync Engine for simplicity in this script
    print(f"Connecting to: {settings.SQLALCHEMY_DATABASE_URI_SYNC}")
    engine = create_engine(settings.SQLALCHEMY_DATABASE_URI_SYNC)
    
    with engine.begin() as conn:
        print("Resetting alembic_version...")
        try:
            conn.execute(text("DELETE FROM alembic_version"))
            print("Successfully cleared alembic_version table.")
        except Exception as e:
            print(f"Note: {e}")
            print("Proceeding...")

if __name__ == "__main__":
    main()
