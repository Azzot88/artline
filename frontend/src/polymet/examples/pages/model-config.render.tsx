import { BrowserRouter } from "react-router-dom"
import { LanguageProvider } from "@/polymet/components/language-provider"
import { ModelConfig } from "@/polymet/pages/model-config"
import { AppLayout } from "@/polymet/layouts/app-layout"

export default function ModelConfigRender() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AppLayout showRightSidebar={false}>
          <ModelConfig />
        </AppLayout>
      </LanguageProvider>
    </BrowserRouter>
  )
}