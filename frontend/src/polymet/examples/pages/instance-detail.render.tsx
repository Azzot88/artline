import { BrowserRouter } from "react-router-dom"
import { LanguageProvider } from "@/polymet/components/language-provider"
import { InstanceDetail } from "@/polymet/pages/instance-detail"
import { AppLayout } from "@/polymet/layouts/app-layout"

export default function InstanceDetailRender() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AppLayout>
          <InstanceDetail />
        </AppLayout>
      </LanguageProvider>
    </BrowserRouter>
  )
}