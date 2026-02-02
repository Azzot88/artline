
from typing import List, Dict, Any, Optional
from app.domain.catalog.schemas import UIParameter, ModelUISpec, ParameterGroup, UIParameterConfig, PricingRule, ParameterOption
from app.domain.providers.models import AIModel
from app.domain.catalog.pipeline import SchemaProcessingPipeline

class CatalogService:
    def __init__(self):
        self.pipeline = SchemaProcessingPipeline()

    def resolve_ui_spec(self, model: AIModel, user_tier: str = "starter") -> ModelUISpec:
        return self.resolve_from_schema(
            model_id=str(model.id),
            raw_schema=model.raw_schema_json,
            ui_config=model.ui_config,
            user_tier=user_tier
        )

    def resolve_from_schema(
        self, 
        model_id: str, 
        raw_schema: Optional[Dict[str, Any]], 
        ui_config: Optional[Dict[str, Any]], 
        user_tier: str = "starter"
    ) -> ModelUISpec:
        """
        Generates UI Spec from raw data (decoupled from DB model).
        """
        if raw_schema is None:
             raise ValueError("Raw schema is required for resolution (even if empty)")

        spec, _ = self.pipeline.process(
            model_id=model_id,
            raw_schema=raw_schema,
            ui_config=ui_config or {},
            user_tier=user_tier
        )
        return spec
