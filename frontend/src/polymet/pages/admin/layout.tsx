
import { Outlet, Link, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Box, Database, Key, LayoutTemplate, Activity, FileText, Users } from "lucide-react"

export function AdminLayout() {
    const location = useLocation()
    const isVisualizer = location.pathname.includes("schema-visualizer")

    return (
        <div className={cn("container mx-auto p-4 lg:p-8", isVisualizer ? "max-w-full px-4" : "")}>
            <div className={cn("mx-auto space-y-8", isVisualizer ? "max-w-full" : "max-w-7xl")}>
                {!isVisualizer && (
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Admin Console</h2>
                        <p className="text-muted-foreground">Manage system resources and configurations</p>
                    </div>
                )}

                <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
                    <div className="flex-1">
                        <Outlet />
                    </div>
                </div>
            </div>
        </div>
    )
}

function NavLink({ to, icon: Icon, label, end }: any) {
    const location = useLocation()
    const isActive = end
        ? location.pathname === to
        : location.pathname.startsWith(to)

    return (
        <Link
            to={to}
            className={cn(
                "group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
            )}
        >
            <Icon className="mr-2 h-4 w-4" />
            <span>{label}</span>
        </Link>
    )
}
