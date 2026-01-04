
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from typing import AsyncGenerator

# Override settings for test
import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ["POSTGRES_DB"] = "artline_test" 
# Note: Ideally usage of testcontainer or separate DB. 
# For now, assuming local DB or mocking. 
# Better: Use SQLite for unit logic or Mock.
# But application uses Postgres specific types (JSON, UUID)?
# SQLite handles UUID/JSON reasonably well with SQLAlchemy.

from app.core.config import settings
from app.core.db import Base, get_db
from app.main import app as fastapi_app
import app.models # Ensure models are loaded

# Use in-memory SQLite for speed and isolation if possible, 
# but models use specific PG types maybe? 
# AIModel uses JSON. 
# Let's try mocking get_db or using a test database URL if provided.
# settings.SQLALCHEMY_DATABASE_URI will be used.

@pytest_asyncio.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    # Pass connection to ensure rollback
    # Create engine logic duplication?
    engine = create_async_engine(settings.SQLALCHEMY_DATABASE_URI, echo=False)
    
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
        
    connection = await engine.connect()
    transaction = await connection.begin()
    
    session_maker = async_sessionmaker(bind=connection, class_=AsyncSession, expire_on_commit=False)
    session = session_maker()
    
    yield session
    
    await session.close()
    await transaction.rollback()
    await connection.close()

@pytest_asyncio.fixture
async def client(db_session) -> AsyncGenerator[AsyncClient, None]:
    async def override_get_db():
        yield db_session
        
    fastapi_app.dependency_overrides[get_db] = override_get_db
    
    async with AsyncClient(transport=ASGITransport(app=fastapi_app), base_url="http://test") as ac:
        yield ac
    
    fastapi_app.dependency_overrides.clear()
