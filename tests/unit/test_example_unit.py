
import pytest
from app.models import User
from app.core.security import get_password_hash, verify_password

@pytest.mark.unit
def test_user_password_hashing():
    """
    Unit test to verify password hashing logic independent of database.
    """
    password = "securepassword123"
    hashed = get_password_hash(password)
    
    assert verify_password(password, hashed)
    assert not verify_password("wrongpassword", hashed)
    assert hashed != password

@pytest.mark.unit
def test_user_model_initialization():
    """
    Test basic model initialization.
    """
    user = User(email="test@example.com", is_active=True)
    assert user.email == "test@example.com"
    assert user.is_active is True
