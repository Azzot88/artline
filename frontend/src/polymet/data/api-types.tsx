/**
 * API Types - Backend Contract
 * 
 * All types aligned with backend API responses
 */

import type { Generation, AIModel, User, LedgerEntry } from "@/polymet/data/types"

// ============================================================================
// Job State Machine (Backend Contract)
// ============================================================================

export type JobStatus = "queued" | "processing" | "succeeded" | "failed"

export interface Job {
  id: string
  status: JobStatus
  result_url: string | null
  error_message: string | null
  progress: number
  synced: boolean

  // Additional fields
  model_id: string
  prompt: string
  input_type: "text" | "image" | "video"
  input_image_url?: string | null
  parameters: Record<string, any>
  is_public: boolean
  credits_cost: number
  user_id: string | null
  created_at: string
  updated_at: string
}

// ============================================================================
// Bootstrap Endpoint (/api/me)
// ============================================================================

export interface BootstrapResponse {
  user: {
    id: string | null
    email: string | null
    is_guest: boolean
  }
  auth: {
    mode: "user" | "guest"
    balance: number
  }
  features: {
    can_toggle_public: boolean
  }
}

// ============================================================================
// Authentication
// ============================================================================

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
}

export interface GuestInitResponse {
  guest_id: string
  balance: number
}

// ============================================================================
// Admin Types
// ============================================================================

export interface AdminStats {
  total_users: number
  total_jobs: number
  active_jobs: number
  total_credits: number
}

export interface UserWithBalance {
  id: string
  email: string
  is_active: boolean
  is_superuser: boolean
  is_admin: boolean
  balance: number
  created_at: string
}


export interface LoginResponse {
  ok: boolean
  user: User
}

export interface LogoutResponse {
  ok: boolean
}

// ============================================================================
// Jobs (Generations)
// ============================================================================

export interface CreateJobRequest {
  model_id: string
  prompt: string
  input_type: "text" | "image" | "video"
  input_image_url?: string
  parameters: Record<string, any>
  is_public: boolean
}

export interface CreateJobResponse {
  job: Job
}

export interface GetJobResponse {
  job: Job
}

export interface ListJobsResponse {
  jobs: Job[]
}

// ============================================================================
// Models
// ============================================================================

export interface ListModelsResponse {
  models: AIModel[]
}

export interface GetModelResponse {
  model: AIModel
}

// ============================================================================
// Gallery
// ============================================================================

export interface GalleryFilters {
  model_id?: string
  user_id?: string
  limit?: number
  offset?: number
}

export interface GalleryResponse {
  jobs: Job[]
  total: number
}

// ============================================================================
// Polling Contract
// ============================================================================

export interface PollingConfig {
  initialInterval: number // 2000ms
  maxInterval: number // 5000ms
  backoffThreshold: number // 30000ms (30s)
}

export const DEFAULT_POLLING_CONFIG: PollingConfig = {
  initialInterval: 2000,
  maxInterval: 5000,
  backoffThreshold: 30000,
}

// ============================================================================
// Helper Type Guards
// ============================================================================

export function isTerminalStatus(status: JobStatus): boolean {
  return status === "succeeded" || status === "failed"
}

export function isJobSucceeded(job: Job): job is Job & { result_url: string } {
  return job.status === "succeeded" && job.result_url !== null
}

export function isJobFailed(job: Job): job is Job & { error_message: string } {
  return job.status === "failed" && job.error_message !== null
}