// Backend-aligned User types
export type LanguageCode = "ru" | "kk" | "ky" | "en"

export interface User {
  // Core fields from backend
  id: string                             // UUID
  email: string                          // Unique email
  username?: string                      // Display username (unique, nullable)
  avatar_url?: string                    // Avatar image URL
  is_admin?: boolean                     // Admin flag

  // Balance and statistics
  balance: number                        // Current credits balance
  total_generations: number              // Total generations count (cached)

  // Settings
  language: LanguageCode                 // Interface language

  // Timestamps
  created_at: string                     // ISO 8601 timestamp
  updated_at?: string                    // ISO 8601 timestamp

  // Computed fields (not in backend)
  total_credits_spent?: number           // Total credits spent (computed from ledger)
}

// Ledger entry for billing
export interface LedgerEntry {
  id: string                             // UUID
  user_id: string                        // FK to users.id
  amount: number                         // Positive = credit, Negative = debit
  reason: string                         // "generation", "purchase", "refund", etc.
  related_job_id?: string                // FK to jobs.id (if related to generation)

  // Payment info (for purchases)
  payment_amount?: number                // Payment amount in real currency
  payment_currency?: string              // "USD", "EUR", "KZT", etc.

  // Balance tracking
  balance_before: number                 // Balance before transaction
  balance_after: number                  // Balance after transaction

  // Timestamp
  created_at: string                     // ISO 8601 timestamp
}

// Like relationship
export interface Like {
  id: string                             // UUID
  user_id: string                        // FK to users.id
  job_id: string                         // FK to jobs.id
  created_at: string                     // ISO 8601 timestamp
}

// Guest profile for non-registered users
export interface GuestProfile {
  id: string                             // UUID
  balance: number                        // Credits balance
  created_at?: string                    // ISO 8601 timestamp
}

// Mock data
export const currentUser: User = {
  id: "user-1",
  email: "yusuf@example.com",
  username: "yusufhilmi",
  avatar_url: "https://github.com/yusufhilmi.png",
  is_admin: false,
  balance: 250,
  total_generations: 15,
  language: "ru",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-15T14:30:00Z",
  total_credits_spent: 85
}

export const mockUsers: User[] = [
  currentUser,
  {
    id: "user-2",
    email: "kadir@example.com",
    username: "kadir",
    avatar_url: "https://github.com/kdrnp.png",
    is_admin: false,
    balance: 180,
    total_generations: 12,
    language: "kk",
    created_at: "2024-01-02T00:00:00Z",
    updated_at: "2024-01-15T13:15:00Z",
    total_credits_spent: 64
  },
  {
    id: "user-3",
    email: "yahya@example.com",
    username: "yahyabedirhan",
    avatar_url: "https://github.com/yahyabedirhan.png",
    is_admin: true,
    balance: 500,
    total_generations: 23,
    language: "en",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-15T12:45:00Z",
    total_credits_spent: 142
  },
  {
    id: "user-4",
    email: "deniz@example.com",
    username: "denizbuyuktas",
    avatar_url: "https://github.com/denizbuyuktas.png",
    is_admin: false,
    balance: 320,
    total_generations: 18,
    language: "ru",
    created_at: "2024-01-03T00:00:00Z",
    updated_at: "2024-01-15T11:20:00Z",
    total_credits_spent: 98
  },
  {
    id: "user-5",
    email: "shoaib@example.com",
    username: "shoaib",
    avatar_url: "https://github.com/shoaibux1.png",
    is_admin: false,
    balance: 420,
    total_generations: 21,
    language: "ky",
    created_at: "2024-01-02T00:00:00Z",
    updated_at: "2024-01-15T10:00:00Z",
    total_credits_spent: 115
  }
]

export const mockLedgerEntries: LedgerEntry[] = [
  {
    id: "ledger-001",
    user_id: "user-1",
    amount: 100,
    reason: "purchase",
    payment_amount: 10.00,
    payment_currency: "USD",
    balance_before: 150,
    balance_after: 250,
    created_at: "2024-01-15T14:00:00Z"
  },
  {
    id: "ledger-002",
    user_id: "user-1",
    amount: -5,
    reason: "generation",
    related_job_id: "gen-001",
    balance_before: 255,
    balance_after: 250,
    created_at: "2024-01-15T14:30:00Z"
  },
  {
    id: "ledger-003",
    user_id: "user-1",
    amount: -4,
    reason: "generation",
    related_job_id: "gen-006",
    balance_before: 250,
    balance_after: 246,
    created_at: "2024-01-14T18:30:00Z"
  }
]

export const mockLikes: Like[] = [
  {
    id: "like-001",
    user_id: "user-1",
    job_id: "gen-003",
    created_at: "2024-01-15T12:50:00Z"
  },
  {
    id: "like-002",
    user_id: "user-1",
    job_id: "gen-005",
    created_at: "2024-01-15T10:15:00Z"
  },
  {
    id: "like-003",
    user_id: "user-2",
    job_id: "gen-001",
    created_at: "2024-01-15T14:35:00Z"
  }
]

// Helper functions
export function getUserById(userId: string): User | undefined {
  return mockUsers.find(user => user.id === userId)
}

export function getUserLedger(userId: string): LedgerEntry[] {
  return mockLedgerEntries.filter(entry => entry.user_id === userId)
}

export function getUserLikes(userId: string): Like[] {
  return mockLikes.filter(like => like.user_id === userId)
}

export function hasUserLiked(userId: string, jobId: string): boolean {
  return mockLikes.some(like => like.user_id === userId && like.job_id === jobId)
}

export function calculateUserBalance(userId: string): number {
  const ledger = getUserLedger(userId)
  return ledger.reduce((sum, entry) => sum + entry.amount, 0)
}

export function getUserTotalSpent(userId: string): number {
  const ledger = getUserLedger(userId)
  return Math.abs(ledger.filter(entry => entry.amount < 0).reduce((sum, entry) => sum + entry.amount, 0))
}
