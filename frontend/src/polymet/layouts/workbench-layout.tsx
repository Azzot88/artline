import { SparklesIcon, CoinsIcon, UserIcon, HistoryIcon, SettingsIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import { useLanguage } from "@/polymet/components/language-provider"

interface WorkbenchLayoutProps {
  children: React.ReactNode
}

export function WorkbenchLayout({ children }: WorkbenchLayoutProps) {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <SparklesIcon className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg hidden sm:inline-block">{t('common.brand')}</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              to="/workbench"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              {t('navigation.workbench')}
            </Link>
            <Link
              to="/history"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              {t('navigation.history')}
            </Link>
            <Link
              to="/gallery"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              {t('navigation.gallery')}
            </Link>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Credits Display */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
              <CoinsIcon className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-primary">250</span>
            </div>

            {/* Mobile Menu */}
            <div className="flex md:hidden items-center gap-1">
              <Button variant="ghost" size="icon">
                <HistoryIcon className="w-5 h-5" />
              </Button>
            </div>

            {/* Settings */}
            <Button variant="ghost" size="icon" className="hidden md:flex">
              <SettingsIcon className="w-5 h-5" />
            </Button>

            {/* User Profile */}
            <Button variant="ghost" size="icon">
              <UserIcon className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-4 py-6 md:py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-auto">
        <div className="container px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © 2024 {t('common.brand')}. Работает на нескольких AI API.
            </p>
            <div className="flex items-center gap-4">
              <Link to="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Условия
              </Link>
              <Link to="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Конфиденциальность
              </Link>
              <Link to="/support" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Поддержка
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}