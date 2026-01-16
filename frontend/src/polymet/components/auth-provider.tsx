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

            // data matches UserContext: { user: UserRead|null, is_guest: bool, balance: int, guest_id: string|null }
            if (data.user && !data.is_guest) {
                // User is logged in
                setUser({
                    ...data.user,
                    is_admin: !!data.user.is_admin,
                    balance: data.balance // Ensure balance is sync
                } as User)
                setIsGuest(false)
            } else {
                // Guest mode
                setUser(null)
                setIsGuest(true)

                // If guest_id is missing/null but we expected guest, apiService.guestInit() might be needed?
                // Backend usually ensures guest_id is set if is_guest is true.
                if (!data.guest_id) {
                    await apiService.guestInit()
                }
            }
            setBalance(data.balance)
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
