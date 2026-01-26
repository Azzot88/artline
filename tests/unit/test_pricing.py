
import pytest
from unittest.mock import MagicMock, AsyncMock
from app.domain.pricing.service import PricingService
from app.domain.providers.models import AIModel
from app.schemas import UserContext, UserRead
from app.domain.pricing.models import PricingQuote

@pytest.fixture
def mock_db():
    return AsyncMock()

@pytest.fixture
def user_context():
    return UserContext(
        is_guest=False,
        balance=1000,
        user=UserRead(
            id="123e4567-e89b-12d3-a456-426614174000",
            email="test@example.com",
            balance=1000,
            created_at="2024-01-01T00:00:00"
        ),
        guest_id=None
    )

@pytest.mark.asyncio
async def test_quote_standard_image(mock_db, user_context):
    model = AIModel(
        id=uuid.uuid4(),
        display_name="Flux Schnell",
        type="image",
        model_ref="black-forest-labs/flux-schnell",
        credits_per_generation=0 # Should use default 10
    )
    
    quote = await PricingService.quote(mock_db, model, {}, user_context)
    
    assert quote.total_credits == 10
    assert len(quote.breakdown) == 1
    assert quote.breakdown[0]["label"] == "Image Base"

@pytest.mark.asyncio
async def test_quote_video(mock_db, user_context):
    model = AIModel(
        id=uuid.uuid4(),
        display_name="Luma Ray",
        type="video",
        model_ref="luma/ray",
        credits_per_generation=0
    )
    
    # Luma has a discount rule in service: Base 50 - 20% = 40
    quote = await PricingService.quote(mock_db, model, {}, user_context)
    
    assert quote.total_credits == 40
    # Base 50, Discount -10
    cost_items = {item["label"]: item["cost"] for item in quote.breakdown}
    assert cost_items["Video Base"] == 50
    assert cost_items["Luma Discount"] == -10

@pytest.mark.asyncio
async def test_quote_runway_premium(mock_db, user_context):
    model = AIModel(
        id=uuid.uuid4(),
        display_name="Runway Gen-2",
        type="video",
        model_ref="runwayml/runway-gen-2",
        credits_per_generation=0
    )
    
    # Runway has premium rule: Base 50 + 30% = 65
    quote = await PricingService.quote(mock_db, model, {}, user_context)
    
    assert quote.total_credits == 65
    cost_items = {item["label"]: item["cost"] for item in quote.breakdown}
    assert cost_items["Video Base"] == 50
    assert cost_items["Runway Premium"] == 15

@pytest.mark.asyncio
async def test_quote_flux_pro(mock_db, user_context):
    model = AIModel(
        id=uuid.uuid4(),
        display_name="Flux Pro",
        type="image",
        model_ref="black-forest-labs/flux-pro",
        credits_per_generation=0
    )
    
    # Flux Pro Fixed: 55
    quote = await PricingService.quote(mock_db, model, {}, user_context)
    
    assert quote.total_credits == 55
    cost_items = {item["label"]: item["cost"] for item in quote.breakdown}
    assert cost_items["Image Base"] == 10
    assert cost_items["Flux Pro Surcharge"] == 45

import uuid
