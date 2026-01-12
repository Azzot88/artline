/**
 * DATA LAYER DOCUMENTATION
 * 
 * This directory contains all data types, mock data, and helper functions
 * aligned with the backend database schema.
 */

// ============================================================================
// BACKEND SCHEMA ALIGNMENT
// ============================================================================

/**
 * All TypeScript types in this directory are aligned with the backend schema:
 * 
 * TABLES:
 * - users          → user-data.tsx (User interface)
 * - jobs           → generations-data.tsx (Generation interface)
 * - ai_models      → models-data.tsx (AIModel interface)
 * - provider_configs → models-data.tsx (Provider interface)
 * - ledger_entries → user-data.tsx (LedgerEntry interface)
 * - likes          → user-data.tsx (Like interface)
 * - guest_profiles → user-data.tsx (GuestProfile interface)
 */

// ============================================================================
// FIELD NAMING CONVENTIONS
// ============================================================================

/**
 * Backend uses snake_case, TypeScript uses snake_case for backend-aligned fields
 * 
 * BACKEND FIELD → TYPESCRIPT FIELD
 * --------------------------------
 * display_name    → display_name (primary)
 * name            → name (legacy alias)
 * 
 * is_active       → is_active (primary)
 * status          → status (computed from is_active)
 * 
 * result_url      → result_url (primary)
 * url             → url (legacy alias)
 * 
 * user_name       → user_name (from JOIN)
 * userName        → legacy camelCase
 */

// ============================================================================
// TYPE IMPORTS
// ============================================================================

/**
 * RECOMMENDED: Import from centralized types file
 * 
 * import type { 
  Generation, 
  AIModel, 
  User,
  ModelParameter,
  ModelParameterConfig,
  ModelVersionCostSignals,
  ModelWithParameters,
  ParameterValues,
  CostCalculation
} from "@/polymet/data/types"
 * 
 * ALTERNATIVE: Import directly from data files
 * 
 * import type { Generation } from "@/polymet/data/generations-data"
 * import type { AIModel } from "@/polymet/data/models-data"
 * import type { User } from "@/polymet/data/user-data"
 */

// ============================================================================
// BACKWARD COMPATIBILITY
// ============================================================================

/**
 * Legacy fields are maintained for backward compatibility:
 * 
 * Generation interface:
 * - url (alias for result_url)
 * - userName (alias for user_name)
 * - userAvatar (alias for user_avatar)
 * - type (alias for kind)
 * - credits (alias for credits_spent)
 * 
 * AIModel interface:
 * - name (alias for display_name)
 * - status (computed from is_active)
 * - credits (alias for credits_per_generation)
 * 
 * Helper functions are provided to access these fields safely:
 * - getGenerationUrl(gen)
 * - getModelName(model)
 * - getModelCredits(model)
 */

// ============================================================================
// MIGRATION GUIDE
// ============================================================================

/**
 * UPDATING EXISTING CODE:
 * 
 * 1. Replace old field names with new ones:
 *    gen.type          → gen.kind
 *    gen.url           → gen.result_url
 *    gen.userName      → gen.user_name
 *    gen.userAvatar    → gen.user_avatar
 *    gen.isPublic      → gen.is_public
 *    gen.isCurated     → gen.is_curated
 *    gen.createdAt     → gen.created_at
 * 
 * 2. Update model fields:
 *    model.name        → model.display_name
 *    model.status      → model.is_active
 *    model.credits     → model.credits_per_generation
 * 
 * 3. Update user fields:
 *    user.userName     → user.username
 *    user.avatarUrl    → user.avatar_url
 *    user.isAdmin      → user.is_admin
 *    user.createdAt    → user.created_at
 * 
 * 4. Use helper functions for safe access:
 *    getGenerationUrl(gen)
 *    getModelName(model)
 *    isModelActive(model)
 */

// ============================================================================
// NEW FIELDS ADDED
// ============================================================================

/**
 * GENERATION (jobs table):
 * - status: JobStatus              // "queued" | "running" | "succeeded" | "failed"
 * - progress: number               // 0-100 for in-progress generations
 * - input_type: InputType          // "text" | "image"
 * - input_image_url: string        // For img2img workflows
 * - format: FormatType             // "square" | "portrait" | "landscape"
 * - resolution: ResolutionType     // "720" | "1080" | "4k"
 * - duration: number               // Video duration in seconds
 * - model_id: string               // FK to ai_models.id
 * - credits_spent: number          // Cost of generation
 * - views: number                  // View count
 * - completed_at: string           // Completion timestamp
 * 
 * AI MODEL (ai_models table):
 * - model_ref: string              // Provider's model ID
 * - ui_config: object              // UI configuration
 * - cover_image_url: string        // Model cover image
 * - modes: string[]                // Available modes
 * - resolutions: string[]          // Available resolutions
 * - credits_per_generation: number // Cost per generation
 * - total_generations: number      // Total generations count
 * - average_rating: number         // Average user rating
 * - created_at: string             // Creation timestamp
 * - updated_at: string             // Update timestamp
 * 
 * USER (users table):
 * - username: string               // Display username
 * - avatar_url: string             // Avatar image URL
 * - balance: number                // Credits balance
 * - total_generations: number      // Total generations count
 * - language: LanguageCode         // Interface language
 * - updated_at: string             // Update timestamp
 * 
 * LEDGER ENTRY (ledger_entries table):
 * - related_job_id: string         // FK to jobs.id
 * - payment_amount: number         // Payment amount
 * - payment_currency: string       // Payment currency
 * - balance_before: number         // Balance before transaction
 * - balance_after: number          // Balance after transaction
 */

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * GENERATIONS:
 * - getGenerationsByUser(userId)
 * - getPublicGenerations()
 * - getGenerationById(id)
 * - getCuratedGenerations()
 * - getGenerationsByStatus(status)
 * - getGenerationsByKind(kind)
 * - getGenerationUrl(gen)
 * - getGenerationUserName(gen)
 * - getGenerationUserAvatar(gen)
 * 
 * MODELS:
 * - getModelsByProvider(providerId)
 * - getModelById(modelId)
 * - getProviderById(providerId)
 * - getActiveModels()
 * - getModelsByKind(kind)
 * - getModelName(model)
 * - getModelCredits(model)
 * - isModelActive(model)
 * 
 * USERS:
 * - getUserById(userId)
 * - getUserLedger(userId)
 * - getUserLikes(userId)
 * - hasUserLiked(userId, jobId)
 * - calculateUserBalance(userId)
 * - getUserTotalSpent(userId)
 */

// ============================================================================
// API INTEGRATION ✅ READY
// ============================================================================

/**
 * API Integration is ready! Use these files:
 * 
 * 1. API Client:
 *    - @/polymet/data/api-client.tsx      // HTTP client with error handling
 *    - @/polymet/data/api-types.tsx       // Request/response types
 *    - @/polymet/data/api-service.tsx     // Methods for all endpoints
 *    - @/polymet/data/API-INTEGRATION.tsx // Complete integration guide
 * 
 * 2. Quick Start:
 *    import { apiService } from "@/polymet/data/api-service"
 *    
 *    // Bootstrap on app load
 *    const { user, auth } = await apiService.bootstrap()
 *    
 *    // Create generation
 *    const { job } = await apiService.createJob({
 *      model_id: "dalle-3",
 *      prompt: "A cat",
 *      input_type: "text",
 *      parameters: {},
 *      is_public: true
 *    })
 *    
 *    // Poll job status
 *    import { pollJobStatus } from "@/polymet/data/api-service"
 *    const finalJob = await pollJobStatus(job.id, {
 *      onProgress: (job) => console.log(job.progress),
 *      onSuccess: (job) => console.log(job.result_url)
 *    })
 * 
 * 3. Setup (vite.config.ts):
 *    server: {
 *      proxy: {
 *        '/api': 'http://localhost:8000'
 *      }
 *    }
 * 
 * 4. Features:
 *    ✅ Type-safe API calls
 *    ✅ Automatic cookie handling (credentials: 'include')
 *    ✅ Error handling with error codes
 *    ✅ Job polling with backoff (2s → 5s)
 *    ✅ Terminal status detection (succeeded/failed)
 *    ✅ AbortSignal support for cancellation
 * 
 * 5. Migration from mock data:
 *    // Before:
 *    import { generations } from "@/polymet/data/generations-data"
 *    
 *    // After:
 *    const { jobs } = await apiService.listJobs()
 *    
 *    // Before:
 *    import { aiModels } from "@/polymet/data/models-data"
 *    
 *    // After:
 *    const { models } = await apiService.listModels()
 * 
 * 6. See API-INTEGRATION.tsx for complete documentation
 */

// ============================================================================
// EXAMPLE USAGE
// ============================================================================

/**
 * COMPONENT EXAMPLE:
 * 
 * import type { Generation } from "@/polymet/data/types"
 * import { getGenerationUrl } from "@/polymet/data/generations-data"
 * 
 * function GenerationCard({ generation }: { generation: Generation }) {
 *   const imageUrl = getGenerationUrl(generation)
 *   
 *   return (
 *     <div>
 *       <img src={imageUrl} alt={generation.prompt} />
 *       <p>{generation.prompt}</p>
 *       <span>{generation.likes} likes</span>
 *       <span>{generation.views} views</span>
 *       <span>{generation.credits_spent} credits</span>
 *     </div>
 *   )
 * }
 */

export {}
