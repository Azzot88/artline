import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { api } from "@/lib/api"

// Match Backend Schema from app/schemas.py > UserRead/UserContext
interface User {
    id: string
    email: string
    username?: string
    avatar_url?: string
    balance: number
    is_guest?: boolean // From context
}

interface UserContextType {
    user: User | null
    loading: boolean
    authenticated: boolean
    isGuest: boolean
    refreshUser: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [isGuest, setIsGuest] = useState(false)

    const fetchUser = async () => {
        try {
            // Expecting { user: UserRead, is_guest: bool, balance: int, ... }
            const data = await api.get<any>("/me")

            const userData = data.user || {}
            // Merge context fields into user object for convenience
            const fullUser = {
                ...userData,
                balance: data.balance,
                is_guest: data.is_guest
            }

            setUser(fullUser)
            setIsGuest(data.is_guest)
        } catch (err) {
            console.error("Failed to fetch user", err)
            // If 401, generic generic catch might leave user null
            setUser(null)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchUser()
    }, [])

    return (
        <UserContext.Provider value={{
            user,
            loading,
            authenticated: !!user,
            isGuest,
            refreshUser: fetchUser
        }}>
            {children}
        </UserContext.Provider>
    )
}

export function useUser() {
    const context = useContext(UserContext)
    if (context === undefined) {
        throw new Error("useUser must be used within a UserProvider")
    }
    return context
}
