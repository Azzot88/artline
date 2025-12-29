
import pytest
from app.domain.billing.service import get_user_balance, add_ledger_entry
from app.models import User
import uuid
from sqlalchemy.ext.asyncio import AsyncSession

@pytest.mark.asyncio
async def test_ledger_flow(db_session: AsyncSession):
    # 1. Create User
    user_id = uuid.uuid4()
    user = User(
        id=user_id,
        email=f"test_{user_id}@example.com",
        hashed_password="mock",
    )
    db_session.add(user)
    await db_session.commit()
    
    # 2. Check Balance (0)
    bal = await get_user_balance(db_session, user_id)
    assert bal == 0
    
    # 3. Add Credits
    await add_ledger_entry(db_session, user_id, 100, "topup")
    bal = await get_user_balance(db_session, user_id)
    assert bal == 100
    
    # 4. Spend Credits
    await add_ledger_entry(db_session, user_id, -50, "job")
    bal = await get_user_balance(db_session, user_id)
    assert bal == 50
