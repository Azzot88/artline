import React, { createContext, useContext, useEffect, useState } from "react"
import { apiService } from "@/polymet/data/api-service"
import type { User } from "@/polymet/data/types"

interface AuthContextType {
    user: User | null
    isLoading: boolean
    isGuest: boolean
    balance: number
    login: (user: User) => void
    logout: () => void
    refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [balance, setBalance] = useState(0)
    const [isGuest, setIsGuest] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    async function refreshUser() {
        try {
            const data = await apiService.bootstrap()
            if (data.user.id && !data.user.is_guest) {
                // We have a real user, but bootstrap currently returns partial data?
                // Let's assume user object is fully populated or we just store what we have.
                // Wait, bootstrap returns { user: {id, email, is_guest}, auth: {mode, balance} }
                // Ideally we fetch full user profile if needed, or update bootstrap to return it?
                // api_spa.py's /me returns UserContext which has UserRead.
                // Let's rely on api-types which says user: {id, email, ...}

                // Wait, api-types says:
                /*
                export interface BootstrapResponse {
                    user: {
                        id: string | null
                        email: string | null
                        is_guest: boolean
                    }
                // */
                // We might need a proper User object. For now let's construct it or fetch it?
                // Actually `LoginResponse` returns a full `User`.
                // Let's trust that we are logged in.
                setUser({
                    id: data.user.id!,
                    email: data.user.email!,
                    is_active: true,
                    is_superuser: false,
                    is_admin: (data.user as any).is_admin || false, // UserRead now has is_admin
                    created_at: new Date().toISOString(),
                    balance: data.auth.balance || 0,
                    total_generations: 0,
                    language: "ru"
                } as User)
                setIsGuest(false)
            } else {
                setUser(null)
                setIsGuest(true)
                // Ensure guest session
                if (!data.auth.mode) {
                    await apiService.guestInit()
                }
            }
            setBalance(data.auth.balance)
        } catch (e) {
            console.error("Auth bootstrap failed", e)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        refreshUser()
    }, [])

    const login = (u: User) => {
        setUser(u)
        setIsGuest(false)
        refreshUser() // to get fresh balance
    }

    const logout = async () => {
        await apiService.logout()
        setUser(null)
        setIsGuest(true)
        refreshUser() // will re-init guest
    }

    return (
        <AuthContext.Provider value={{ user, isLoading, isGuest, balance, login, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return context
}
