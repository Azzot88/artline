import { BrowserRouter } from "react-router-dom"
import { LanguageProvider } from "@/polymet/components/language-provider"
import { AppLayout } from "@/polymet/layouts/app-layout"
import { Skeleton } from "@/components/ui/skeleton"

export default function AppLayoutRender() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AppLayout>
          <div className="space-y-6">
            <div>
              <Skeleton className="h-10 w-64 bg-muted mb-2" />
              <Skeleton className="h-5 w-96 bg-muted" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Skeleton className="h-64 w-full bg-muted" />
              <Skeleton className="h-64 w-full bg-muted" />
            </div>
            <Skeleton className="h-48 w-full bg-muted" />
          </div>
        </AppLayout>
      </LanguageProvider>
    </BrowserRouter>
  )
}