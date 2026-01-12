import { BrowserRouter } from "react-router-dom"
import { LanguageProvider } from "@/polymet/components/language-provider"
import { WorkbenchLayout } from "@/polymet/layouts/workbench-layout"
import { Skeleton } from "@/components/ui/skeleton"

export default function WorkbenchLayoutRender() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <WorkbenchLayout>
          <div className="space-y-6">
            <Skeleton className="h-8 w-64 bg-muted" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Skeleton className="h-64 w-full bg-muted" />
              <Skeleton className="h-64 w-full bg-muted" />
            </div>
            <Skeleton className="h-48 w-full bg-muted" />
          </div>
        </WorkbenchLayout>
      </LanguageProvider>
    </BrowserRouter>
  )
}