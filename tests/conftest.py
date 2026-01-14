
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from typing import AsyncGenerator
import os
import sys

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ["POSTGRES_DB"] = "artline_test"

from app.core.config import settings
from app.core.db import Base, get_db
from app.main import app as fastapi_app
# Models must be imported to register with Base
import app.models  
import app.domain.users.models
import app.domain.billing.models

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

@pytest_asyncio.fixture
async def admin_user(db_session) -> "User":
    from app.models import User
    from app.core.security import get_password_hash
    from app.domain.billing.models import LedgerEntry
    
    user = User(
        email="admin@test.com",
        hashed_password=get_password_hash("password"),
        is_admin=True
        # removed is_active and balance as they are not in User model
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    
    # Add initial balance
    entry = LedgerEntry(
        user_id=user.id,
        amount=1000,
        reason="initial_test_balance",
        currency="credits"
    )
    db_session.add(entry)
    await db_session.commit()
    
    return user
