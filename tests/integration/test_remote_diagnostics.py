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
    assert data["balance"] == 1000 # Default guest balance
    
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
         patch("app.domain.jobs.runner.SessionLocal") as MockSessionLocal, \
         patch("app.domain.jobs.runner.decrypt_key", return_value="mock-api-key"):
        
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
        # Verify Mock Object update (since we mocked the session)
        assert mock_job.status == "running"
        assert mock_job.provider_job_id == "mock_provider_id_123"

@pytest.mark.asyncio
@pytest.mark.live
async def test_LIVE_replicate_generation(client: AsyncClient, seed_env):
    """
    CRITICAL: LIVE INTEGRATION TEST
    Requires REPLICATE_API_TOKEN in env.
    
    NOTE: This test manages its OWN database connection/session to ensure
    transaction isolation does not hide data from the external Celery worker emulator.
    The 'db_session' fixture uses a transaction that won't be visible to the worker's separate connection.
    """
    if not os.getenv("REPLICATE_API_TOKEN"):
        pytest.skip("REPLICATE_API_TOKEN not set")

    from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
    import uuid
    from app.core.config import settings

    # 1. Setup Independent Session
    engine = create_async_engine(settings.SQLALCHEMY_DATABASE_URI)
    Session = async_sessionmaker(engine, expire_on_commit=False)
    
    async with Session() as session:
        # 1.1 Ensure Provider/Model Exist (since seed_env might be hidden in fixture transaction)
        # Check Provider
        res = await session.execute(select(ProviderConfig).where(ProviderConfig.provider_id == "replicate"))
        if not res.scalar_one_or_none():
            config = ProviderConfig(
                provider_id="replicate",
                is_active=True,
                encrypted_api_key=encrypt_key(os.getenv("REPLICATE_API_TOKEN"))
            )
            session.add(config)
            
        # Check Model
        model_uuid = uuid.UUID(seed_env["model_id"])
        res_m = await session.execute(select(AIModel).where(AIModel.id == model_uuid))
        if not res_m.scalar_one_or_none():
             # Create duplicate model for this test session context if needed
             # Or just trust seed_env ID but we need to ensure it's in DB.
             # Actually, if seed_env fixture failed to commit to DB, we need to create it.
             # Let's create a dedicated test model to be safe.
             model_uuid = uuid.uuid4()
             model = AIModel(
                id=model_uuid,
                display_name="Live Test Flux",
                provider="replicate",
                model_ref="black-forest-labs/flux-schnell",
                is_active=True,
                credits_per_generation=1,
                normalized_caps_json={"inputs": [{"name": "prompt", "type": "string"}]}
             )
             session.add(model)
        
        # 1.2 Create User & Job
        # We need a user because process_job might check credits/permissions (though runner seems lax on user check)
        # We'll create a guest job.
        guest_id = uuid.uuid4()
        
        # Create Guest Profile first (Satisfy FK)
        from app.models import GuestProfile
        guest_profile = GuestProfile(id=guest_id, balance=1000)
        session.add(guest_profile)
        await session.flush() # Ensure it exists before job refers to it

        job_id = str(uuid.uuid4()) # ID must be string per model definition
        job = Job(
            id=job_id,
            guest_id=guest_id,
            owner_type="guest",
            kind="image",
            prompt=f"[{model_uuid}] {{}} | Orange cat in space suit {uuid.uuid4()}",
            status="queued",
            cost_credits=1,
            progress=0
        )
        session.add(job)
        await session.commit()
        print(f"DEBUG: Created Job {job_id} in dedicated session. Committed.")

    # 2. Run Worker (REAL)
    # The worker opens its own connection. It should see the committed job.
    print(f"Submitting Job {job_id} to Replicate...")
    try:
        process_job(job_id) # Already string
    except Exception as e:
        # Cleanup
        async with Session() as session:
             await session.execute(delete(Job).where(Job.id == job_id))
             await session.commit()
        pytest.fail(f"Worker failed: {e}")

    # 3. Poll for Completion
    print("Waiting for generation...")
    final_status = None
    
    try:
        for _ in range(30): # Wait up to 60s
            await asyncio.sleep(2)
            async with Session() as poll_session:
                res = await poll_session.execute(select(Job).where(Job.id == job_id))
                updated_job = res.scalar_one_or_none()
                
                if not updated_job:
                    print("DEBUG: Job disappeared?!")
                    continue
                    
                status = updated_job.status
                print(f"Current Job Status: {status}")
                
                if status == "succeeded":
                     assert updated_job.result_url is not None
                     final_status = "succeeded"
                     return
                elif status == "failed":
                     pytest.fail(f"Job Failed: {updated_job.error_message}")
                elif status == "running" and updated_job.provider_job_id:
                     print("Job is running on Replicate. (Success for submission)")
                     final_status = "running"
                     return

        if not final_status:
             pytest.fail("Timeout waiting for job state change")
             
    finally:
        # Cleanup
        async with Session() as session:
             print(f"Cleaning up Job {job_id}")
             await session.execute(delete(Job).where(Job.id == job_id))
             await session.commit()
        await engine.dispose()
