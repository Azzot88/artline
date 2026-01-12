import { BrowserRouter } from "react-router-dom"
import { LanguageProvider } from "@/polymet/components/language-provider"
import { Dashboard } from "@/polymet/pages/dashboard"
import { AppLayout } from "@/polymet/layouts/app-layout"

export default function DashboardRender() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AppLayout showRightSidebar={false}>
          <Dashboard />
        </AppLayout>
      </LanguageProvider>
    </BrowserRouter>
  )
}