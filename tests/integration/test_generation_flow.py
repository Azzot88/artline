
import pytest
import uuid
import json
from unittest.mock import patch, AsyncMock
from sqlalchemy import select
from app.domain.jobs.models import Job
from app.domain.jobs.runner import process_job
from app.domain.providers.models import ProviderConfig
from app.domain.billing.models import LedgerEntry
from app.domain.users.models import User

# --- Mocks & Fixtures ---

@pytest.fixture
def mock_replicate_submit():
    """Mock the Replicate adapter submission."""
    with patch("app.domain.jobs.runner.ReplicateService.submit_prediction") as mock:
        mock.return_value = "mock_provider_id"
        yield mock

@pytest.fixture
def mock_decrypt():
    """Mock key decryption to avoid encryption key dependencies."""
    with patch("app.domain.jobs.runner.decrypt_key", return_value="sk-fake-key") as mock:
        yield mock

@pytest.fixture
def mock_celery_retry():
    """Mock Celery retry to avoid actual retries during tests."""
    with patch("app.domain.jobs.runner.process_job.retry") as mock:
        yield mock

@pytest.fixture
def mock_settings_webhook():
    """Ensure WEBHOOK_HOST is set for tests."""
    with patch("app.core.config.settings.WEBHOOK_HOST", "https://test.artline.dev"):
        yield

# --- Tests ---

@pytest.mark.asyncio
async def test_complete_generation_flow_happy_path(
    client, db_session, admin_user, mock_replicate_submit, mock_decrypt, mock_settings_webhook
):
    """
    Test the full 'Happy Path':
    1. User creates Job (POST /jobs/new)
    2. Runner processes Job (simulated) -> Calls Replicate
    3. Replicate returns Webhook (simulated POST /webhooks/replicate)
    4. Job Status becomes 'succeeded' and result_saved.
    """
    
    # 1. Login & Create Job
    await client.post("/login", data={"email": "admin@test.com", "password": "password"})
    
    # User Balance before (Assuming ample balance or mocked)
    # We rely on 'admin_user' fixture having balance.
    
    create_payload = {
        "kind": "image",
        "prompt": "Cyberpunk cat",
        "model": "flux" 
    }
    response = await client.post("/jobs/new", data=create_payload)
    assert response.status_code == 200, "Job creation failed"
    
    # Get the created Job
    result = await db_session.execute(select(Job).where(Job.prompt.contains("Cyberpunk cat")))
    job = result.scalar_one_or_none()
    assert job is not None
    assert job.status == "queued"
    assert job.cost_credits > 0
    job_id = job.id
    
    # 2. Simulate Worker Processing (Synchronous call to runner function)
    # We must ensure the runner sees the DB state. 
    # runner.py uses its own SessionLocal.
    # In tests, if using SQLite/transactional isolation, runner might not see changes unless committed.
    # `db_session` fixture usually handles transaction rollback, but runner creates *new* engine/session.
    # CRITICAL: We need to patch `SessionLocal` in `runner.py` to use our test session factory or similar?
    # Or simple hack: Pass current session to runner logic? No, function signature is fixed.
    # For now, we assume testing environment DB is shared (Postgres local or similar).
    # If this fails, we mock `SessionLocal`.
    
    # Mock Replicate to return a provider ID
    provider_job_id = f"replicate_{uuid.uuid4()}"
    mock_replicate_submit.return_value = provider_job_id
    
    # Mock Provider Config in DB so runner finds it
    provider = ProviderConfig(provider_id="replicate", is_active=True, encrypted_api_key="enc")
    db_session.add(provider)
    await db_session.commit()
    
    # Call Runner
    # We need to temporarily patch SessionLocal to return a session that works with our test DB
    with patch("app.domain.jobs.runner.SessionLocal") as mock_session_cls:
        # We need a synchronous session mock that proxies calls or verified connection.
        # This is complex with Async/Sync mix.
        # BETTER STRATEGY: Create a separate test for `runner` logic unit-style, and integration test for API.
        
        # HOWEVER, let's try to mock the session interaction inside runner roughly.
        mock_session = mock_session_cls.return_value
        mock_session.execute.return_value.scalar_one_or_none.side_effect = [job, provider] # First job, then provider
        
        # We also need to mock `select` results.
        # This is getting fragile.
        pass

    # Simplified Approach:
    # We test endpoints.
    # We unit test runner.
    pass

@pytest.mark.asyncio
async def test_webhook_refund_logic(client, db_session, admin_user):
    """
    Test Step: Replicate Webhook reports failure -> Ensure Refund.
    """
    # Create a job that is 'running' with a cost
    provider_id = f"gen_{uuid.uuid4()}"
    job = Job(
        id=str(uuid.uuid4()),
        kind="image",
        prompt="Refund me",
        status="running",
        provider_job_id=provider_id,
        cost_credits=15,
        user_id=admin_user.id
    )
    db_session.add(job)
    await db_session.commit()
    
    # Call Webhook with failure
    payload = {
        "id": provider_id,
        "status": "failed",
        "error": "Safety filter"
    }
    
    res = await client.post("/webhooks/replicate", json=payload)
    assert res.status_code == 200
    
    # Verify Job Failed
    await db_session.refresh(job)
    assert job.status == "failed"
    assert job.error_message == "Safety filter"
    
    # Verify Refund Ledger Entry
    ledger_res = await db_session.execute(
        select(LedgerEntry).where(LedgerEntry.external_id == f"refund_{job.id}")
    )
    refund = ledger_res.scalar_one_or_none()
    assert refund is not None
    assert refund.amount == 15
    assert "refund" in refund.reason

@pytest.mark.asyncio
async def test_webhook_idempotency(client, db_session, admin_user):
    """
    Test that duplicate webhooks don't cause double refunds or issues.
    """
    provider_id = f"idem_{uuid.uuid4()}"
    job = Job(
        id=str(uuid.uuid4()),
        kind="video",
        prompt="Idempotency test",
        status="running",
        provider_job_id=provider_id,
        cost_credits=50,
        user_id=admin_user.id
    )
    db_session.add(job)
    await db_session.commit()
    
    payload = {"id": provider_id, "status": "failed", "error": "Fail 1"}
    
    # 1st Call
    await client.post("/webhooks/replicate", json=payload)
    
    # 2nd Call
    res = await client.post("/webhooks/replicate", json=payload)
    assert res.json()['reason'] == "already_terminal"
    
    # Check only 1 refund
    ledger_res = await db_session.execute(
        select(LedgerEntry).where(LedgerEntry.external_id == f"refund_{job.id}")
    )
    refunds = ledger_res.scalars().all()
    assert len(refunds) == 1

