
from pydantic import BaseModel, Field, field_validator
from typing import Any, Literal, List, Optional
from datetime import datetime

# -----------------------------------------------------------------------------
# 1. Model Parameters Schema (for ai_models.param_schema)
# -----------------------------------------------------------------------------

ParameterType = Literal["string", "integer", "number", "boolean", "array", "object"]
UIGroup = Literal["core", "format", "quality", "advanced", "safety", "debug", "other"]

class ModelParameter(BaseModel):
    """
    Represents a single input parameter for an AI model.
    Stored in AIModel.param_schema as a list of these objects.
    """
    name: str = Field(description="Parameter name, e.g. 'width', 'prompt'")
    type: ParameterType = Field(description="JSON schema type")
    
    default: Any | None = Field(None, description="Default value (JSON)")
    min: float | None = Field(None, description="Minimum value for numbers")
    max: float | None = Field(None, description="Maximum value for numbers")
    enum: List[Any] | None = Field(None, description="Allowed values")
    
    required: bool = False
    ui_group: UIGroup = Field("other", description="UI grouping category")

    @field_validator("ui_group", mode="before")
    def set_ui_group(cls, v):
        # Allow fallback if invalid group passed, or simple derivation could happen here
        valid_groups = ["core", "format", "quality", "advanced", "safety", "debug", "other"]
        if v not in valid_groups:
            return "other"
        return v

# -----------------------------------------------------------------------------
# 2. Cost Signal Schema (for ai_models.costs or new field)
# -----------------------------------------------------------------------------

CostModel = Literal["by_time", "by_fixed", "by_credits", "unknown"]
PriceSource = Literal["manual", "observed", "provider_contract"]

class ModelVersionCostSignal(BaseModel):
    """
    Logic for calculating generation cost.
    Stored in separate JSON column or merged into stats.
    """
    cost_model: CostModel
    currency: str = "USD"
    
    unit: str | None = None # "second", "run", "output"
    unit_price: float | None = None # e.g. 0.0023
    
    fixed_price_per_run: float | None = None # e.g. 0.04
    
    price_source: PriceSource = "manual"
    hardware_class: str | None = None # "a100", "t4"
    
    # Observed Stats
    avg_predict_time_sec: float | None = None
    p50_predict_time_sec: float | None = None
    p95_predict_time_sec: float | None = None
    
    avg_outputs_per_run: float | None = None
    
    notes: str | None = None
    updated_at: datetime = Field(default_factory=datetime.now)

