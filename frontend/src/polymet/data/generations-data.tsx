// Backend-aligned types
export type JobStatus = "queued" | "running" | "succeeded" | "failed"
export type JobKind = "image" | "video"
export type InputType = "text" | "image"
export type FormatType = "square" | "portrait" | "landscape"
export type ResolutionType = "720" | "1080" | "4k"

export interface Generation {
  // Core fields from backend
  id: string
  kind: JobKind                          // Backend uses 'kind' instead of 'type'
  prompt: string
  status: JobStatus
  progress?: number                      // 0-100, for in-progress generations
  result_url?: string                    // URL of generated image/video
  
  // Input configuration
  input_type: InputType                  // "text" | "image"
  input_image_url?: string               // For img2img workflows
  
  // Generation parameters
  format: FormatType                     // "square" | "portrait" | "landscape"
  resolution: ResolutionType             // "720" | "1080" | "4k"
  duration?: number                      // Video duration in seconds
  
  // Model and provider
  model_id?: string                      // FK to ai_models.id
  model_name?: string                    // Display name (from JOIN)
  provider?: string                      // Provider name (from JOIN)
  
  // Billing
  credits_spent: number                  // Cost of this generation
  
  // Social features
  is_public: boolean                     // User made it public
  is_curated: boolean                    // Admin approved for gallery
  likes: number                          // Like count
  views: number                          // View count
  
  // Timestamps
  created_at: string                     // ISO 8601 timestamp
  completed_at?: string                  // When generation finished
  
  // User info (from JOIN with users table)
  user_id?: string
  user_name?: string                     // username field
  user_avatar?: string                   // avatar_url field
  
  // Legacy/computed fields for backward compatibility
  url?: string                           // Alias for result_url
  thumbnailUrl?: string                  // For video thumbnails
  width?: number                         // Computed from resolution
  height?: number                        // Computed from resolution
}

export const generations: Generation[] = [
  {
    id: "gen-001",
    kind: "image",
    prompt: "Футуристический город на закате с летающими машинами и неоновыми огнями",
    status: "succeeded",
    result_url: "https://images.unsplash.com/photo-1706885093487-7eda37b48a60?w=800&h=1200&fit=crop",
    input_type: "text",
    format: "portrait",
    resolution: "1080",
    model_name: "DALL-E 3",
    provider: "OpenAI",
    credits_spent: 5,
    is_public: true,
    is_curated: false,
    likes: 42,
    views: 156,
    created_at: "2024-01-15T14:30:00Z",
    completed_at: "2024-01-15T14:31:23Z",
    user_id: "user-1",
    user_name: "Yusuf Hilmi",
    user_avatar: "https://github.com/yusufhilmi.png",
    // Legacy fields
    url: "https://images.unsplash.com/photo-1706885093487-7eda37b48a60?w=800&h=1200&fit=crop",
    width: 800,
    height: 1200
  },
  {
    id: "gen-002",
    kind: "image",
    prompt: "Abstract geometric patterns in vibrant colors",
    status: "succeeded",
    result_url: "https://images.unsplash.com/photo-1707343843437-caacff5cfa74?w=1200&h=800&fit=crop",
    input_type: "text",
    format: "landscape",
    resolution: "1080",
    model_name: "Stable Diffusion XL",
    provider: "Stability AI",
    credits_spent: 4,
    is_public: true,
    is_curated: false,
    likes: 28,
    views: 89,
    created_at: "2024-01-15T13:15:00Z",
    completed_at: "2024-01-15T13:16:45Z",
    user_id: "user-2",
    user_name: "Kadir",
    user_avatar: "https://github.com/kdrnp.png",
    url: "https://images.unsplash.com/photo-1707343843437-caacff5cfa74?w=1200&h=800&fit=crop",
    width: 1200,
    height: 800
  },
  {
    id: "gen-003",
    kind: "image",
    prompt: "Минималистичный портрет женщины в черно-белом стиле",
    status: "succeeded",
    result_url: "https://images.unsplash.com/photo-1706049379414-437ec3a54e93?w=900&h=900&fit=crop",
    input_type: "text",
    format: "square",
    resolution: "1080",
    model_name: "DALL-E 2",
    provider: "OpenAI",
    credits_spent: 3,
    is_public: true,
    is_curated: true,
    likes: 56,
    views: 234,
    created_at: "2024-01-15T12:45:00Z",
    completed_at: "2024-01-15T12:46:12Z",
    user_id: "user-3",
    user_name: "Yahya Bedirhan",
    user_avatar: "https://github.com/yahyabedirhan.png",
    url: "https://images.unsplash.com/photo-1706049379414-437ec3a54e93?w=900&h=900&fit=crop",
    width: 900,
    height: 900
  },
  {
    id: "gen-004",
    kind: "image",
    prompt: "Сыйкырдуу токой жаркыраган козу карындар жана жарк чымындар менен",
    status: "succeeded",
    result_url: "https://images.unsplash.com/photo-1707343843982-f8275f3994c5?w=800&h=1000&fit=crop",
    input_type: "text",
    format: "portrait",
    resolution: "1080",
    model_name: "Stable Diffusion XL",
    provider: "Stability AI",
    credits_spent: 4,
    is_public: true,
    is_curated: true,
    likes: 73,
    views: 312,
    created_at: "2024-01-15T11:20:00Z",
    completed_at: "2024-01-15T11:21:34Z",
    user_id: "user-4",
    user_name: "Deniz Büyüktaş",
    user_avatar: "https://github.com/denizbuyuktas.png",
    url: "https://images.unsplash.com/photo-1707343843982-f8275f3994c5?w=800&h=1000&fit=crop",
    width: 800,
    height: 1000
  },
  {
    id: "gen-005",
    kind: "image",
    prompt: "Киберпанк көше базары голографиялық белгілермен",
    status: "succeeded",
    result_url: "https://images.unsplash.com/photo-1706885093463-f85b4e6a6b64?w=1100&h=700&fit=crop",
    input_type: "text",
    format: "landscape",
    resolution: "1080",
    model_name: "DALL-E 3",
    provider: "OpenAI",
    credits_spent: 5,
    is_public: true,
    is_curated: true,
    likes: 91,
    views: 445,
    created_at: "2024-01-15T10:00:00Z",
    completed_at: "2024-01-15T10:01:18Z",
    user_id: "user-5",
    user_name: "Shoaib",
    user_avatar: "https://github.com/shoaibux1.png",
    url: "https://images.unsplash.com/photo-1706885093463-f85b4e6a6b64?w=1100&h=700&fit=crop",
    width: 1100,
    height: 700
  },
  {
    id: "gen-006",
    kind: "image",
    prompt: "Тыныш таулы пейзаж солтүстік жарықпен",
    status: "succeeded",
    result_url: "https://images.unsplash.com/photo-1707343846610-e15d90d6b2d8?w=750&h=1100&fit=crop",
    input_type: "text",
    format: "portrait",
    resolution: "1080",
    model_name: "Stable Diffusion XL",
    provider: "Stability AI",
    credits_spent: 4,
    is_public: true,
    is_curated: false,
    likes: 64,
    views: 198,
    created_at: "2024-01-14T18:30:00Z",
    completed_at: "2024-01-14T18:31:22Z",
    user_id: "user-1",
    user_name: "Yusuf Hilmi",
    user_avatar: "https://github.com/yusufhilmi.png",
    url: "https://images.unsplash.com/photo-1707343846610-e15d90d6b2d8?w=750&h=1100&fit=crop",
    width: 750,
    height: 1100
  },
  {
    id: "gen-007",
    kind: "image",
    prompt: "Steampunk airship floating above clouds",
    status: "succeeded",
    result_url: "https://images.unsplash.com/photo-1706885093420-f48f72a8e228?w=1000&h=800&fit=crop",
    input_type: "text",
    format: "landscape",
    resolution: "1080",
    model_name: "DALL-E 3",
    provider: "OpenAI",
    credits_spent: 5,
    is_public: true,
    is_curated: false,
    likes: 38,
    views: 127,
    created_at: "2024-01-14T16:45:00Z",
    completed_at: "2024-01-14T16:46:33Z",
    user_id: "user-2",
    user_name: "Kadir",
    user_avatar: "https://github.com/kdrnp.png",
    url: "https://images.unsplash.com/photo-1706885093420-f48f72a8e228?w=1000&h=800&fit=crop",
    width: 1000,
    height: 800
  },
  {
    id: "gen-008",
    kind: "image",
    prompt: "Подводный город с биолюминесцентной архитектурой",
    status: "succeeded",
    result_url: "https://images.unsplash.com/photo-1707343848723-bd87dea7b118?w=900&h=1200&fit=crop",
    input_type: "text",
    format: "portrait",
    resolution: "1080",
    model_name: "Stable Diffusion XL",
    provider: "Stability AI",
    credits_spent: 4,
    is_public: true,
    is_curated: true,
    likes: 82,
    views: 367,
    created_at: "2024-01-14T15:20:00Z",
    completed_at: "2024-01-14T15:21:45Z",
    user_id: "user-3",
    user_name: "Yahya Bedirhan",
    user_avatar: "https://github.com/yahyabedirhan.png",
    url: "https://images.unsplash.com/photo-1707343848723-bd87dea7b118?w=900&h=1200&fit=crop",
    width: 900,
    height: 1200
  },
  {
    id: "gen-009",
    kind: "image",
    prompt: "Desert oasis with palm trees and crystal clear water",
    status: "succeeded",
    result_url: "https://images.unsplash.com/photo-1706885093479-cabea61c7d7d?w=1200&h=900&fit=crop",
    input_type: "text",
    format: "landscape",
    resolution: "1080",
    model_name: "SD Turbo",
    provider: "Stability AI",
    credits_spent: 2,
    is_public: true,
    is_curated: false,
    likes: 45,
    views: 178,
    created_at: "2024-01-14T14:00:00Z",
    completed_at: "2024-01-14T14:00:34Z",
    user_id: "user-4",
    user_name: "Deniz Büyüktaş",
    user_avatar: "https://github.com/denizbuyuktas.png",
    url: "https://images.unsplash.com/photo-1706885093479-cabea61c7d7d?w=1200&h=900&fit=crop",
    width: 1200,
    height: 900
  },
  {
    id: "gen-010",
    kind: "image",
    prompt: "Ancient temple ruins overgrown with vines",
    status: "succeeded",
    result_url: "https://images.unsplash.com/photo-1707343844436-f8c86d1e6e46?w=850&h=1100&fit=crop",
    input_type: "text",
    format: "portrait",
    resolution: "1080",
    model_name: "DALL-E 2",
    provider: "OpenAI",
    credits_spent: 3,
    is_public: true,
    is_curated: false,
    likes: 67,
    views: 223,
    created_at: "2024-01-14T12:30:00Z",
    completed_at: "2024-01-14T12:31:15Z",
    user_id: "user-5",
    user_name: "Shoaib",
    user_avatar: "https://github.com/shoaibux1.png",
    url: "https://images.unsplash.com/photo-1707343844436-f8c86d1e6e46?w=850&h=1100&fit=crop",
    width: 850,
    height: 1100
  },
  {
    id: "gen-011",
    kind: "image",
    prompt: "Ғарыштық тұман айналмалы түстермен және жұлдыздармен",
    status: "succeeded",
    result_url: "https://images.unsplash.com/photo-1706885093497-0a1c2b44a5e7?w=1000&h=1000&fit=crop",
    input_type: "text",
    format: "square",
    resolution: "1080",
    model_name: "Stable Diffusion XL",
    provider: "Stability AI",
    credits_spent: 4,
    is_public: true,
    is_curated: true,
    likes: 103,
    views: 521,
    created_at: "2024-01-14T11:00:00Z",
    completed_at: "2024-01-14T11:01:28Z",
    user_id: "user-1",
    user_name: "Yusuf Hilmi",
    user_avatar: "https://github.com/yusufhilmi.png",
    url: "https://images.unsplash.com/photo-1706885093497-0a1c2b44a5e7?w=1000&h=1000&fit=crop",
    width: 1000,
    height: 1000
  },
  {
    id: "gen-012",
    kind: "image",
    prompt: "Modern architecture with glass and steel",
    status: "succeeded",
    result_url: "https://images.unsplash.com/photo-1707343848552-893e05dba6ac?w=1100&h=800&fit=crop",
    input_type: "text",
    format: "landscape",
    resolution: "1080",
    model_name: "DALL-E 3",
    provider: "OpenAI",
    credits_spent: 5,
    is_public: true,
    is_curated: false,
    likes: 29,
    views: 94,
    created_at: "2024-01-14T09:45:00Z",
    completed_at: "2024-01-14T09:46:22Z",
    user_id: "user-2",
    user_name: "Kadir",
    user_avatar: "https://github.com/kdrnp.png",
    url: "https://images.unsplash.com/photo-1707343848552-893e05dba6ac?w=1100&h=800&fit=crop",
    width: 1100,
    height: 800
  },
  {
    id: "gen-013",
    kind: "video",
    prompt: "Cinematic drone shot flying through a futuristic neon city at night",
    status: "succeeded",
    result_url: "https://images.unsplash.com/photo-1706885093487-7eda37b48a60?w=1920&h=1080&fit=crop",
    thumbnailUrl: "https://images.unsplash.com/photo-1706885093487-7eda37b48a60?w=800&h=450&fit=crop",
    input_type: "text",
    format: "landscape",
    resolution: "1080",
    duration: 5,
    model_name: "Runway Gen-2",
    provider: "Runway",
    credits_spent: 15,
    is_public: true,
    is_curated: true,
    likes: 124,
    views: 678,
    created_at: "2024-01-15T16:00:00Z",
    completed_at: "2024-01-15T16:03:45Z",
    user_id: "user-1",
    user_name: "Yusuf Hilmi",
    user_avatar: "https://github.com/yusufhilmi.png",
    url: "https://images.unsplash.com/photo-1706885093487-7eda37b48a60?w=1920&h=1080&fit=crop",
    width: 1920,
    height: 1080
  },
  {
    id: "gen-014",
    kind: "video",
    prompt: "Таулардагы күн батышы, камера жайлап жылжып жатат",
    status: "succeeded",
    result_url: "https://images.unsplash.com/photo-1707343846610-e15d90d6b2d8?w=1920&h=1080&fit=crop",
    thumbnailUrl: "https://images.unsplash.com/photo-1707343846610-e15d90d6b2d8?w=800&h=450&fit=crop",
    input_type: "text",
    format: "landscape",
    resolution: "1080",
    duration: 4,
    model_name: "Pika Labs",
    provider: "Pika",
    credits_spent: 12,
    is_public: true,
    is_curated: false,
    likes: 87,
    views: 412,
    created_at: "2024-01-15T15:30:00Z",
    completed_at: "2024-01-15T15:33:12Z",
    user_id: "user-3",
    user_name: "Yahya Bedirhan",
    user_avatar: "https://github.com/yahyabedirhan.png",
    url: "https://images.unsplash.com/photo-1707343846610-e15d90d6b2d8?w=1920&h=1080&fit=crop",
    width: 1920,
    height: 1080
  },
  {
    id: "gen-015",
    kind: "video",
    prompt: "Океан толкундары жайлап жагалауга келип жатат, макро түсірілім",
    status: "succeeded",
    result_url: "https://images.unsplash.com/photo-1706885093463-f85b4e6a6b64?w=1920&h=1080&fit=crop",
    thumbnailUrl: "https://images.unsplash.com/photo-1706885093463-f85b4e6a6b64?w=800&h=450&fit=crop",
    input_type: "text",
    format: "landscape",
    resolution: "1080",
    duration: 3,
    model_name: "Stable Video Diffusion",
    provider: "Stability AI",
    credits_spent: 10,
    is_public: true,
    is_curated: false,
    likes: 56,
    views: 289,
    created_at: "2024-01-15T14:00:00Z",
    completed_at: "2024-01-15T14:02:34Z",
    user_id: "user-4",
    user_name: "Deniz Büyüktaş",
    user_avatar: "https://github.com/denizbuyuktas.png",
    url: "https://images.unsplash.com/photo-1706885093463-f85b4e6a6b64?w=1920&h=1080&fit=crop",
    width: 1920,
    height: 1080
  }
]

// Helper functions
export function getGenerationsByUser(userId: string): Generation[] {
  return generations.filter(gen => gen.user_id === userId)
}

export function getPublicGenerations(): Generation[] {
  return generations.filter(gen => gen.is_public)
}

export function getGenerationById(id: string): Generation | undefined {
  return generations.find(gen => gen.id === id)
}

export function getCuratedGenerations(): Generation[] {
  return generations.filter(gen => gen.is_public && gen.is_curated).sort((a, b) => b.likes - a.likes)
}

export function getGenerationsByStatus(status: JobStatus): Generation[] {
  return generations.filter(gen => gen.status === status)
}

export function getGenerationsByKind(kind: JobKind): Generation[] {
  return generations.filter(gen => gen.kind === kind)
}

// Backward compatibility helpers
export function getGenerationUrl(gen: Generation): string {
  return gen.result_url || gen.url || ""
}

export function getGenerationUserName(gen: Generation): string {
  return gen.user_name || ""
}

export function getGenerationUserAvatar(gen: Generation): string {
  return gen.user_avatar || ""
}