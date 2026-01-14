
import pytest
from app.models import User
from app.core.security import get_password_hash

# Integration tests usually require the 'db_session' fixture
@pytest.mark.integration
@pytest.mark.asyncio
async def test_create_user_db(db_session):
    """
    Integration test: Create a user in the DB and retrieve it.
    """
    email = "integration@test.com"
    user = User(email=email, hashed_password=get_password_hash("pass"))
    
    db_session.add(user)
    await db_session.commit()
    
    # Query back
    # Note: Application might use a Repository, but here we test bare DB interaction for the example
    from sqlalchemy import select
    result = await db_session.execute(select(User).where(User.email == email))
    fetched_user = result.scalar_one_or_none()
    
    assert fetched_user is not None
    assert fetched_user.id is not None
    assert fetched_user.email == email
