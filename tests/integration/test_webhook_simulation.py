
import pytest
import uuid
import json
from httpx import AsyncClient
from sqlalchemy import select
from app.models import Job, User
from app.domain.providers.models import ProviderConfig
from app.domain.providers.service import decrypt_key
from starlette import status

@pytest.mark.asyncio
async def test_real_replicate_submission_and_webhook_simulation(client: AsyncClient, db_session):
    """
    1. Submits a REAL job to Replicate (verifying API Key).
    2. Simulates the Webhook callback (verifying Gallery logic).
    """

    # 1. Init Guest Session
    resp = await client.post("/guest/init")
    assert resp.status_code == 200, "Guest Init Failed"
    
    # Check if Replicate is configured
    stmt = select(ProviderConfig).where(ProviderConfig.provider_id == "replicate")
    result = await db_session.execute(stmt)
    config = result.scalar_one_or_none()
    
    if not config or not config.encrypted_api_key:
        pytest.skip("Replicate not configured, skipping real API test")

    # 2. Submit Job (This actually hits Replicate API!)
    prompt = "ducks in bikini in spaceship"
    
    # We mock 'process_job.delay' ONLY to capture the ID, or we let it run sync?
    # Actually, the API calls 'process_job.delay'. Ideally we want the worker to pick it up.
    # But inside pytest, Celery worker isn't running in the same process/loop easily.
    # We can mock `process_job.delay` to run the function IMMEDIATELY inline.
    
    from unittest.mock import patch
    
    # We want to run the ACTUAL process_job logic to hit Replicate.
    # So we patch the .delay() method to just call the function.
    
    with patch("app.domain.jobs.runner.process_job.delay") as mock_delay:
        # Define side effect to run it immediately
        from app.domain.jobs.runner import process_job
        def side_effect(job_id):
             # We need to run it. process_job is a celery task.
             # calling process_job(job_id) calls the wrapped task?
             # Usually process_job.apply(args=[job_id]) works for Celery tasks sync run.
             # But 'process_job' imported from runner might be the headers. 
             # Let's try calling it directly.
             try:
                 process_job(job_id)
             except Exception as e:
                 # If it fails (e.g. no key), we want to fail test
                 raise e

        mock_delay.side_effect = side_effect
        
        # Call API
        response = await client.post(
            "/api/jobs",
            json={
                "kind": "image",
                "prompt": prompt,
                "model_id": "a8efc1dd-056c-454c-b26d-fe0a8c0a5bab" # Use a dummy valid UUID or fetch one
            }
        )
        assert response.status_code == 200, f"Submission failed: {response.text}"
        
        # Get Job ID from DB (since response is HTML/Flash)
        # We find the latest job for this guest
        # We need the guest_id from cookie to query
        guest_id = resp.json()["guest_id"]
        
        # Query DB
        # Wait a moment for async DB/Worker sync? (since we forced sync run, we should be good if session commits matches)
        # BUT pytests dbsession is transaction rolled back.
        # "process_job" uses its own SessionLocal().
        # This might cause visibility issues if running in same transaction context or isolation level.
        # However, for this integration test, let's assume committed data is visible or wait.
        
        # Note: If tests/conftest.py uses transaction rollback, data committed by 'process_job' (SessionLocal) 
        # MIGHT stick around or be isolated.
        
        job_q = await db_session.execute(select(Job).order_by(Job.created_at.desc()).limit(1))
        job = job_q.scalar_one_or_none()
        
        assert job is not None
        assert job.prompt == prompt
        
        # If real API worked, provider_job_id should be set
        if job.status == "failed":
            pytest.fail(f"Job failed during submission: {job.error_message}")
            
        assert job.provider_job_id is not None, "Replicate API did not return an ID"
        print(f"Real Replicate ID: {job.provider_job_id}")

        # 3. Simulate Webhook (Replicate calling us back)
        # We use the REAL provider_id we just got.
        webhook_payload = {
            "id": job.provider_job_id,
            "status": "succeeded",
            "output": ["https://replicate.delivery/pbxt/generated_duck.jpg"], # Fake URL for gallery
            "error": None
        }
        
        wh_response = await client.post("/webhooks/replicate", json=webhook_payload)
        assert wh_response.status_code == 200
        
        # 4. Verify Gallery
        await db_session.refresh(job)
        assert job.status == "succeeded"
        assert job.result_url == "https://replicate.delivery/pbxt/generated_duck.jpg"
        
        # Verify it appears in Gallery Page
        # /gallery/page/1
        gallery_resp = await client.get("/gallery/page/1")
        assert gallery_resp.status_code == 200
        assert "generated_duck.jpg" in gallery_resp.text
        
        print("Test passed! Job in gallery.")
