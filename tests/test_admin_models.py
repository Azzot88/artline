import pytest
from httpx import AsyncClient
from sqlalchemy import select
from app.models import User, AIModel
from app.core.config import settings

# Helper to create admin user
async def create_admin_user(db_session):
    result = await db_session.execute(select(User).where(User.email == "admin@test.com"))
    user = result.scalar_one_or_none()
    if not user:
        from app.core.security import get_password_hash
        user = User(
            email="admin@test.com",
            hashed_password=get_password_hash("password"),
            is_admin=True
        )
        db_session.add(user)
        await db_session.commit()
    return user

@pytest.mark.asyncio
async def test_admin_models_list_access(client: AsyncClient, db_session):
    # 1. Create Admin
    await create_admin_user(db_session)
    
    # 2. Login
    login_data = {"username": "admin@test.com", "password": "password"}
    response = await client.post("/auth/token", data=login_data)
    assert response.status_code == 302
    
    # 3. Access Models Page
    response = await client.get("/admin/models/")
    assert response.status_code == 200
    assert "AI Models" in response.text
    assert "id=\"modelList\"" in response.text

@pytest.mark.asyncio
async def test_add_model_flow(client: AsyncClient, db_session, monkeypatch):
    # Mock Replicate Service
    class MockClient:
        async def fetch_model_schema(self, ref):
            return {
                "version_id": "test-version-hash",
                "schema": {"components": {"schemas": {"Input": {"properties": {"prompt": {}, "image": {}}}}}}
            }
            
    # Patched dependency
    from app.web.routers import admin_models
    import app.web.routers.admin_models
    
    async def mock_get_client(db):
        return MockClient()
        
    monkeypatch.setattr(admin_models, "get_replicate_client", mock_get_client)

    # Login
    await create_admin_user(db_session)
    await client.post("/auth/token", data={"username": "admin@test.com", "password": "password"})
    
    # Add Model
    response = await client.post("/admin/models/add", data={"model_ref": "test/model"})
    
    # Verify Redirect to List with selected param
    assert response.status_code == 302
    assert "/admin/models/?selected=" in response.headers["location"]
    
    # Verify DB
    model_id = response.headers["location"].split("=")[1]
    result = await db_session.execute(select(AIModel).where(AIModel.model_ref == "test/model"))
    model = result.scalar_one_or_none()
    assert model is not None
    assert str(model.id) == model_id
    assert model.version_id == "test-version-hash"

@pytest.mark.asyncio
async def test_legacy_route_redirect(client: AsyncClient, db_session):
    # Login
    await create_admin_user(db_session)
    await client.post("/auth/token", data={"username": "admin@test.com", "password": "password"})

    # Create dummy model
    import uuid
    dummy_id = uuid.uuid4()
    model = AIModel(
        id=dummy_id,
        model_ref="dummy/test",
        display_name="Dummy", 
        provider="replicate",
        is_active=True
    )
    db_session.add(model)
    await db_session.commit()
    
    # Access legacy route
    response = await client.get(f"/admin/models/{dummy_id}")
    assert response.status_code == 302
    assert f"/admin/models/?selected={dummy_id}" in response.headers["location"]
