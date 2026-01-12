
from app.domain.providers.schemas import ModelParameter, ModelVersionCostSignal, UIGroup
from pydantic import ValidationError

print("=== Implemented Schemas Verification ===")

# 1. Test Model Parameter
try:
    p1 = ModelParameter(
        name="width",
        type="integer",
        default=1024,
        min=256,
        max=2048,
        ui_group="format"
    )
    print(f"✅ Valid Parameter Created: {p1.name} ({p1.ui_group})")
except ValidationError as e:
    print(f"❌ Parameter Validation Failed: {e}")

# 2. Test Invalid Group Fallback
p2 = ModelParameter(name="test", type="string", ui_group="invalid_group")
if p2.ui_group == "other":
    print(f"✅ Invalid UI group fallback works: 'invalid_group' -> '{p2.ui_group}'")
else:
    print(f"❌ Fallback failed, got: {p2.ui_group}")

# 3. Test Cost Signal
try:
    c1 = ModelVersionCostSignal(
        cost_model="by_time",
        unit_price=0.0023,
        unit="second",
        price_source="manual"
    )
    print(f"✅ Valid Cost Signal Created: {c1.cost_model}, ${c1.unit_price}/{c1.unit}")
except ValidationError as e:
    print(f"❌ Cost Signal Validation Failed: {e}")

print("=== Verification Complete ===")
