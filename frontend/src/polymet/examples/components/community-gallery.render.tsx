import { BrowserRouter } from "react-router-dom"
import { LanguageProvider } from "@/polymet/components/language-provider"
import { CommunityGallery } from "@/polymet/components/community-gallery"

export default function CommunityGalleryRender() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <div className="p-8 max-w-4xl">
          <CommunityGallery />
        </div>
      </LanguageProvider>
    </BrowserRouter>
  )
}