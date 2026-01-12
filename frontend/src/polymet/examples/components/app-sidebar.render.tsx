import { BrowserRouter } from "react-router-dom"
import { LanguageProvider } from "@/polymet/components/language-provider"
import { AppSidebar } from "@/polymet/components/app-sidebar"

export default function AppSidebarRender() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <div className="h-screen">
          <AppSidebar />
        </div>
      </LanguageProvider>
    </BrowserRouter>
  )
}