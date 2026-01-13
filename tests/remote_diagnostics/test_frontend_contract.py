import pytest
from httpx import AsyncClient
from app.main import app

# Emulates the call made by UserProvider
@pytest.mark.asyncio
async def test_frontend_user_provider_contract(client: AsyncClient, admin_user):
    """
    Verify /api/me returns the structure expected by UserProvider.
    Expected: { user: {...}, balance: int, is_guest: bool }
    """
    response = await client.get("/api/me")
    assert response.status_code == 200
    data = response.json()
    
    # Check fields required by user-provider.tsx
    assert "user" in data
    assert "balance" in data
    assert "is_guest" in data
    
    # Check user object fields
    user = data["user"]
    assert "email" in user
    assert "id" in user

# Emulates the call made by useModels / ModelSelector
@pytest.mark.asyncio
async def test_frontend_models_contract(client: AsyncClient, admin_user):
    """
    Verify /api/models returns list of models for ModelSelector.
    """
    response = await client.get("/api/models")
    assert response.status_code == 200
    data = response.json()
    
    assert isinstance(data, list)
    if len(data) > 0:
        model = data[0]
        # Check fields used by use-models.tsx binding
        assert "id" in model
        assert "name" in model
        assert "provider_id" in model
        # assert "cover_image_url" in model # Optional but good to check

# Emulates the call made by Workbench
@pytest.mark.asyncio
async def test_frontend_workbench_job_submission(client: AsyncClient, admin_user):
    """
    Verify POST /api/jobs accepts the payload constructed by Workbench.
    """
    # 1. First fetch a model to get a valid ID (to simulate real selection)
    models_res = await client.get("/api/models")
    models = models_res.json()
    if not models:
        pytest.skip("No models available to test submission")
        
    model_id = models[0]["id"]
    
    # Payload matching workbench.tsx:
    # const payload = { model_id: model, prompt: prompt, kind: creationType, params: parameterValues }
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
async def test_frontend_gallery_fetch(client: AsyncClient, admin_user):
    """
    Verify GET /api/jobs returns list for Gallery.
    """
    response = await client.get("/api/jobs")
    assert response.status_code == 200
    data = response.json()
    
    assert isinstance(data, list)
    # If we just submitted a job above, list should not be empty (if tests run in order/same session context)
    # But strictly checking type is safe enough.
    if len(data) > 0:
        job = data[0]
        # Check fields used by Gallery mapping
        assert "id" in job
        assert "prompt" in job
        assert "model_id" in job
        # assert "result_url" in job # Might be null if queued
