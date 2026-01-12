import { BrowserRouter } from "react-router-dom"
import { LanguageProvider } from "@/polymet/components/language-provider"
import { Gallery } from "@/polymet/pages/gallery"
import { AppLayout } from "@/polymet/layouts/app-layout"

export default function GalleryRender() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AppLayout>
          <Gallery />
        </AppLayout>
      </LanguageProvider>
    </BrowserRouter>
  )
}