import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.domain.providers.models import AIModel, ProviderConfig
from app.domain.jobs.models import Job
from app.domain.jobs.runner import process_job
from app.domain.providers.service import encrypt_key
import uuid
import json
import os
import asyncio
from unittest.mock import patch, MagicMock

# --- Fixtures ---

@pytest_asyncio.fixture
async def seed_env(db_session: AsyncSession):
    """Seeds the DB with basic Require Data (Models, Provider Config)"""
    # 1. Provider Config
    # Check if exists first
    res = await db_session.execute(select(ProviderConfig).where(ProviderConfig.provider_id == "replicate"))
    if not res.scalar_one_or_none():
        config = ProviderConfig(
            provider_id="replicate",
            is_active=True,
            encrypted_api_key=encrypt_key(os.getenv("REPLICATE_API_TOKEN", "mock-key"))
        )
        db_session.add(config)

    # 2. AI Model (Flux)
    flux_id = uuid.uuid4()
    model = AIModel(
        id=flux_id,
        display_name="Flux Schnell",
        provider="replicate",
        model_ref="black-forest-labs/flux-schnell",
        version_id=None,
        is_active=True,
        credits_per_generation=1, 
        normalized_caps_json={
            "inputs": [{"name": "prompt", "type": "string"}, {"name": "aspect_ratio", "type": "string"}],
            "defaults": {"aspect_ratio": "1:1"}
        }
    )
    db_session.add(model)
    await db_session.commit()
    return {"model_id": str(flux_id)}

# --- Tests ---

@pytest.mark.asyncio
async def test_spa_initialization_flow(client: AsyncClient, seed_env):
    """
    Detailed Check: SPA Bootstrap
    1. Verifies /api/spa/me works for Guest (creates cookie).
    2. Verifies /api/spa/models returns the seeded model.
    """
    # 1. Guest Bootstrap
    res = await client.get("/api/me")
    assert res.status_code == 200
    data = res.json()
    assert data["is_guest"] is True
    assert data["balance"] == 35 # Default guest balance
    
    # 2. List Models
    res_models = await client.get("/api/models")
    assert res_models.status_code == 200
    models = res_models.json()
    assert len(models) >= 1
    assert models[0]["name"] == "Flux Schnell"

@pytest.mark.asyncio
async def test_generation_submission_logic(client: AsyncClient, seed_env, db_session: AsyncSession):
    """
    Detailed Check: Job Submission & DB State
    1. Creates a job via SPA API.
    2. Checks DB for 'queued' status.
    3. Checks ledger/balance deduction.
    """
    # 1. Get Guest Context (Cookie)
    res_me = await client.get("/api/me")
    guest_id = res_me.json()["guest_id"]
    client.cookies.set("guest_id", guest_id)
    
    # 2. Submit Job
    payload = {
        "kind": "image",
        "model_id": seed_env["model_id"],
        "prompt": "A futuristic city verification test",
        "params": {"aspect_ratio": "16:9"}
    }
    res_job = await client.post("/api/jobs", json=payload)
    if res_job.status_code != 200:
        print(f"Error: {res_job.text}")
    assert res_job.status_code == 200
    job_data = res_job.json()
    job_id = job_data["id"]
    
    # 3. Verify DB State (Async)
    res_db = await db_session.execute(select(Job).where(Job.id == job_id))
    job = res_db.scalar_one()
    assert job.status == "queued"
    assert job.cost_credits > 0
    assert "futuristic city" in job.prompt

@pytest.mark.asyncio
async def test_worker_replicate_handshake(client: AsyncClient, seed_env, db_session: AsyncSession):
    """
    Detailed Check: Worker Logic & Mocked Replicate
    1. Simulates Worker picking up the job.
    2. Simulates Replicate submission (Mock).
    3. Verifies Job goes from 'queued' -> 'running'.
    """
    # Setup: Create Job
    res_me = await client.get("/api/me")
    client.cookies.set("guest_id", res_me.json()["guest_id"])
    
    payload = {
        "kind": "image",
        "model_id": seed_env["model_id"],
        "prompt": "Mock Test",
        "params": {}
    }
    res = await client.post("/api/jobs", json=payload)
    job_id = res.json()["id"]
    
    # DEBUG: Check DB Connection Match
    from app.core.config import settings
    from app.domain.jobs import runner
    print(f"DEBUG: Settings URI: {settings.SQLALCHEMY_DATABASE_URI}")
    print(f"DEBUG: Runner Engine: {runner.sync_engine.url}")
    
    # FORCE COMMIT to ensure Sync Worker can see the job
    # Note: 'client' and 'db_session' might use different connections if not shared correctly in fixtures.
    # But 'client' creates job in DB. 'db_session' is a separate session.
    # We need to ensure the client request's transaction is committed (it should be).
    # We also need to verify the job exists via ID before running worker.
    pass

    # MOCK ReplicateService AND SessionLocal inside runner.py
    # We trap the 'submit_prediction' call to verify arguments without hitting API
    # We also mock SessionLocal to avoid DB isolation issues (Sync Worker vs Async Test)
    with patch("app.domain.jobs.runner.ReplicateService") as MockService, \
         patch("app.domain.jobs.runner.SessionLocal") as MockSessionLocal:
        
        # Setup Mock Service
        instance = MockService.return_value
        instance.parse_input_string.return_value = ("flux", {"prompt": "Mock Test"}, "Mock Test")
        instance.submit_prediction.return_value = "mock_provider_id_123"
        instance.sanitize_input.return_value = {"prompt": "Mock Test"}
        instance.build_payload.return_value = {"input": {"prompt": "Mock Test"}}
        
        # Setup Mock DB Session
        # We construct a mock Job that mimics what we expect from DB
        mock_job = Job(
            id=uuid.UUID(job_id),
            prompt="Mock Test",
            kind="image",
            status="queued"
        )
        mock_db = MockSessionLocal.return_value
        # When session.execute(select(Job)...).scalar_one_or_none() is called
        # We need to construct the chain
        mock_db.execute.return_value.scalar_one_or_none.return_value = mock_job
        
        # Also need ProviderConfig
        # On second call to execute (for ProviderConfig)
        # We can use side_effect to return different things
        from app.domain.providers.models import ProviderConfig
        mock_config = ProviderConfig(provider_id="replicate", is_active=True, encrypted_api_key=b"gAAAAAB...") # Encrypted dummy
        
        def execute_side_effect(stmt):
            s = str(stmt)
            if "FROM jobs" in s:
                m = MagicMock()
                m.scalar_one_or_none.return_value = mock_job
                return m
            if "FROM provider_configs" in s:
                 m = MagicMock()
                 m.scalars.return_value.first.return_value = mock_config
                 return m
            if "FROM ai_models" in s:
                 m = MagicMock()
                 m.scalar_one_or_none.return_value = None # Default logic
                 return m
            return MagicMock()
        
        mock_db.execute.side_effect = execute_side_effect

        # ACT: Run Worker Function Synchronously
        result = process_job(job_id)
        
        # ASSERT
        assert "Submitted: mock_provider_id_123" in result
        
        # Verify DB update
        await db_session.commit() # Force refresh
        res_db = await db_session.execute(select(Job).where(Job.id == job_id))
        job = res_db.scalar_one()
        assert job.status == "running"
        assert job.provider_job_id == "mock_provider_id_123"

@pytest.mark.asyncio
@pytest.mark.live
async def test_LIVE_replicate_generation(client: AsyncClient, seed_env, db_session: AsyncSession):
    """
    CRITICAL: LIVE INTEGRATION TEST
    Requires REPLICATE_API_TOKEN in env.
    1. Submits REAL job to Replicate (Flux Schnell).
    2. Waits for completion (Polling).
    3. Verifies 'result_url' is populated.
    """
    if not os.getenv("REPLICATE_API_TOKEN"):
        pytest.skip("REPLICATE_API_TOKEN not set")

    # 1. Create Job
    res_me = await client.get("/api/me")
    client.cookies.set("guest_id", res_me.json()["guest_id"])
    
    payload = {
        "kind": "image",
        "model_id": seed_env["model_id"],
        "prompt": "Orange cat in space suit, highly detailed, 8k",
        "params": {}
    }
    res = await client.post("/api/jobs", json=payload)
    job_id = res.json()["id"]
    
    # 2. Run Worker (REAL, no mocks)
    # This will hit Replicate API
    print(f"Submitting Job {job_id} to Replicate...")
    try:
        process_job(job_id)
    except Exception as e:
        pytest.fail(f"Worker failed: {e}")
        
    # 3. Poll for Completion (Manual Sync Simulation)
    # We can use the /jobs/{id}/sync endpoint or just check DB
    print("Waiting for generation...")
    for _ in range(15): # Wait up to 30s
        await asyncio.sleep(2)
        
        # Check status via API (like Frontend polling)
        # Note: 'process_job' just submits. It doesn't poll. 
        # So we need to Simulate the Webhook OR use the Sync endpoint.
        # Let's use the Sync Endpoint to test that too!
        
        res_sync = await client.post(f"/jobs/{job_id}/sync")
        if res_sync.status_code == 200:
            data = res_sync.json()
            status = data["status"]
            print(f"Status: {status}")
            
            if status == "succeeded":
                assert data["result_url"] is not None
                assert "replicate.delivery" in data["result_url"] or "replicate.com" in data["result_url"]
                return # Success
            elif status == "failed":
                pytest.fail(f"Replicate Job Failed: {data.get('error')}")
                
    pytest.fail("Timeout waiting for Replicate generation")
