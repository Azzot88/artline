import type {
  ModelParameter,
  ModelParameterConfig,
  ModelVersionCostSignals,
  ModelWithParameters
} from "@/polymet/data/types"
import { aiModels } from "@/polymet/data/models-data"

// Mock parameters for DALL-E 3
const dalleParameters: ModelParameter[] = [
  {
    id: "dalle3-param-1",
    version_id: "dalle-3",
    name: "prompt",
    type: "string",
    default_value: "",
    required: true,
    ui_group: "core",
    created_at: new Date().toISOString()
  },
  {
    id: "dalle3-param-format",
    version_id: "dalle-3",
    name: "format",
    type: "string",
    default_value: "1:1",
    enum: ["1:1", "2:3", "3:2"],
    required: true,
    ui_group: "format",
    created_at: new Date().toISOString()
  },
  {
    id: "dalle3-param-2",
    version_id: "dalle-3",
    name: "size",
    type: "string",
    default_value: "1024x1024",
    enum: ["1024x1024", "1792x1024", "1024x1792"],
    required: false,
    ui_group: "format",
    created_at: new Date().toISOString()
  },
  {
    id: "dalle3-param-3",
    version_id: "dalle-3",
    name: "quality",
    type: "string",
    default_value: "standard",
    enum: ["standard", "hd"],
    required: false,
    ui_group: "quality",
    created_at: new Date().toISOString()
  },
  {
    id: "dalle3-param-4",
    version_id: "dalle-3",
    name: "style",
    type: "string",
    default_value: "vivid",
    enum: ["vivid", "natural"],
    required: false,
    ui_group: "advanced",
    created_at: new Date().toISOString()
  }
]

// Mock parameters for SDXL
const sdxlParameters: ModelParameter[] = [
  {
    id: "sdxl-param-1",
    version_id: "sdxl",
    name: "prompt",
    type: "string",
    default_value: "",
    required: true,
    ui_group: "core",
    created_at: new Date().toISOString()
  },
  {
    id: "sdxl-param-2",
    version_id: "sdxl",
    name: "negative_prompt",
    type: "string",
    default_value: "",
    required: false,
    ui_group: "core",
    created_at: new Date().toISOString()
  },
  {
    id: "sdxl-param-format",
    version_id: "sdxl",
    name: "format",
    type: "string",
    default_value: "1:1",
    enum: ["1:1", "2:3", "3:2", "16:9", "9:16"],
    required: true,
    ui_group: "format",
    created_at: new Date().toISOString()
  },
  {
    id: "sdxl-param-3",
    version_id: "sdxl",
    name: "width",
    type: "integer",
    default_value: 1024,
    min: 512,
    max: 2048,
    enum: [512, 768, 1024, 1536, 2048],
    required: false,
    ui_group: "format",
    created_at: new Date().toISOString()
  },
  {
    id: "sdxl-param-4",
    version_id: "sdxl",
    name: "height",
    type: "integer",
    default_value: 1024,
    min: 512,
    max: 2048,
    enum: [512, 768, 1024, 1536, 2048],
    required: false,
    ui_group: "format",
    created_at: new Date().toISOString()
  },
  {
    id: "sdxl-param-5",
    version_id: "sdxl",
    name: "num_inference_steps",
    type: "integer",
    default_value: 30,
    min: 1,
    max: 100,
    required: false,
    ui_group: "quality",
    created_at: new Date().toISOString()
  },
  {
    id: "sdxl-param-6",
    version_id: "sdxl",
    name: "guidance_scale",
    type: "number",
    default_value: 7.5,
    min: 1,
    max: 20,
    required: false,
    ui_group: "quality",
    created_at: new Date().toISOString()
  },
  {
    id: "sdxl-param-7",
    version_id: "sdxl",
    name: "seed",
    type: "integer",
    default_value: null,
    min: 0,
    max: 2147483647,
    required: false,
    ui_group: "advanced",
    created_at: new Date().toISOString()
  },
  {
    id: "sdxl-param-8",
    version_id: "sdxl",
    name: "scheduler",
    type: "string",
    default_value: "K_EULER",
    enum: ["K_EULER", "K_EULER_ANCESTRAL", "K_DPM_2", "K_DPM_2_ANCESTRAL", "K_DPMPP_2M"],
    required: false,
    ui_group: "advanced",
    created_at: new Date().toISOString()
  },
  {
    id: "sdxl-param-9",
    version_id: "sdxl",
    name: "refine",
    type: "string",
    default_value: "no_refiner",
    enum: ["no_refiner", "expert_ensemble_refiner", "base_image_refiner"],
    required: false,
    ui_group: "quality",
    created_at: new Date().toISOString()
  },
  {
    id: "sdxl-param-10",
    version_id: "sdxl",
    name: "disable_safety_checker",
    type: "boolean",
    default_value: false,
    required: false,
    ui_group: "safety",
    created_at: new Date().toISOString()
  }
]

// Mock parameters for Runway Gen-2
const runwayGen2Parameters: ModelParameter[] = [
  {
    id: "gen2-param-1",
    version_id: "runway-gen2",
    name: "prompt",
    type: "string",
    default_value: "",
    required: true,
    ui_group: "core",
    created_at: new Date().toISOString()
  },
  {
    id: "gen2-param-2",
    version_id: "runway-gen2",
    name: "init_image",
    type: "string",
    default_value: null,
    required: false,
    ui_group: "core",
    created_at: new Date().toISOString()
  },
  {
    id: "gen2-param-format",
    version_id: "runway-gen2",
    name: "format",
    type: "string",
    default_value: "16:9",
    enum: ["16:9", "9:16", "1:1"],
    required: true,
    ui_group: "format",
    created_at: new Date().toISOString()
  },
  {
    id: "gen2-param-3",
    version_id: "runway-gen2",
    name: "duration",
    type: "integer",
    default_value: 4,
    min: 4,
    max: 10,
    enum: [4, 5, 6, 7, 8, 9, 10],
    required: false,
    ui_group: "format",
    created_at: new Date().toISOString()
  },
  {
    id: "gen2-param-4",
    version_id: "runway-gen2",
    name: "resolution",
    type: "string",
    default_value: "1920x1080",
    enum: ["1280x720", "1920x1080", "720x1280", "1080x1920", "1024x1024"],
    required: false,
    ui_group: "format",
    created_at: new Date().toISOString()
  },
  {
    id: "gen2-param-5",
    version_id: "runway-gen2",
    name: "motion_score",
    type: "integer",
    default_value: 5,
    min: 1,
    max: 10,
    required: false,
    ui_group: "quality",
    created_at: new Date().toISOString()
  },
  {
    id: "gen2-param-6",
    version_id: "runway-gen2",
    name: "seed",
    type: "integer",
    default_value: null,
    min: 0,
    max: 2147483647,
    required: false,
    ui_group: "advanced",
    created_at: new Date().toISOString()
  }
]

// Parameter configurations (what's enabled in admin)
const dalleParameterConfigs: ModelParameterConfig[] = [
  {
    parameter_id: "dalle3-param-1",
    enabled: true,
    display_order: 1,
    custom_label: "Описание изображения"
  },
  {
    parameter_id: "dalle3-param-format",
    enabled: true,
    display_order: 2,
    custom_label: "Формат",
    allowed_values: ["1:1", "2:3", "3:2"] // Admin configured formats
  },
  {
    parameter_id: "dalle3-param-2",
    enabled: true, // Enabled size parameter
    display_order: 3,
    custom_label: "Размер"
  },
  {
    parameter_id: "dalle3-param-3",
    enabled: true,
    display_order: 4,
    custom_label: "Качество"
  },
  {
    parameter_id: "dalle3-param-4",
    enabled: false, // Admin disabled style parameter
    display_order: 5
  }
]

const sdxlParameterConfigs: ModelParameterConfig[] = [
  {
    parameter_id: "sdxl-param-1",
    enabled: true,
    display_order: 1,
    custom_label: "Промпт"
  },
  {
    parameter_id: "sdxl-param-2",
    enabled: true,
    display_order: 2,
    custom_label: "Негативный промпт"
  },
  {
    parameter_id: "sdxl-param-format",
    enabled: true,
    display_order: 3,
    custom_label: "Формат",
    allowed_values: ["1:1", "2:3", "3:2", "16:9"] // Admin configured formats
  },
  {
    parameter_id: "sdxl-param-3",
    enabled: false, // Hidden - width is calculated from format
    display_order: 4,
    custom_label: "Ширина"
  },
  {
    parameter_id: "sdxl-param-4",
    enabled: false, // Hidden - height is calculated from format
    display_order: 5,
    custom_label: "Высота"
  },
  {
    parameter_id: "sdxl-param-5",
    enabled: true,
    display_order: 6,
    custom_label: "Шаги генерации",
    override_default: 40 // Admin changed default from 30 to 40
  },
  {
    parameter_id: "sdxl-param-6",
    enabled: true,
    display_order: 7,
    custom_label: "CFG Scale"
  },
  {
    parameter_id: "sdxl-param-7",
    enabled: false, // Disabled to stay within 4 parameter limit
    display_order: 8,
    custom_label: "Seed"
  },
  {
    parameter_id: "sdxl-param-8",
    enabled: false, // Disabled to stay within 4 parameter limit
    display_order: 9,
    custom_label: "Планировщик"
  },
  {
    parameter_id: "sdxl-param-9",
    enabled: false, // Admin disabled refiner
    display_order: 10
  },
  {
    parameter_id: "sdxl-param-10",
    enabled: false, // Admin disabled safety checker toggle
    display_order: 11
  }
]

const runwayGen2ParameterConfigs: ModelParameterConfig[] = [
  {
    parameter_id: "gen2-param-1",
    enabled: true,
    display_order: 1,
    custom_label: "Описание видео"
  },
  {
    parameter_id: "gen2-param-2",
    enabled: false, // Disabled - init_image is handled separately in UI
    display_order: 2,
    custom_label: "Исходное изображение"
  },
  {
    parameter_id: "gen2-param-format",
    enabled: true,
    display_order: 3,
    custom_label: "Формат",
    allowed_values: ["16:9", "9:16", "1:1"] // Admin configured formats
  },
  {
    parameter_id: "gen2-param-3",
    enabled: true,
    display_order: 4,
    custom_label: "Длительность (сек)",
    allowed_values: [4, 5, 6, 8, 10] // Admin removed 7 and 9 seconds
  },
  {
    parameter_id: "gen2-param-4",
    enabled: true,
    display_order: 5,
    custom_label: "Разрешение",
    allowed_values: ["1280x720", "1920x1080", "720x1280", "1080x1920"] // Admin configured resolutions
  },
  {
    parameter_id: "gen2-param-5",
    enabled: false, // Disabled to stay within 4 parameter limit (format, duration, resolution, + 1 more)
    display_order: 6,
    custom_label: "Интенсивность движения"
  },
  {
    parameter_id: "gen2-param-6",
    enabled: false, // Admin disabled seed for simplicity
    display_order: 7
  }
]

// Cost signals
const dalleCostSignals: ModelVersionCostSignals = {
  id: "cost-dalle3",
  version_id: "dalle-3",
  cost_model: "by_fixed",
  currency: "USD",
  fixed_price_per_run: 0.04,
  price_source: "provider_contract",
  hardware_class: "OpenAI Cloud",
  avg_predict_time_sec: 8,
  p50_predict_time_sec: 7,
  p95_predict_time_sec: 12,
  avg_outputs_per_run: 1,
  notes: "Fixed pricing from OpenAI. HD quality costs 2x more.",
  updated_at: new Date().toISOString()
}

const sdxlCostSignals: ModelVersionCostSignals = {
  id: "cost-sdxl",
  version_id: "sdxl",
  cost_model: "by_time",
  currency: "USD",
  unit: "second",
  unit_price: 0.0023,
  price_source: "observed",
  hardware_class: "A100 40GB",
  avg_predict_time_sec: 12,
  p50_predict_time_sec: 10,
  p95_predict_time_sec: 18,
  avg_outputs_per_run: 1,
  notes: "Cost varies based on steps and resolution. Higher steps = longer time.",
  updated_at: new Date().toISOString()
}

const runwayGen2CostSignals: ModelVersionCostSignals = {
  id: "cost-gen2",
  version_id: "runway-gen2",
  cost_model: "by_time",
  currency: "USD",
  unit: "second",
  unit_price: 0.05,
  price_source: "provider_contract",
  hardware_class: "Runway Cloud",
  avg_predict_time_sec: 120,
  p50_predict_time_sec: 100,
  p95_predict_time_sec: 180,
  avg_outputs_per_run: 1,
  notes: "Cost scales linearly with video duration. 4 sec = ~$6, 10 sec = ~$15",
  updated_at: new Date().toISOString()
}

// Combine all data
export const modelParameters: Record<string, ModelParameter[]> = {
  "dalle-3": dalleParameters,
  "sdxl": sdxlParameters,
  "runway-gen2": runwayGen2Parameters
}

export const modelParameterConfigs: Record<string, ModelParameterConfig[]> = {
  "dalle-3": dalleParameterConfigs,
  "sdxl": sdxlParameterConfigs,
  "runway-gen2": runwayGen2ParameterConfigs
}

export const modelCostSignals: Record<string, ModelVersionCostSignals> = {
  "dalle-3": dalleCostSignals,
  "sdxl": sdxlCostSignals,
  "runway-gen2": runwayGen2CostSignals
}

// Helper functions
export function getModelParameters(modelId: string): ModelParameter[] {
  return modelParameters[modelId] || []
}

export function getModelParameterConfigs(modelId: string): ModelParameterConfig[] {
  return modelParameterConfigs[modelId] || []
}

export function getModelCostSignals(modelId: string): ModelVersionCostSignals | undefined {
  return modelCostSignals[modelId]
}

export function getEnabledParameters(modelId: string): ModelParameter[] {
  const params = getModelParameters(modelId)
  const configs = getModelParameterConfigs(modelId)

  const enabledParamIds = new Set(
    configs.filter(c => c.enabled).map(c => c.parameter_id)
  )

  return params.filter(p => enabledParamIds.has(p.id))
}

export function getParametersByGroup(modelId: string, group: string): ModelParameter[] {
  const params = getEnabledParameters(modelId)
  return params.filter(p => p.ui_group === group)
}

export function getModelWithParameters(modelId: string): ModelWithParameters | undefined {
  const model = aiModels.find(m => m.id === modelId)
  if (!model) return undefined

  return {
    model,
    parameters: getModelParameters(modelId),
    parameter_configs: getModelParameterConfigs(modelId),
    cost_signals: getModelCostSignals(modelId)
  }
}

// Get parameter config for a specific parameter
export function getParameterConfig(
  modelId: string,
  parameterId: string
): ModelParameterConfig | undefined {
  const configs = getModelParameterConfigs(modelId)
  return configs.find(c => c.parameter_id === parameterId)
}

// Get effective default value (considering admin override)
export function getEffectiveDefault(
  parameter: ModelParameter,
  config?: ModelParameterConfig
): any {
  if (config?.override_default !== undefined) {
    return config.override_default
  }
  return parameter.default_value
}

// Get allowed values (considering admin restrictions)
export function getAllowedValues(
  parameter: ModelParameter,
  config?: ModelParameterConfig
): any[] | undefined {
  if (config?.allowed_values && config.allowed_values.length > 0) {
    return config.allowed_values
  }
  return parameter.enum
}

// Get display label (considering admin custom label)
export function getParameterLabel(
  parameter: ModelParameter,
  config?: ModelParameterConfig
): string {
  return config?.custom_label || parameter.name
}