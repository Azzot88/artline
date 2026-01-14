import pytest
from httpx import AsyncClient
from app.core.security import create_access_token
import uuid
from app.models import User
from app.core.security import get_password_hash

# Local fixture for this test file since conftest lacks generic user
@pytest.fixture
def test_user_fixture(db_session):
    # This might fail if we can't run async code in sync fixture?
    # pytest-asyncio handles async fixtures.
    pass 
    # Actually, let's make it an async fixture in the test file or use admin_user
    
# Better: Just use admin_user for Auth tests since it is a valid user? 
# Or define async fixture here.

@pytest.fixture
def test_user_token(admin_user):
    # admin_user is async fixture? No, the conftest defines it as async but pytest handles it.
    # Wait, in pytest-asyncio, async fixtures return the value.
    return create_access_token(data={"sub": admin_user.email})

@pytest.mark.asyncio
async def test_api_me_guest(client: AsyncClient, db_session):
    # No cookies -> Should get guest context
    response = await client.get("/api/me")
    assert response.status_code == 200
    data = response.json()
    assert data["is_guest"] is True
    assert data["user"] is None
    assert data["guest_id"] is not None
    assert "balance" in data
    
    # Check Cookie
    assert "guest_id" in response.cookies

@pytest.mark.asyncio
async def test_api_me_user(client: AsyncClient, admin_user, test_user_token):
    # With Auth Cookie
    cookies = {"access_token": f"Bearer {test_user_token}"}
    response = await client.get("/api/me", cookies=cookies)
    assert response.status_code == 200
    data = response.json()
    assert data["is_guest"] is False
    assert data["user"]["email"] == admin_user.email

@pytest.mark.asyncio
async def test_job_lifecycle_json(client: AsyncClient, admin_user, test_user_token):
    cookies = {"access_token": f"Bearer {test_user_token}"}
    
    # A. Invalid Model
    payload = {
        "model_id": str(uuid.uuid4()),
        "prompt": "test",
        "kind": "image"
    }
    res = await client.post("/api/jobs", json=payload, cookies=cookies)
    assert res.status_code == 404
    assert res.json()["detail"] == "Model not found"

@pytest.mark.asyncio
async def test_api_error_format(client: AsyncClient):
    # trigger 404
    res = await client.get("/api/jobs/non-existent-id", cookies={"guest_id": str(uuid.uuid4())})
    assert res.status_code == 404
    assert "detail" in res.json()
