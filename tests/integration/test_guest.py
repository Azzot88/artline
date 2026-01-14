
import pytest
import uuid
from sqlalchemy import select, update
from app.models import Job, User, GuestProfile
from app.core.security import verify_password

@pytest.mark.asyncio
async def test_guest_flow(client):
    # 1. Init Guest
    response = await client.post("/api/auth/guest/init")
    assert response.status_code == 200
    data = response.json()
    assert "guest_id" in data
    assert data["balance"] == 35
    
    guest_id = data["guest_id"]
    guest_cookie = response.cookies["guest_id"]
    assert guest_cookie == guest_id

@pytest.mark.asyncio
async def test_guest_migration_signup(client, db_session):
    # 1. Create Guest via API
    resp = await client.post("/api/auth/guest/init")
    guest_id = resp.json()["guest_id"]
    guest_cookie = resp.cookies["guest_id"]
    
    # 2. Manually insert a Job for this guest (simulating generation)
    # We use db_session directly to effectively "seed" the state
    gid_uuid = uuid.UUID(guest_id)
    
    # Ensure guest exists in current session (API call used separate session)
    # But since we share DB, it's there.
    
    job = Job(
        guest_id=gid_uuid,
        owner_type="guest",
        cost_credits=10,
        status="completed",
        prompt="Test migration",
        kind="image"
    )
    db_session.add(job)
    await db_session.commit()
    await db_session.refresh(job)
    job_id = job.id
    
    # 3. Signup with the cookie
    # Needs a fresh email to avoid collision if run multiple times
    email = f"guest_mig_{uuid.uuid4()}@example.com"
    password = "password123"
    
    # Set cookie on client
    client.cookies.set("guest_id", guest_cookie)
    
    signup_resp = await client.post(
        "/register", 
        data={"email": email, "password": password},
        follow_redirects=False # Expect redirect to dashboard
    )
    
    assert signup_resp.status_code == 302
    
    # 4. Verify Migration
    # Fetch User
    result = await db_session.execute(select(User).where(User.email == email))
    user = result.scalar_one()
    
    # Fetch Job
    job_result = await db_session.execute(select(Job).where(Job.id == job_id))
    job = job_result.scalar_one()
    
    assert job.user_id == user.id
    assert job.owner_type == "user"
    assert job.guest_id is None
    assert job.expires_at is None
