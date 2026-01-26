import { Outlet } from "react-router-dom"

export function AdminLayout() {
    return (
        <div className="container mx-auto p-4 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <Outlet />
            </div>
        </div>
    )
}
