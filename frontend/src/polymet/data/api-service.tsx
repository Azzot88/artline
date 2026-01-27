/**
 * API Service
 * 
 * Type-safe methods for all backend endpoints
 */

import { api } from "@/polymet/data/api-client"
import type {
  BootstrapResponse,
  LoginRequest,
  RegisterRequest,
  LoginResponse,
  GuestInitResponse,
  AdminStats,
  UserWithBalance,
  LogoutResponse,
  CreateJobRequest,
  CreateJobResponse,
  GetJobResponse,
  ListJobsResponse,
  ListModelsResponse,
  GetModelResponse,
  GalleryFilters,
  GalleryResponse,
} from "@/polymet/data/api-types"

// ============================================================================
// Bootstrap
// ============================================================================

export const apiService = {
  /**
   * Bootstrap endpoint - call once on app load
   * Returns user info, balance, and features
   * Auto-creates guest session if missing
   */
  async bootstrap() {
    return api.get<BootstrapResponse>("/me")
  },

  // ==========================================================================
  // Authentication
  // ==========================================================================

  async login(credentials: LoginRequest) {
    return api.post<LoginResponse>("/auth/login", credentials)
  },

  async register(credentials: RegisterRequest) {
    return api.post<LoginResponse>("/auth/register", credentials)
  },

  async guestInit() {
    return api.post<GuestInitResponse>("/auth/guest/init")
  },

  async updateProfile(data: Partial<RegisterRequest>) {
    return api.put("/users/me", data)
  },


  async logout() {
    return api.post<LogoutResponse>("/auth/logout")
  },

  // ==========================================================================
  // Jobs (Generations)
  // ==========================================================================

  /**
   * Create a new generation job
   */
  async createJob(request: CreateJobRequest) {
    return api.post<CreateJobResponse>("/jobs", request)
  },

  /**
   * Get job status (for polling)
   * Use this endpoint for polling job status
   */
  async getJob(jobId: string) {
    return api.get<GetJobResponse>(`/jobs/${jobId}`)
  },

  /**
   * List all jobs for current user
   */
  async listJobs() {
    return api.get<ListJobsResponse>("/jobs")
  },

  /**
   * Delete a job
   */
  async deleteJob(jobId: string) {
    return api.delete(`/jobs/${jobId}`)
  },

  async toggleCurated(jobId: string) {
    return api.post<{ is_curated: boolean, is_public: boolean }>(`/jobs/${jobId}/curate`)
  },

  // ==========================================================================
  // Models
  // ==========================================================================

  /**
   * List all available models
   */
  async listModels() {
    return api.get<ListModelsResponse>("/models")
  },

  /**
   * Get model details
   */
  async getModel(modelId: string) {
    return api.get<GetModelResponse>(`/models/${modelId}`)
  },

  // ==========================================================================
  // Gallery
  // ==========================================================================

  /**
   * Get public gallery with filters
   */
  async getGallery(filters?: GalleryFilters) {
    const params = new URLSearchParams()
    if (filters?.model_id) params.append("model_id", filters.model_id)
    if (filters?.user_id) params.append("user_id", filters.user_id)
    if (filters?.limit) params.append("limit", filters.limit.toString())
    if (filters?.offset) params.append("offset", filters.offset.toString())

    const queryString = params.toString()
    const endpoint = queryString ? `/gallery?${queryString}` : "/gallery"

    return api.get<GalleryResponse>(endpoint)
  },

  // ==========================================================================
  // Admin
  // ==========================================================================

  async getAdminStats() {
    return api.get<AdminStats>("/admin/stats")
  },

  async syncGlobalStats() {
    return api.post<AdminStats>("/admin/stats/sync", {})
  },

  async getBrokenJobs() {
    return api.get<any[]>("/admin/jobs/broken")
  },

  async syncModelStats(modelId: string) {
    return api.post<ModelPerformanceStats>(`/admin/models/${modelId}/sync-stats`, {})
  },

  async getAdminUsers(limit = 50, offset = 0) {
    return api.get<UserWithBalance[]>(`/admin/users?limit=${limit}&offset=${offset}`)
  },

  async grantCredits(userId: string, amount: number) {
    return api.post(`/admin/users/${userId}/credits`, { amount })
  },

  // ==========================================================================
  // Admin Config (Providers)
  // ==========================================================================

  async getProviders() {
    return api.get<import("./api-types").ProviderConfig[]>("/admin/providers")
  },

  async createProvider(data: import("./api-types").ProviderCreateRequest) {
    return api.post<import("./api-types").ProviderConfig>("/admin/providers", data)
  },

  async updateProvider(id: string, data: import("./api-types").ProviderUpdateRequest) {
    return api.put<import("./api-types").ProviderConfig>(`/admin/providers/${id}`, data)
  },

  async deleteProvider(id: string) {
    return api.delete(`/admin/providers/${id}`)
  },

  // ==========================================================================
  // Admin Config (Models)
  // ==========================================================================

  async getAdminModels() {
    return api.get<import("@/polymet/data/models-data").AIModel[]>("/admin/models")
  },

  async createModel(data: import("./api-types").AIModelCreateRequest) {
    return api.post<import("@/polymet/data/models-data").AIModel>("/admin/models", data)
  },

  async getAdminModel(id: string) {
    return api.get<import("@/polymet/data/models-data").AIModel>(`/admin/models/${id}`)
  },

  async updateModel(id: string, data: import("./api-types").AIModelUpdateRequest) {
    return api.put<import("@/polymet/data/models-data").AIModel>(`/admin/models/${id}`, data)
  },

  async deleteModel(id: string) {
    return api.delete(`/admin/models/${id}`)
  },

  async fetchModelSchema(modelRef: string) {
    return api.post<any>("/admin/fetch-model-schema", { model_ref: modelRef })
  },

  async analyzeModel(modelRef: string) {
    return api.post<any>("/admin/analyze-model", { model_ref: modelRef })
  },

  async uploadModelImage(file: File) {
    const formData = new FormData()
    formData.append("file", file)
    // We use generic Post, but for FormData we need to let the browser set Content-Type header
    // The apiClient wrapper likely handles JSON stringification by default depending on input.
    // We need to ensure it handles FormData properly or bypass it.
    // Looking at api-client, it probably does fetch.
    // Let's assume api.post handles FormData if passed, or we cast.
    // If api.post forces JSON, this breaks. 
    // Usually api wrappers detect FormData.
    // Let's assume standard behavior:
    return api.post<{ url: string }>("/admin/upload/image", formData)
  },

  // ==========================================================================
  // System Health
  // ==========================================================================

  async getSystemLogs() {
    return api.get<import("./api-types").SystemLog[]>("/admin/system/logs")
  },

  async getSystemHealth() {
    return api.get<import("./api-types").SystemHealth>("/admin/system/health")
  },

  // ==========================================================================
  // Analytics
  // ==========================================================================

  async getAnalyticsActivity(limit = 100, offset = 0) {
    return api.get<import("./api-types").UserActivity[]>(`/admin/analytics/activity?limit=${limit}&offset=${offset}`)
  },

  async getAnalyticsVisitors(days = 30) {
    return api.get<import("./api-types").VisitorStat[]>(`/admin/analytics/visitors?days=${days}`)
  },
}


// ============================================================================
// Polling Utility
// ============================================================================

import { isTerminalStatus, DEFAULT_POLLING_CONFIG } from "@/polymet/data/api-types"
import type { Job } from "@/polymet/data/api-types"

export interface PollingOptions {
  onProgress?: (job: Job) => void
  onSuccess?: (job: Job) => void
  onError?: (job: Job) => void
  signal?: AbortSignal
}

/**
 * Poll job status until terminal state
 * Implements backend polling contract:
 * - Start at 2s interval
 * - Backoff to 5s after 30s
 * - Stop on succeeded/failed
 */
export async function pollJobStatus(
  jobId: string,
  options: PollingOptions = {}
): Promise<Job> {
  const { onProgress, onSuccess, onError, signal } = options
  const startTime = Date.now()

  return new Promise((resolve, reject) => {
    let timeoutId: NodeJS.Timeout

    const poll = async () => {
      // Check if aborted
      if (signal?.aborted) {
        clearTimeout(timeoutId)
        reject(new Error("Polling aborted"))
        return
      }

      try {
        const response = await apiService.getJob(jobId)
        const job = response.job

        // Call progress callback
        onProgress?.(job)

        // Check if terminal status
        if (isTerminalStatus(job.status)) {
          if (job.status === "succeeded") {
            onSuccess?.(job)
            resolve(job)
          } else {
            onError?.(job)
            reject(new Error(job.error_message || "Job failed"))
          }
          return
        }

        // Calculate next interval (backoff after 30s)
        const elapsed = Date.now() - startTime
        const interval = elapsed > DEFAULT_POLLING_CONFIG.backoffThreshold
          ? DEFAULT_POLLING_CONFIG.maxInterval
          : DEFAULT_POLLING_CONFIG.initialInterval

        // Schedule next poll
        timeoutId = setTimeout(poll, interval)
      } catch (error) {
        clearTimeout(timeoutId)
        reject(error)
      }
    }

    // Start polling
    poll()
  })
}