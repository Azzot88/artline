
// This file is auto-generated based on Backend Pydantic Schemas.
// Source: app/domain/providers/schemas.py

export type ParameterType = "string" | "integer" | "number" | "boolean" | "array" | "object";
export type UIGroup = "core" | "format" | "quality" | "advanced" | "safety" | "debug" | "other";

export interface ModelParameter {
    name: string;
    type: ParameterType;
    default?: any;
    min?: number;
    max?: number;
    enum?: any[];
    required: boolean;
    ui_group: UIGroup;
}

export type CostModel = "by_time" | "by_fixed" | "by_credits" | "unknown";
export type PriceSource = "manual" | "observed" | "provider_contract";

export interface ModelVersionCostSignal {
    cost_model: CostModel;
    currency: string;
    unit?: string;
    unit_price?: number;
    fixed_price_per_run?: number;
    price_source: PriceSource;
    hardware_class?: string;

    // Stats
    avg_predict_time_sec?: number;
    p50_predict_time_sec?: number;
    p95_predict_time_sec?: number;
    avg_outputs_per_run?: number;

    notes?: string;
    updated_at: string; // ISO Date String
}

// Contract for AIModel with these new fields
export interface AIModel {
    id: string;
    display_name: string;
    provider: string;
    model_ref: string;
    is_active: boolean;

    // Improved Schema Fields
    param_schema: ModelParameter[] | null;
    cost_config: ModelVersionCostSignal | null;

    // ... other fields
}
