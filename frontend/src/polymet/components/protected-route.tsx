import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "@/polymet/components/auth-provider"

export function ProtectedRoute() {
    const { user, isLoading, isGuest } = useAuth()

    if (isLoading) return <div>Loading...</div>

    // If strict auth is required (no guests), check !isGuest
    // For now, let's assume "/account" requires real user
    if (!user || isGuest) {
        return <Navigate to="/login" replace />
    }

    return <Outlet />
}
