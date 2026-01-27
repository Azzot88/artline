/**
 * Centralized Type Definitions
 * 
 * All types are aligned with the backend database schema.
 * This file serves as a single source of truth for TypeScript types.
 */

// Re-export all types from data files
export type {
  // Generation types
  Generation,
  JobStatus,
  JobKind,
  InputType,
  FormatType,
  ResolutionType
} from "@/polymet/data/generations-data"

import type { AIModel, Provider, ModelStatus, ModelKind } from "@/polymet/data/models-data"

export type {
  // Model types
  AIModel,
  Provider,
  ModelStatus,
  ModelKind
}

export type {
  // User types
  User,
  LedgerEntry,
  Like,
  GuestProfile,
  LanguageCode
} from "@/polymet/data/user-data"

// API Response types (for future backend integration)
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  has_more: boolean
}

// API Request types
export interface CreateGenerationRequest {
  prompt: string
  model_id: string
  input_type: "text" | "image"
  input_image_url?: string
  format: "square" | "portrait" | "landscape"
  resolution: "720" | "1080" | "4k"
  duration?: number
  is_public?: boolean
}

export interface UpdateUserRequest {
  username?: string
  avatar_url?: string
  language?: "ru" | "kk" | "ky" | "en"
}

export interface PurchaseCreditsRequest {
  amount: number
  payment_method: string
  payment_currency: string
}

// WebSocket message types (for real-time updates)
export interface GenerationProgressMessage {
  job_id: string
  status: "queued" | "running" | "succeeded" | "failed"
  progress: number
  result_url?: string
  error_message?: string
}

// Filter and sort types
export interface GenerationFilters {
  kind?: "image" | "video"
  status?: "queued" | "running" | "succeeded" | "failed"
  is_public: boolean
  is_curated: boolean
  is_private?: boolean
  likes: number
  views: number
  model_id?: string
}

export interface GenerationSort {
  field: "created_at" | "likes" | "views" | "credits_spent"
  order: "asc" | "desc"
}

// Constants
export const JOB_STATUSES = ["queued", "running", "succeeded", "failed"] as const
export const JOB_KINDS = ["image", "video"] as const
export const INPUT_TYPES = ["text", "image"] as const
// Format types for images and videos
export const IMAGE_FORMAT_TYPES = ["1:1", "2:3", "3:2", "16:9", "9:16", "21:9", "9:21", "4:5", "5:4", "4:3", "3:4"] as const
export const VIDEO_FORMAT_TYPES = ["16:9", "9:16", "1:1", "21:9", "4:5", "5:4"] as const
export const FORMAT_TYPES = ["square", "portrait", "landscape"] as const // Legacy
export const RESOLUTION_TYPES = ["720", "1080", "4k"] as const

// Format to resolution mapping
export type ImageFormatType = typeof IMAGE_FORMAT_TYPES[number]
export type VideoFormatType = typeof VIDEO_FORMAT_TYPES[number]

export interface FormatResolutionMap {
  format: ImageFormatType | VideoFormatType
  resolutions: string[] // e.g., ["1024x1024", "512x512"]
  default: string
}

// Resolution to format conversion
export function resolutionToFormat(resolution: string): ImageFormatType | VideoFormatType | null {
  const [width, height] = resolution.split('x').map(Number)
  if (!width || !height) return null

  const ratio = width / height

  // Image formats
  if (Math.abs(ratio - 1) < 0.1) return "1:1" // Square
  if (Math.abs(ratio - 2 / 3) < 0.1) return "2:3" // Portrait
  if (Math.abs(ratio - 3 / 2) < 0.1) return "3:2" // Landscape
  if (Math.abs(ratio - 16 / 9) < 0.1) return "16:9" // Wide
  if (Math.abs(ratio - 9 / 16) < 0.1) return "9:16" // Tall

  return null
}

export function formatToResolutions(format: ImageFormatType | VideoFormatType, quality: 'sd' | 'hd' | '4k' = 'hd'): string[] {
  const resolutionMap: Record<string, Record<string, string[]>> = {
    "1:1": {
      sd: ["512x512"],
      hd: ["1024x1024"],
      "4k": ["2048x2048"]
    },
    "2:3": {
      sd: ["512x768"],
      hd: ["1024x1536"],
      "4k": ["2048x3072"]
    },
    "3:2": {
      sd: ["768x512"],
      hd: ["1536x1024"],
      "4k": ["3072x2048"]
    },
    "16:9": {
      sd: ["1024x576", "1280x720"],
      hd: ["1920x1080"],
      "4k": ["3840x2160"]
    },
    "9:16": {
      sd: ["576x1024", "720x1280"],
      hd: ["1080x1920"],
      "4k": ["2160x3840"]
    }
  }

  return resolutionMap[format]?.[quality] || []
}
export const LANGUAGE_CODES = ["ru", "kk", "ky", "en"] as const
export const PARAMETER_TYPES = ["string", "integer", "number", "boolean", "array", "object"] as const
export const UI_GROUPS = ["core", "format", "quality", "advanced", "safety", "debug", "other"] as const
export const COST_MODELS = ["by_time", "by_fixed", "by_credits", "unknown"] as const

// Type guards
export function isJobStatus(value: string): value is JobStatus {
  return JOB_STATUSES.includes(value as JobStatus)
}

export function isJobKind(value: string): value is JobKind {
  return JOB_KINDS.includes(value as JobKind)
}

export function isLanguageCode(value: string): value is LanguageCode {
  return LANGUAGE_CODES.includes(value as LanguageCode)
}

// Model Parameters (from Replicate schema)
export type ParameterType = "string" | "integer" | "number" | "boolean" | "array" | "object"
export type UIGroup = "core" | "format" | "quality" | "advanced" | "safety" | "debug" | "other"

export interface ModelParameter {
  id: string
  version_id: string
  name: string
  type: ParameterType
  default_value: any // JSONB - can be string, number, array, object, etc.
  min?: number
  max?: number
  enum?: any[] // JSONB array
  required: boolean
  ui_group: UIGroup
  created_at: string
  options?: { label: string, value: any }[]
}

// Model Version Cost Signals
export type CostModel = "by_time" | "by_fixed" | "by_credits" | "unknown"
export type PriceSource = "manual" | "observed" | "provider_contract"

export interface ModelVersionCostSignals {
  id: string
  version_id: string
  cost_model: CostModel
  currency: string
  unit?: string
  unit_price?: number
  fixed_price_per_run?: number
  price_source: PriceSource
  hardware_class?: string
  avg_predict_time_sec?: number
  p50_predict_time_sec?: number
  p95_predict_time_sec?: number
  avg_outputs_per_run?: number
  notes?: string
  updated_at: string
}

// Admin Configuration for Model Parameters
export interface ModelParameterConfig {
  parameter_id: string
  enabled: boolean // Show in Workbench UI
  display_order: number
  custom_label?: string // Override parameter name for UI
  custom_description?: string
  allowed_values?: any[] // Subset of enum values, if applicable
  allowed_range?: { min?: number, max?: number, step?: number }
  override_default?: any // Admin can override default value

  // New UI hints
  is_advanced?: boolean // Hide behind "Advanced" toggle
  description?: string // Tooltip text
  component_type?: "slider" | "input" | "select" | "switch" | "textarea" | "color" | "file"

  // Phase 7: Dynamic Config Engine
  access_tiers?: string[] // ["starter", "pro", "studio"]
  allowed_file_types?: string[]
  pricing_rules?: PricingRule[]
}


export interface PricingRule {
  id: string
  param_id: string
  operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "in" | "contains"
  value: any
  surcharge: number
  label?: string
}

export interface UIParameterConfig extends ModelParameterConfig {
  // Alias for clearer usage in new components
  visible: boolean
}


export interface ModelParameter {
  id: string
  version_id: string
  name: string
  type: ParameterType
  default_value: any // JSONB
  min?: number
  max?: number
  enum?: any[] // JSONB array
  required: boolean
  ui_group: UIGroup
  created_at: string
  options?: { label: string, value: any }[]

  // Extended Metadata from Schema
  step?: number
  description?: string
  format?: string
  dependencies?: string[] // Names of params this depends on
}

// Extended Model with Parameters
export interface ModelWithParameters {
  model: AIModel
  parameters: ModelParameter[]
  parameter_configs: ModelParameterConfig[]
  cost_signals?: ModelVersionCostSignals
}

// Parameter value state (for Workbench)
export type ParameterValues = Record<string, any>

// Cost calculation result
export interface CostCalculation {
  credits: number
  currency: string
  estimated_time_sec?: number
  breakdown?: {
    base_cost: number
    parameter_modifiers: Record<string, number>
  }
}

// Import types for convenience
import type { JobStatus, JobKind } from "@/polymet/data/generations-data"
import type { LanguageCode } from "@/polymet/data/user-data"
// Helper functions for Parameters
export function getEffectiveDefault(
  parameter: ModelParameter,
  config?: ModelParameterConfig
): any {
  if (config?.override_default !== undefined) {
    return config.override_default
  }
  return parameter.default_value
}

export function getAllowedValues(
  parameter: ModelParameter,
  config?: ModelParameterConfig
): any[] | undefined {
  if (config?.allowed_values && config.allowed_values.length > 0) {
    return config.allowed_values
  }
  return parameter.enum
}

export function getParameterLabel(
  parameter: ModelParameter,
  config?: ModelParameterConfig
): string {
  return config?.custom_label || parameter.name
}
