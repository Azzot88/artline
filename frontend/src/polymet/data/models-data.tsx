import { CapabilityType } from "@/polymet/data/capabilities"

// Backend-aligned types
export type ModelStatus = "active" | "inactive" | "maintenance"
export type ModelKind = "image" | "video"

export interface AIModel {
  // Core fields from backend
  id: string                             // UUID from backend
  display_name: string                   // Backend uses 'display_name'
  description: string                    // Model description
  provider: string                       // Provider name (e.g., "OpenAI", "Stability AI")
  model_ref: string                      // Provider's model ID

  // Status and configuration
  is_active: boolean                     // Backend uses 'is_active' instead of status enum
  ui_config?: {                          // JSON config for UI
    parameters?: Record<string, {
      enabled: boolean
      default?: any
      allowed_values?: any[]
      allowed_range?: { min?: number, max?: number, step?: number }
      custom_label?: string
    }>
  }
  cover_image_url?: string               // Model cover image

  // Backend Schema Fields
  raw_schema_json?: any
  param_schema?: any
  pricing_rules?: any[]

  // Capabilities
  modes?: CapabilityType[]               // Available modes (JSON in backend)
  resolutions?: string[]                 // Available resolutions (JSON in backend)
  capabilities: CapabilityType[]         // ["text-to-image", "image-to-image", "video"]

  // Pricing
  credits_per_generation: number         // Cost per generation

  // Statistics (cached)
  total_generations: number              // Total generations with this model
  average_rating?: number                // Average user rating

  // Timestamps
  created_at?: string                    // ISO 8601 timestamp
  updated_at?: string                    // ISO 8601 timestamp

  // Legacy/computed fields for backward compatibility
  name?: string                          // Alias for display_name
  type?: ModelKind                       // Computed from capabilities
  status?: ModelStatus                   // Computed from is_active
  credits?: number                       // Alias for credits_per_generation
  maxResolution?: string                 // Computed from resolutions array
  apiEndpoint?: string                   // Not in backend, frontend only
  lastUpdated?: string                   // Alias for updated_at
}

// Provider interface (from provider_configs table)
export interface Provider {
  // Core fields
  provider_id: string                    // Backend uses 'provider_id' (e.g., "replicate")
  encrypted_api_key?: string             // Encrypted API key (admin only)

  // Computed/aggregated fields (not in backend table)
  name?: string                          // Display name
  logo?: string                          // Logo URL
  status?: "active" | "inactive"         // Computed from models
  models_count?: number                  // Count of models
  total_generations?: number             // Total generations

  // Legacy fields for backward compatibility
  id?: string                            // Alias for provider_id
  modelsCount?: number                   // Alias for models_count
  totalGenerations?: number              // Alias for total_generations
  apiKey?: string                        // Alias for encrypted_api_key
}

export const providers: Provider[] = [
  {
    provider_id: "openai",
    name: "OpenAI",
    logo: "https://github.com/polymet-ai.png",
    status: "active",
    models_count: 2,
    total_generations: 15420,
    encrypted_api_key: "sk-...abc123",
    // Legacy
    id: "openai",
    modelsCount: 2,
    totalGenerations: 15420,
    apiKey: "sk-...abc123"
  },
  {
    provider_id: "stability",
    name: "Stability AI",
    logo: "https://github.com/polymet-ai.png",
    status: "active",
    models_count: 3,
    total_generations: 28950,
    encrypted_api_key: "sk-...def456",
    // Legacy
    id: "stability",
    modelsCount: 3,
    totalGenerations: 28950,
    apiKey: "sk-...def456"
  },
  {
    provider_id: "runway",
    name: "Runway",
    logo: "https://github.com/polymet-ai.png",
    status: "active",
    models_count: 2,
    total_generations: 8340,
    encrypted_api_key: "rw-...ghi789",
    // Legacy
    id: "runway",
    modelsCount: 2,
    totalGenerations: 8340,
    apiKey: "rw-...ghi789"
  },
  {
    provider_id: "midjourney",
    name: "Midjourney",
    logo: "https://github.com/polymet-ai.png",
    status: "inactive",
    models_count: 1,
    total_generations: 0,
    // Legacy
    id: "midjourney",
    modelsCount: 1,
    totalGenerations: 0
  }
]

export const aiModels: AIModel[] = [
  {
    id: "dalle-3",
    display_name: "DALL-E 3",
    description: "Latest DALL-E model with improved quality and prompt understanding",
    provider: "OpenAI",
    model_ref: "dall-e-3",
    is_active: true,
    ui_config: { default_steps: 50, default_cfg_scale: 7 },
    cover_image_url: "https://images.unsplash.com/photo-1706885093487-7eda37b48a60?w=400&h=300&fit=crop",
    modes: ["text-to-image"],
    resolutions: ["1024x1024", "1792x1024", "1024x1792"],
    capabilities: ["text-to-image", "high-quality", "natural-language"],
    credits_per_generation: 5,
    total_generations: 8234,
    average_rating: 4.7,
    created_at: "2023-11-01T00:00:00Z",
    updated_at: "2024-01-15T00:00:00Z",
    // Legacy
    name: "DALL-E 3",
    type: "image",
    status: "active",
    credits: 5,
    maxResolution: "1792x1024",
    apiEndpoint: "https://api.openai.com/v1/images/generations",
    lastUpdated: "2024-01-15"
  },
  {
    id: "dalle-2",
    display_name: "DALL-E 2",
    description: "Previous generation DALL-E model, more cost-effective",
    provider: "OpenAI",
    model_ref: "dall-e-2",
    is_active: true,
    ui_config: { default_steps: 50 },
    cover_image_url: "https://images.unsplash.com/photo-1706049379414-437ec3a54e93?w=400&h=300&fit=crop",
    modes: ["text-to-image", "image-editing"],
    resolutions: ["256x256", "512x512", "1024x1024"],
    capabilities: ["text-to-image", "image-editing"],
    credits_per_generation: 3,
    total_generations: 12456,
    average_rating: 4.3,
    created_at: "2022-04-01T00:00:00Z",
    updated_at: "2023-11-20T00:00:00Z",
    // Legacy
    name: "DALL-E 2",
    type: "image",
    status: "active",
    credits: 3,
    maxResolution: "1024x1024",
    apiEndpoint: "https://api.openai.com/v1/images/generations",
    lastUpdated: "2023-11-20"
  },
  {
    id: "sdxl",
    display_name: "Stable Diffusion XL",
    description: "High-quality open-source image generation model",
    provider: "Stability AI",
    model_ref: "stable-diffusion-xl-1024-v1-0",
    is_active: true,
    ui_config: { default_steps: 30, default_cfg_scale: 7, default_sampler: "K_DPMPP_2M" },
    cover_image_url: "https://images.unsplash.com/photo-1707343843437-caacff5cfa74?w=400&h=300&fit=crop",
    modes: ["text-to-image", "image-to-image", "inpainting"],
    resolutions: ["512x512", "768x768", "1024x1024"],
    capabilities: ["text-to-image", "image-to-image", "inpainting"],
    credits_per_generation: 4,
    total_generations: 15678,
    average_rating: 4.5,
    created_at: "2023-07-01T00:00:00Z",
    updated_at: "2024-01-10T00:00:00Z",
    // Legacy
    name: "Stable Diffusion XL",
    type: "image",
    status: "active",
    credits: 4,
    maxResolution: "1024x1024",
    apiEndpoint: "https://api.stability.ai/v1/generation/stable-diffusion-xl",
    lastUpdated: "2024-01-10"
  },
  {
    id: "sd-turbo",
    display_name: "SD Turbo",
    description: "Fast generation with lower quality, perfect for iterations",
    provider: "Stability AI",
    model_ref: "sd-turbo",
    is_active: true,
    ui_config: { default_steps: 1, default_cfg_scale: 1 },
    cover_image_url: "https://images.unsplash.com/photo-1706885093479-cabea61c7d7d?w=400&h=300&fit=crop",
    modes: ["text-to-image"],
    resolutions: ["512x512"],
    capabilities: ["text-to-image", "fast-generation"],
    credits_per_generation: 2,
    total_generations: 23456,
    average_rating: 3.9,
    created_at: "2023-11-01T00:00:00Z",
    updated_at: "2024-01-05T00:00:00Z",
    // Legacy
    name: "SD Turbo",
    type: "image",
    status: "active",
    credits: 2,
    maxResolution: "512x512",
    apiEndpoint: "https://api.stability.ai/v1/generation/sd-turbo",
    lastUpdated: "2024-01-05"
  },
  {
    id: "sd-3",
    display_name: "Stable Diffusion 3",
    description: "Next generation SD model with improved text rendering",
    provider: "Stability AI",
    model_ref: "stable-diffusion-3",
    is_active: false,
    ui_config: { default_steps: 40, default_cfg_scale: 7 },
    cover_image_url: "https://images.unsplash.com/photo-1707343848723-bd87dea7b118?w=400&h=300&fit=crop",
    modes: ["text-to-image"],
    resolutions: ["1024x1024", "1536x1536", "2048x2048"],
    capabilities: ["text-to-image", "text-rendering", "high-resolution"],
    credits_per_generation: 6,
    total_generations: 234,
    average_rating: 4.8,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-12T00:00:00Z",
    // Legacy
    name: "Stable Diffusion 3",
    type: "image",
    status: "maintenance",
    credits: 6,
    maxResolution: "2048x2048",
    lastUpdated: "2024-01-12"
  },
  {
    id: "runway-gen2",
    display_name: "Gen-2",
    description: "Text and image to video generation",
    provider: "Runway",
    model_ref: "gen-2",
    is_active: true,
    ui_config: { default_duration: 4, max_duration: 10 },
    cover_image_url: "https://images.unsplash.com/photo-1706885093487-7eda37b48a60?w=400&h=300&fit=crop",
    modes: ["text-to-video", "image-to-video"],
    resolutions: ["1280x768", "768x1280"],
    capabilities: ["text-to-video", "image-to-video", "4-10-seconds"],
    credits_per_generation: 15,
    total_generations: 4567,
    average_rating: 4.4,
    created_at: "2023-06-01T00:00:00Z",
    updated_at: "2024-01-08T00:00:00Z",
    // Legacy
    name: "Gen-2",
    type: "video",
    status: "active",
    credits: 15,
    maxResolution: "1280x768",
    apiEndpoint: "https://api.runwayml.com/v1/gen2",
    lastUpdated: "2024-01-08"
  },
  {
    id: "runway-gen3",
    display_name: "Gen-3 Alpha",
    description: "Latest video generation with improved motion and quality",
    provider: "Runway",
    model_ref: "gen-3-alpha",
    is_active: true,
    ui_config: { default_duration: 10, max_duration: 20 },
    cover_image_url: "https://images.unsplash.com/photo-1707343846610-e15d90d6b2d8?w=400&h=300&fit=crop",
    modes: ["text-to-video", "image-to-video"],
    resolutions: ["1920x1080", "1080x1920"],
    capabilities: ["text-to-video", "image-to-video", "10-20-seconds", "high-quality"],
    credits_per_generation: 25,
    total_generations: 1234,
    average_rating: 4.9,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-14T00:00:00Z",
    // Legacy
    name: "Gen-3 Alpha",
    type: "video",
    status: "active",
    credits: 25,
    maxResolution: "1920x1080",
    apiEndpoint: "https://api.runwayml.com/v1/gen3",
    lastUpdated: "2024-01-14"
  },
  {
    id: "midjourney-v6",
    display_name: "Midjourney v6",
    description: "Artistic image generation (coming soon)",
    provider: "Midjourney",
    model_ref: "midjourney-v6",
    is_active: false,
    ui_config: {},
    cover_image_url: "https://images.unsplash.com/photo-1707343844436-f8c86d1e6e46?w=400&h=300&fit=crop",
    modes: ["text-to-image"],
    resolutions: ["1024x1024", "2048x2048"],
    capabilities: ["text-to-image", "artistic-style", "high-detail"],
    credits_per_generation: 8,
    total_generations: 0,
    average_rating: 0,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    // Legacy
    name: "Midjourney v6",
    type: "image",
    status: "inactive",
    credits: 8,
    maxResolution: "2048x2048",
    lastUpdated: "2024-01-01"
  }
]

// Helper functions
export function getModelsByProvider(providerId: string): AIModel[] {
  return aiModels.filter(model =>
    model.provider.toLowerCase().replace(/\s+/g, '') === providerId
  )
}

export function getModelById(modelId: string): AIModel | undefined {
  return aiModels.find(model => model.id === modelId)
}

export function getProviderById(providerId: string): Provider | undefined {
  return providers.find(provider => provider.provider_id === providerId || provider.id === providerId)
}

export function getActiveModels(): AIModel[] {
  return aiModels.filter(model => model.is_active)
}

export function getModelsByKind(kind: ModelKind): AIModel[] {
  return aiModels.filter(model =>
    model.type === kind || model.capabilities.some(cap => cap.includes(kind))
  )
}

// Backward compatibility helpers
export function getModelName(model: AIModel): string {
  return model.display_name || model.name || ""
}

export function getModelCredits(model: AIModel): number {
  return model.credits_per_generation || model.credits || 0
}

export function isModelActive(model: AIModel): boolean {
  return model.is_active ?? (model.status === "active")
}