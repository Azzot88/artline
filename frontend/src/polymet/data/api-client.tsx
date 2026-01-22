/**
 * API Client for Backend Integration
 * 
 * Base URL: /api (proxied to backend in dev)
 * Authentication: HttpOnly cookies (automatic)
 * Content-Type: application/json
 */

// ============================================================================
// API Response Types (Backend Contract)
// ============================================================================

export interface ApiSuccessResponse<T> {
  data?: T
  ok?: boolean
  [key: string]: any
}

export interface ApiErrorResponse {
  detail:
  | string
  | {
    code: string
    message: string
    details?: Record<string, any>
  }
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse

// ============================================================================
// Error Codes (Backend Contract)
// ============================================================================

export const API_ERROR_CODES = {
  UNAUTHORIZED: "unauthorized",
  INSUFFICIENT_CREDITS: "insufficient_credits",
  NOT_FOUND: "not_found",
  VALIDATION_ERROR: "validation_error",
  PROVIDER_ERROR: "provider_error",
  INTERNAL_ERROR: "internal_error",
} as const

export type ApiErrorCode = typeof API_ERROR_CODES[keyof typeof API_ERROR_CODES]

// ============================================================================
// Custom Error Class
// ============================================================================

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: Record<string, any>,
    public status?: number
  ) {
    super(message)
    this.name = "ApiError"
  }
}

// ============================================================================
// API Client Configuration
// ============================================================================

const API_BASE_URL = "/api"

const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
}

// ============================================================================
// Core Fetch Wrapper
// ============================================================================

// ============================================================================
// Core Fetch Wrapper
// ============================================================================

async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`

  const isFormData = options.body instanceof FormData

  const headers: Record<string, string> = {
    ...DEFAULT_HEADERS,
    ...(options.headers as Record<string, string>),
  }

  if (isFormData) {
    delete headers["Content-Type"]
  }

  const config: RequestInit = {
    ...options,
    headers,
    credentials: "include", // CRITICAL: Send HttpOnly cookies
  }

  try {
    const response = await fetch(url, config)

    // Parse JSON response
    const data = await response.json()

    // Handle error responses
    if (!response.ok) {
      const errorData = data as ApiErrorResponse

      // Extract error details
      if (typeof errorData.detail === "string") {
        throw new ApiError(
          "unknown",
          errorData.detail,
          undefined,
          response.status
        )
      } else if (errorData.detail) {
        throw new ApiError(
          errorData.detail.code,
          errorData.detail.message,
          errorData.detail.details,
          response.status
        )
      }

      throw new ApiError(
        "unknown",
        "An unknown error occurred",
        undefined,
        response.status
      )
    }

    return data as T
  } catch (error) {
    // Re-throw ApiError as-is
    if (error instanceof ApiError) {
      throw error
    }

    // Network errors
    if (error instanceof TypeError) {
      throw new ApiError(
        "network_error",
        "Network error. Please check your connection.",
        { originalError: error.message }
      )
    }

    // Unknown errors
    throw new ApiError(
      "unknown",
      error instanceof Error ? error.message : "An unknown error occurred",
      { originalError: error }
    )
  }
}

// ============================================================================
// HTTP Method Helpers
// ============================================================================

export const api = {
  get<T>(endpoint: string, options?: RequestInit) {
    return apiFetch<T>(endpoint, { ...options, method: "GET" })
  },

  post<T>(endpoint: string, body?: any, options?: RequestInit) {
    const isFormData = body instanceof FormData
    return apiFetch<T>(endpoint, {
      ...options,
      method: "POST",
      body: isFormData ? body : (body ? JSON.stringify(body) : undefined),
    })
  },

  put<T>(endpoint: string, body?: any, options?: RequestInit) {
    const isFormData = body instanceof FormData
    return apiFetch<T>(endpoint, {
      ...options,
      method: "PUT",
      body: isFormData ? body : (body ? JSON.stringify(body) : undefined),
    })
  },

  patch<T>(endpoint: string, body?: any, options?: RequestInit) {
    const isFormData = body instanceof FormData
    return apiFetch<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: isFormData ? body : (body ? JSON.stringify(body) : undefined),
    })
  },

  delete<T>(endpoint: string, options?: RequestInit) {
    return apiFetch<T>(endpoint, { ...options, method: "DELETE" })
  },
}

// ============================================================================
// Error Handling Utilities
// ============================================================================

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    return error.message
  }
  if (error instanceof Error) {
    return error.message
  }
  return "An unknown error occurred"
}

export function getErrorCode(error: unknown): string | undefined {
  if (isApiError(error)) {
    return error.code
  }
  return undefined
}