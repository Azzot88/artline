import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "@/polymet/components/auth-provider"

export function AdminRoute() {
    const { user, isLoading } = useAuth()

    if (isLoading) return <div>Loading...</div>

    if (!user || !user.is_admin) {
        return <Navigate to="/" replace />
    }

    return <Outlet />
}
