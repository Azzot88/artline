
import pytest
from app.models import User

@pytest.mark.asyncio
async def test_dashboard_access_guest(client):
    """Test accessing the dashboard as a guest."""
    response = await client.get("/")
    assert response.status_code == 200
    assert "Guest Mode" in response.text or "Sign In" in response.text

@pytest.mark.asyncio
async def test_dashboard_access_user(client, admin_user):
    """Test accessing the dashboard as a logged-in user."""
    # Login logic or override dependency not needed if we rely on cookie/auth simulation?
    # Better: Use the client to login essentially.
    
    # We can assume client session based auth if we set cookie or login endpoint.
    # Let's use the login endpoint.
    await client.post("/login", data={"email": "admin@test.com", "password": "password"})
    
    response = await client.get("/")
    assert response.status_code == 200
    assert "Top Up" in response.text
    assert "admin@test.com" in response.text or "Logout" in response.text

@pytest.mark.asyncio
async def test_public_pages(client):
    """Test other public pages."""
    pages = ["/login", "/register"]
    for page in pages:
        response = await client.get(page)
        assert response.status_code == 200

@pytest.mark.asyncio
async def test_gallery_partial(client):
    """Test loading gallery partial."""
    response = await client.get("/gallery/page/1")
    assert response.status_code == 200
    # Should contain some gallery indicators or empty message
    # Just asserting 200 proves the template renders without error
