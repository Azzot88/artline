import { BrowserRouter } from "react-router-dom"
import { LanguageProvider } from "@/polymet/components/language-provider"
import { Account } from "@/polymet/pages/account"
import { AppLayout } from "@/polymet/layouts/app-layout"

export default function AccountRender() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AppLayout>
          <Account />
        </AppLayout>
      </LanguageProvider>
    </BrowserRouter>
  )
}