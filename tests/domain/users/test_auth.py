
import pytest
from app.core.security import get_password_hash, verify_password
from app.models import User
import uuid

def test_hashing():
    pwd = "secret-password"
    hashed = get_password_hash(pwd)
    assert hashed != pwd
    assert verify_password(pwd, hashed)
    assert not verify_password("wrong", hashed)

@pytest.mark.asyncio
async def test_create_user(db_session):
    email = f"user_{uuid.uuid4()}@example.com"
    user = User(email=email, hashed_password="mock")
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    
    assert user.id is not None
    assert user.email == email
