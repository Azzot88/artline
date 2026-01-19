import { useState } from "react"
import { MenuIcon } from "lucide-react"
import { AppSidebar } from "@/polymet/components/app-sidebar"
import { RightSidebar } from "@/polymet/components/right-sidebar"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/polymet/components/language-provider"

interface AppLayoutProps {
  children: React.ReactNode
  showRightSidebar?: boolean
}

export function AppLayout({ children, showRightSidebar = true }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { t } = useLanguage()

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Left Sidebar */}
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto flex flex-col">
        {/* Mobile Header with Hamburger */}
        <div className="sticky top-0 z-30 flex items-center h-16 px-4 border-b border-border bg-background lg:hidden shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            className="mr-2"
          >
            <MenuIcon className="w-5 h-5" />
          </Button>
          <span className="font-bold text-lg">{t('common.brand')}</span>
        </div>

        <div className="px-4 py-6 md:py-8 flex-1">
          {children}
        </div>
      </main>

      {/* Right Sidebar - Removed */}
    </div>
  )
}