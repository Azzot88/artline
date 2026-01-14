import pytest
from httpx import AsyncClient
from unittest.mock import MagicMock, patch, AsyncMock
from app.models import User, AIModel
import uuid

# Mock Dependencies
@pytest.fixture
def mock_db_session():
    return AsyncMock()

@pytest.fixture
def mock_user():
    u = User(id=uuid.uuid4(), email="test@test.com")
    return u

@pytest.mark.asyncio
async def test_models_for_ui_structure():
    # We can test logic by calling function directly or using TestClient?
    # Direct call is hard due to Depends. TestClient is better but requires mocking overrides.
    # Let's use logic unit test or mock app.
    pass

# We will use integrated tests with mocked DB execution for endpoints?
# Actually, since logic is in the router function, unit testing the function is tricky without Dependency Injection.
# But we can assume fastAPI works and test logic via simple function calls if we mock depends.


from app.web.routers.api_spa import list_models, create_spa_job
from app.schemas import JobRequestSPA

@pytest.mark.asyncio
async def test_list_models_logic():
    # Setup Data
    mock_db = AsyncMock()
    mock_model = AIModel(
        id=uuid.uuid4(),
        display_name="Test Model",
        provider="replicate",
        is_active=True,
        modes=["image"],
        normalized_caps_json={
            "inputs": [{"name": "width", "type": "integer"}],
            "defaults": {"width": 1024}
        }
    )
    
    # Mock Select
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = [mock_model]
    mock_db.execute.return_value = mock_result
    
    # Act
    data = await list_models(db=mock_db)
    
    # Assert
    assert len(data) == 1
    item = data[0]
    assert item["name"] == "Test Model"
    assert item["defaults"]["width"] == 1024
    assert item["inputs"][0]["name"] == "width"

@pytest.mark.asyncio
@patch("app.web.routers.api_spa.create_job")
@patch("app.web.routers.api_spa.process_job")
async def test_create_spa_job_success(mock_process, mock_create):
    mock_db = AsyncMock()
    cid = uuid.uuid4()
    mock_user = User(id=uuid.uuid4())
    
    # Mock Model Existence Check
    mock_model = AIModel(id=cid)
    mock_db.execute.return_value.scalar_one_or_none.return_value = mock_model
    
    # Mock Create Job Service Return
    mock_create.return_value = (MagicMock(id="job-1"), None)
    
    req = JobRequestSPA(model_id=str(cid), prompt="foo", kind="image")
    
    res = await create_spa_job(req, user=mock_user, db=mock_db)
    
    assert res.id == "job-1"
    mock_process.delay.assert_called_with("job-1")

