
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
        
        # 1. Base Cost Logic
        # Priority: Admin Override > Model Default > Global Minimum
        base_cost = model.credits_per_generation if model.credits_per_generation > 0 else 5
        
        # Hardcodes for fallback (Migrate these to DB rules later via a script)
        # If DB rules exist, we rely on them + base. If empty, maybe keep legacy fallback?
        # For now, we trust the DB 'credits_per_generation' as the base.
        
        breakdown = []
        breakdown.append({"label": "Base Price", "cost": base_cost})

        current_total = base_cost

        # 2. Dynamic Rule Engine
        # Rules are stored in model.pricing_rules (JSON List)
        if model.pricing_rules:
            for rule in model.pricing_rules:
                # Rule Structure: {param_id, operator, value, surcharge, label}
                param_id = rule.get("param_id")
                
                # Check if param is relevant
                if param_id not in params:
                    continue
                    
                user_value = params[param_id]
                target_value = rule.get("value")
                op = rule.get("operator")
                
                match = False
                
                # Operator Logic
                if op == "eq" and user_value == target_value:
                    match = True
                elif op == "neq" and user_value != target_value:
                    match = True
                elif op == "gt" and isinstance(user_value, (int, float)) and user_value > target_value:
                    match = True
                elif op == "gte" and isinstance(user_value, (int, float)) and user_value >= target_value:
                    match = True
                elif op == "lt" and isinstance(user_value, (int, float)) and user_value < target_value:
                    match = True
                elif op == "lte" and isinstance(user_value, (int, float)) and user_value <= target_value:
                    match = True
                elif op == "in" and user_value in target_value:
                    match = True
                elif op == "contains" and target_value in user_value:
                    match = True
                    
                if match:
                    surcharge = rule.get("surcharge", 0)
                    if surcharge != 0:
                        label = rule.get("label") or f"{param_id} surcharge"
                        breakdown.append({"label": label, "cost": surcharge})
                        current_total += surcharge
        else:
             # Legacy Fallback (Preserve behavior until user migrates rules in UI)
             if model.type == "video":
                # Video Base was 50, if base_cost is just 5, we might undercharge.
                # Assuming Admin has set base_cost correct in DB or we use this fallback.
                if base_cost <= 10: 
                     diff = 50 - base_cost
                     if diff > 0:
                        breakdown.append({"label": "Video Base Adjustment", "cost": diff})
                        current_total += diff
                        
             if "runway" in model.model_ref or "runway" in model.display_name.lower():
                 extra = math.ceil(current_total * 0.3)
                 breakdown.append({"label": "Runway Premium", "cost": extra})
                 current_total += extra

        # 3. Create Quote
        quote = PricingQuote(
            model_id=model.id,
            user_id=user_context.user.id if user_context and user_context.user else None,
            guest_id=uuid.UUID(user_context.guest_id) if user_context and user_context.guest_id else None,
            total_credits=current_total,
            breakdown=breakdown
        )
        
        db.add(quote)
        await db.commit()
        await db.refresh(quote)
        
        return quote
