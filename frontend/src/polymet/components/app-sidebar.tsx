import { Link, useLocation } from "react-router-dom"
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
  ClockIcon
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { generations } from "@/polymet/data/generations-data"
import { useTranslations } from "@/polymet/components/language-provider"

interface NavItem {
  key: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
}

interface AppSidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export function AppSidebar({ isOpen = true, onClose }: AppSidebarProps) {
  const location = useLocation()
  const t = useTranslations()
  // Mock user role - in real app, get from auth context
  const isAdmin = true

  const isActive = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + "/")
  }

  const mainNavItems: NavItem[] = [
    {
      key: "workbench",
      href: "/workbench",
      icon: SparklesIcon
    },
    {
      key: "gallery",
      href: "/gallery",
      icon: ImageIcon
    }
  ]

  const userNavItems: NavItem[] = [
    {
      key: "account",
      href: "/account",
      icon: UserIcon
    }
  ]

  const adminNavItems: NavItem[] = [
    {
      key: "dashboard",
      href: "/dashboard",
      icon: LayoutDashboardIcon
    },
    {
      key: "modelConfig",
      href: "/model-config",
      icon: SlidersIcon
    }
  ]

  // Calculate stats
  const totalGenerations = generations.length
  const totalCreditsUsed = generations.reduce((sum, gen) => sum + gen.credits, 0)
  const avgCreditsPerGen = Math.round(totalCreditsUsed / totalGenerations)



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
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <SparklesIcon className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg">{t.appTitle}</span>
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
            <span className="text-sm font-semibold text-primary">250</span>
          </div>
          <Button variant="ghost" size="sm" className="h-7 text-xs">
            {t.buyMore}
          </Button>
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
              const title = t[item.key as keyof typeof t] as string
              
              return (
                <Link key={item.href} to={item.href} onClick={onClose}>
                  <div
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{title}</span>
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

          {/* User Navigation */}
          <div className="space-y-1">
            <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              {t.account.toUpperCase()}
            </p>
            {userNavItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              const title = t[item.key as keyof typeof t] as string
              
              return (
                <Link key={item.href} to={item.href} onClick={onClose}>
                  <div
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{title}</span>
                  </div>
                </Link>
              )
            })}
          </div>

          <Separator className="my-4" />

          {/* Admin Navigation */}
          <div className="space-y-1">
            <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              АДМИНИСТРИРОВАНИЕ
            </p>
            {adminNavItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              const title = t[item.key as keyof typeof t] as string
              
              return (
                <Link key={item.href} to={item.href} onClick={onClose}>
                  <div
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{title}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Bottom Actions */}
        <div className="border-t border-border p-4 space-y-4">
          {/* Quick Stats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUpIcon className="w-4 h-4 text-primary" />
                {t.quickStats}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t.totalGenerations}</span>
                <span className="text-sm font-semibold">{totalGenerations}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t.creditsUsed}</span>
                <span className="text-sm font-semibold">{totalCreditsUsed}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t.avgCreditsPerGen}</span>
                <span className="text-sm font-semibold">{avgCreditsPerGen}</span>
              </div>
            </CardContent>
          </Card>


          {/* Settings & Logout */}
          <div className="space-y-1">
            <Button variant="ghost" className="w-full justify-start" size="sm">
              <SettingsIcon className="w-4 h-4 mr-3" />
              {t.settings}
            </Button>
            <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10" size="sm">
              <LogOutIcon className="w-4 h-4 mr-3" />
              {t.logout}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}