import { Link, useLocation, useNavigate } from "react-router-dom"
import {
  SparklesIcon,
  ImageIcon,
  UserIcon,
  LayoutDashboardIcon,
  SlidersIcon,
  CoinsIcon,
  SettingsIcon,
  LogOutIcon,
  XIcon,
  TrendingUpIcon,
  CreditCardIcon,
  Brain,
  CheckCircle,
  Video,
  Video,
  Users,
  Database
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/polymet/components/language-provider"
import { LanguageSwitcher } from "@/polymet/components/language-switcher"
import { useAuth } from "@/polymet/components/auth-provider"
import { ModeToggle } from "@/components/mode-toggle"


interface NavItem {
  key: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  title?: string
}

interface AppSidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export function AppSidebar({ isOpen = true, onClose }: AppSidebarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { user, isLoading: loading, isGuest, logout } = useAuth()

  // Use real admin flag from user object
  const isAdmin = user?.is_admin || false

  const isActive = (href: string) => {
    // Special handling for Workbench tabs
    if (href === '/workbench?tab=image') {
      return location.pathname === '/workbench' && (!location.search || location.search.includes('tab=image'))
    }
    if (href === '/workbench?tab=video') {
      return location.pathname === '/workbench' && location.search.includes('tab=video')
    }

    return location.pathname === href || (href !== '/' && location.pathname.startsWith(href + "/"))
  }

  const mainNavItems: NavItem[] = [
    {
      key: "static",
      href: "/workbench?tab=image",
      icon: ImageIcon,
      title: "common.static"
    },
    {
      key: "dynamic",
      href: "/workbench?tab=video",
      icon: Video,
      title: "common.dynamic"
    },
    {
      key: "team",
      href: "/team",
      icon: Users,
      title: "common.team"
    },
    {
      key: "tariffs",
      href: "/landingpage#pricing",
      icon: CreditCardIcon,
      title: "common.tariffs"
    },
    {
      key: "library",
      href: "/library",
      icon: LayoutDashboardIcon, // Using Layout/Dashboard icon for library consistency if preferred, otherwise ImageIcon was reused before. Original was ImageIcon. But Static uses ImageIcon now. Let's use LayoutDashboard for Library or Folder. Original had ImageIcon for library?
      // Re-checking original: Library used ImageIcon. Static should use ImageIcon. Library should use something else? 
      // Original: Library used ImageIcon. 
      // User didn't ask to change Library icon but if duplicate it might be confusing.
      // Let's use Gallery/Images icon for library? Or maybe defaults.
      // I'll stick to original ImageIcon for library to minimize changes unless it conflicts visually.
      // Actually, having two ImageIcons is bad.
      // I'll swap Library to LayoutDashboardIcon (which was Start Using) or Folder.
      // Providing 'LayoutDashboardIcon' which is imported.
      // Wait, 'common.library' usually implies a gallery.
      // Let's use 'LayoutDashboardIcon' for Library for now to avoid duplicates.
      title: "common.library"
    }
  ]

  const adminNavItems: NavItem[] = [
    {
      key: "dashboard",
      href: "/dashboard",
      icon: LayoutDashboardIcon,
      title: "Dashboard"
    },
    {
      key: "modelConfig",
      href: "/model-config",
      icon: SlidersIcon,
      title: "Models"
    },
    {
      key: "review",
      href: "/admin/review",
      icon: CheckCircle, // Reusing icon, need to import if not present
      title: "Review"
    }
  ]

  // Handle Settings click based on role
  const handleSettingsClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (isAdmin) {
      navigate("/admin")
    } else if (isGuest) {
      navigate("/login")
    } else {
      navigate("/account")
    }
    if (onClose) onClose()
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && onClose && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "flex h-full w-64 flex-col border-r border-border bg-background transition-transform duration-300 ease-in-out",
        "fixed lg:relative z-50 lg:z-auto",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 border-b border-border px-6">
          <Link to="/" onClick={onClose} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Brain className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">{t('common.brand')}</span>
          </Link>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto lg:hidden"
              onClick={onClose}
            >
              <XIcon className="w-5 h-5" />
            </Button>
          )}
        </div>

        {/* Credits Display */}
        <div className="px-4 py-4">
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-center gap-2">
              <CoinsIcon className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-primary">
                {loading ? "..." : (user?.balance || 0)}
              </span>
            </div>
            {/* Future: Buy More button */}
          </div>
        </div>

        <Separator />

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
          {/* Main Navigation */}
          <div className="space-y-1">
            {mainNavItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              // Dynamically translate title if key exists, else use key or hardcoded defaults
              const label = t(item.title || "")

              return (
                <Link key={item.href} to={item.href} onClick={onClose}>
                  <div
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                      active
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                        : "text-muted-foreground hover:bg-primary/5 hover:text-primary"
                    )}
                  >
                    <Icon className={cn("w-4 h-4 transition-colors", active ? "text-primary-foreground" : "group-hover:text-primary")} />
                    <span>{label}</span>
                    {item.badge && (
                      <span className="ml-auto text-xs px-1.5 py-0.5 rounded bg-primary/20">
                        {item.badge}
                      </span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>

          <Separator className="my-4" />

          {/* Settings / Dispatcher Group */}
          <div className="space-y-1">
            {isAdmin ? (
              <div className="space-y-1">
                <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {t('admin.title')}
                </p>

                {/* Admin Sub-Items */}
                {[
                  { href: "/admin", label: t('admin.dashboard'), icon: LayoutDashboardIcon, exact: true },
                  { href: "/admin/users", label: t('admin.users'), icon: UserIcon },
                  { href: "/admin/gallery", label: "Gallery", icon: ImageIcon }, // Universal Gallery
                  { href: "/admin/models", label: t('admin.models'), icon: SparklesIcon }, // Box/Sparkles for Models
                  { href: "/admin/providers", label: t('admin.providers'), icon: SlidersIcon }, // Shield/Sliders for Providers
                  { href: "/admin/schema-visualizer", label: "Schema Viz", icon: Database },
                  { href: "/admin/reports", label: t('admin.reports'), icon: TrendingUpIcon },
                  { href: "/admin/system", label: t('admin.system'), icon: SettingsIcon },
                ].map((item) => (
                  <Link key={item.href} to={item.href} onClick={onClose}>
                    <div
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group",
                        isActive(item.href) && (item.exact ? location.pathname === item.href : true)
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                          : "text-muted-foreground hover:bg-primary/5 hover:text-primary"
                      )}
                    >
                      <item.icon className={cn("w-4 h-4 transition-colors", isActive(item.href) ? "text-primary-foreground" : "group-hover:text-primary")} />
                      <span>{item.label}</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <>
                <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {t('common.settings')}
                </p>

                {/* Standard Settings Button */}
                <div
                  onClick={handleSettingsClick}
                  className={cn(
                    "cursor-pointer flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group",
                    (isActive("/account") || isActive("/login"))
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                      : "text-muted-foreground hover:bg-primary/5 hover:text-primary"
                  )}
                >
                  <SettingsIcon className={cn("w-4 h-4 transition-colors", (isActive("/account") || isActive("/login")) ? "text-primary-foreground" : "group-hover:text-primary")} />
                  <span>{t('common.settings')}</span>
                </div>
              </>
            )}

            {/* Language Switcher Row */}
            <div className="flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-primary/5 group transition-all duration-200">
              <span className="text-sm font-medium text-muted-foreground group-hover:text-primary flex items-center gap-3 transition-colors">
                {t('common.language')}
              </span>
              <LanguageSwitcher variant="ghost" />
            </div>

            {/* Theme Toggle Row */}
            <div className="flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-primary/5 group transition-all duration-200">
              <span className="text-sm font-medium text-muted-foreground group-hover:text-primary flex items-center gap-3 transition-colors">
                {t('common.theme')}
              </span>
              <ModeToggle />
            </div>
          </div>

          <Separator className="my-4" />

          {/* User/Auth Actions */}
          <div className="mt-auto pt-4">
            {isGuest ? (
              <Link to="/login" onClick={onClose}>
                <Button variant="ghost" className="w-full justify-start text-primary hover:text-primary hover:bg-primary/10" size="sm">
                  <UserIcon className="w-4 h-4 mr-3" />
                  {t('common.login')}
                </Button>
              </Link>
            ) : (
              <Button
                variant="ghost"
                className="w-full justify-start text-destructive hover:text-white hover:bg-destructive shadow-sm transition-all"
                size="sm"
                onClick={logout}
              >
                <LogOutIcon className="w-4 h-4 mr-3" />
                {t('common.logout')}
              </Button>
            )}
          </div>
        </nav>

        {/* Quick Stats - Bottom */}
        <div className="border-t border-border p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <TrendingUpIcon className="w-3 h-3" />
            <span>Generations: {loading ? "..." : (user?.total_generations || 0)}</span>
          </div>
        </div>

      </div>
    </>
  )
}