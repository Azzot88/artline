import pytest
from unittest.mock import MagicMock, patch, ANY
from app.domain.jobs.runner import process_job

@pytest.fixture
def mock_dependencies():
    with patch("app.domain.jobs.runner.SessionLocal") as mock_session_cls, \
         patch("app.domain.jobs.runner.ReplicateService") as mock_service_cls, \
         patch("app.domain.jobs.runner.decrypt_key") as mock_decrypt:
         
        mock_session = mock_session_cls.return_value
        mock_service = mock_service_cls.return_value
        mock_decrypt.return_value = "secret_key"
        
        yield mock_session, mock_service

def test_process_job_coordinator_flow(mock_dependencies):
    mock_session, mock_service = mock_dependencies
    
    # 1. Setup Mock DB Data
    mock_job = MagicMock()
    mock_job.id = "job-123"
    mock_job.prompt = "[my/model] {params} | prompt"
    
    mock_provider = MagicMock()
    mock_provider.encrypted_api_key = "enc_key"
    
    mock_ai_model = MagicMock()
    mock_ai_model.id = "uuid-123"
    mock_ai_model.model_ref = "test/model"
    mock_ai_model.version_id = "v1"
    mock_ai_model.ui_config = {}
    mock_ai_model.normalized_caps_json = {"inputs": [{"name": "foo", "type": "string"}]}
    
    # Configure Session Returns
    # First call: Job
    # Second call: Provider
    # Third call: AIModel (if UUID matches)
    
    def side_effect(query):
        # Very rough mock of SQLAlchemy execution
        s_query = str(query)
        mock_res = MagicMock()
        if "FROM jobs" in s_query:
            mock_res.scalar_one_or_none.return_value = mock_job
        elif "FROM provider_configs" in s_query:
            mock_res.scalars.return_value.first.return_value = mock_provider
        elif "FROM ai_models" in s_query:
            mock_res.scalar_one_or_none.return_value = mock_ai_model
        return mock_res
        
    mock_session.execute.side_effect = side_effect
    
    # 2. Setup Service Mocks
    mock_service.parse_input_string.return_value = ("uuid-123", {"foo": "bar"}, "actual prompt")
    mock_service.build_payload.return_value = {"foo": "bar", "prompt": "actual prompt"}
    mock_service.submit_prediction.return_value = "pred-id"
    
    # patch uuid
    with patch("app.domain.jobs.runner.uuid.UUID") as mock_uuid:
        mock_uuid.return_value = "uuid-123" # match our expectations
        
        # 3. Validation Logic in Runner checks UUID. 
        # But wait, runner does `uuid.UUID(model_identifier)`.
        # If model_identifier is "uuid-123" (string), uuid.UUID("uuid-123") works.
        # So we don't strictly need to patch UUID if we use valid UUID string.
        # But "uuid-123" isn't valid UUID.
        
        # ACT
        process_job("job-123")
        
        # ASSERT
        # Verify Service Calls
        mock_service.parse_input_string.assert_called_with("[my/model] {params} | prompt")
        
        # Verify Payload Builder usage
        mock_service.build_payload.assert_called_with(
            {"foo": "bar", "prompt": "actual prompt"}, 
            [{"name": "foo", "type": "string"}]
        )
        
        # Verify Submission
        mock_service.submit_prediction.assert_called_with(
            model_ref="test/model:v1",
            input_data={"foo": "bar", "prompt": "actual prompt"},
            webhook_url=ANY
        )
