
import pytest
from app.models import AIModel
from unittest.mock import MagicMock
import uuid

@pytest.mark.unit
def test_aimodel_initialization():
    """
    Unit test to verify AIModel class initialization and field defaults.
    """
    model = AIModel(
        id=uuid.uuid4(),
        display_name="Test Model",
        provider="replicate",
        model_ref="owner/model",
        is_active=True,
        normalized_caps_json={"inputs": []}
    )
    
    assert model.display_name == "Test Model"
    assert model.provider == "replicate"
    assert model.is_active is True
    assert model.normalized_caps_json == {"inputs": []}

@pytest.mark.unit
def test_aimodel_defaults():
    """
    Test default values for AIModel.
    """
    model = AIModel(
        display_name="Minimal",
        provider="openai"
    )
    assert model.is_active is None # SQLAlchemy default not set until flush
    # assert model.total_generations == 0 # Default not set pre-flush
    # assert model.uses == 0 # Field does not exist
