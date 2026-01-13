import pytest
import uuid
from httpx import AsyncClient
from app.main import app
from app.domain.providers.models import AIModel

# Helper to log in (since client fixture is unauthenticated)
async def login_admin(client: AsyncClient, admin_user):
    # admin_user fixture creates user with password "password"
    resp = await client.post("/api/auth/login", json={
        "email": admin_user.email,
        "password": "password"
    })
    assert resp.status_code == 200

# Fixture to seed a model
@pytest.fixture
async def seed_model(db_session):
    model_id = uuid.uuid4()
    model = AIModel(
        id=model_id,
        name="test-model-flux",
        display_name="Flux Pro Test",
        provider="replicate",
        model_ref="black-forest-labs/flux-pro",
        version_id="123",
        is_active=True,
        normalized_caps_json={
            "inputs": [],
            "defaults": {}
        }
    )
    db_session.add(model)
    await db_session.commit()
    return model

# Emulates the call made by UserProvider
@pytest.mark.asyncio
async def test_frontend_user_provider_contract(client: AsyncClient, admin_user):
    """
    Verify /api/me returns the structure expected by UserProvider.
    Expected: { user: {...}, balance: int, is_guest: bool }
    """
    # Authenticate to get non-guest response
    await login_admin(client, admin_user)

    response = await client.get("/api/me")
    assert response.status_code == 200
    data = response.json()
    
    # Check fields required by user-provider.tsx
    assert "user" in data
    assert "balance" in data
    assert "is_guest" in data
    assert data["is_guest"] is False
    
    # Check user object fields
    user = data["user"]
    assert user is not None
    assert "email" in user
    assert "id" in user


# Emulates the call made by useModels / ModelSelector
@pytest.mark.asyncio
async def test_frontend_models_contract(client: AsyncClient, seed_model):
    """
    Verify /api/models returns list of models for ModelSelector.
    """
    response = await client.get("/api/models")
    assert response.status_code == 200
    data = response.json()
    
    assert isinstance(data, list)
    assert len(data) > 0
    model = data[0]
    # Check fields used by use-models.tsx binding
    assert "id" in model
    assert "name" in model
    assert "provider" in model


# Emulates the call made by Workbench
@pytest.mark.asyncio
async def test_frontend_workbench_job_submission(client: AsyncClient, admin_user, seed_model):
    """
    Verify POST /api/jobs accepts the payload constructed by Workbench.
    """
    await login_admin(client, admin_user)

    # 1. First fetch a model to get a valid ID (to simulate real selection)
    models_res = await client.get("/api/models")
    models = models_res.json()
    assert len(models) > 0
        
    model_id = models[0]["id"]
    
    # Payload matching workbench.tsx:
    payload = {
        "model_id": model_id,
        "prompt": "A futuristic city verification test",
        "kind": "image",
        "params": {
            "aspect_ratio": "1:1"
        }
    }
    
    response = await client.post("/api/jobs", json=payload)
    
    assert response.status_code == 200, f"Submission failed: {response.text}"
    data = response.json()
    
    # Expect Job ID
    assert "id" in data
    assert "status" in data
    assert data["status"] in ["queued", "running", "succeeded"]

# Emulates the call made by Gallery
@pytest.mark.asyncio
async def test_frontend_gallery_fetch(client: AsyncClient, admin_user, seed_model):
    """
    Verify GET /api/jobs returns list for Gallery.
    """
    await login_admin(client, admin_user)

    # Ensure at least one job exists
    # reusing the logic from submission test effectively
    # but we can assume prior tests ran or just creating a job
#    if we want to be safe, we can trigger one, but for Read test, 
#    empty list is also a valid contract response.
#    We just check structure.
    
    response = await client.get("/api/jobs")
    assert response.status_code == 200
    data = response.json()
    
    assert isinstance(data, list)

