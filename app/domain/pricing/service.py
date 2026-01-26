
import math
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from app.domain.pricing.models import PricingQuote
from app.domain.providers.models import AIModel
from app.schemas import UserContext

class PricingService:
    @staticmethod
    async def quote(
        db: AsyncSession,
        model: AIModel,
        params: dict,
        user_context: UserContext | None = None
    ) -> PricingQuote:
        """
        Generates a deterministic price quote for a model + params.
        Persists the quote to DB for audit.
        """
        
        # 1. Base Cost Logic (Replace hardcoded rules)
        base_cost = 0
        breakdown = []
        
        # Rule: Video vs Image
        if model.type == "video":
            base_cost = 50
            breakdown.append({"label": "Video Base", "cost": 50})
        else:
            base_cost = 10
            breakdown.append({"label": "Image Base", "cost": 10})
            
        # Rule: Model Specific Overrides (Legacy Compatibility)
        if model.model_ref == "runwayml/runway-gen-2" or "runway" in model.display_name.lower():
             # +30%
             extra = math.ceil(base_cost * 0.3)
             base_cost += extra
             breakdown.append({"label": "Runway Premium", "cost": extra})
             
        elif "luma" in model.display_name.lower():
             # -20%
             discount = math.ceil(base_cost * 0.2)
             base_cost -= discount
             breakdown.append({"label": "Luma Discount", "cost": -discount})
             
        elif "flux-pro" in model.display_name.lower() or "pro" in model.model_ref:
             # Flux Pro Fixed Price
             # Override base
             # Check if we should use DB cost? 
             # For now, replicate logic: 55
             current = base_cost # 10
             target = 55
             diff = target - current
             base_cost = target
             breakdown.append({"label": "Flux Pro Surcharge", "cost": diff})
             
        # Rule: Official DB Price (if set and > 0, strict override?)
        # For this refactor, let's say DB 'credits_per_generation' is the base if set > 0
        if model.credits_per_generation and model.credits_per_generation > 0 and model.credits_per_generation != 5:
             # If DB has specific price, use it as Authority?
             # Let's trust the code rules for now as requested, but maybe in Phase 2 we move entirely to DB.
             pass

        # 2. Create Quote
        quote = PricingQuote(
            model_id=model.id,
            user_id=user_context.user.id if user_context and user_context.user else None,
            guest_id=uuid.UUID(user_context.guest_id) if user_context and user_context.guest_id else None,
            total_credits=base_cost,
            breakdown=breakdown
        )
        
        db.add(quote)
        await db.commit()
        await db.refresh(quote)
        
        return quote
