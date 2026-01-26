import { Outlet, NavLink } from "react-router-dom"
import {
    LayoutDashboard,
    Users,
    Box,
    FileBarChart,
    Settings,
    ShieldAlert
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/models", label: "Models", icon: Box },
    { href: "/admin/providers", label: "Providers", icon: ShieldAlert },
    { href: "/admin/reports", label: "Reports", icon: FileBarChart },
    { href: "/admin/system", label: "System", icon: Settings },
]

export function AdminLayout() {
    return (
        <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0 container mx-auto p-8">
            <aside className="-mx-4 lg:w-1/5">
                <nav className="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.href}
                            to={item.href}
                            end={item.exact}
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted transition-colors",
                                    isActive ? "bg-muted text-primary" : "text-muted-foreground"
                                )
                            }
                        >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                        </NavLink>
                    ))}
                </nav>
            </aside>
            <div className="flex-1 lg:max-w-4xl">
                <Outlet />
            </div>
        </div>
    )
}
