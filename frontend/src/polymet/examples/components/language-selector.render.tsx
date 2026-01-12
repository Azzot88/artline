import { BrowserRouter } from "react-router-dom"
import { LanguageProvider } from "@/polymet/components/language-provider"
import { LanguageSelector } from "@/polymet/components/language-selector"

export default function LanguageSelectorRender() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <div className="p-8 max-w-4xl space-y-8">
          <div>
            <h2 className="text-2xl font-bold mb-4">Language Selector</h2>
            
            <div className="space-y-6">
              <div className="p-6 border border-border rounded-lg">
                <h3 className="font-semibold mb-3">For Regular Users</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Can select: Russian, Kazakh, Kyrgyz
                </p>
                <LanguageSelector isAdmin={false} />
              </div>

              <div className="p-6 border border-border rounded-lg">
                <h3 className="font-semibold mb-3">For Admins</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Can select: Russian, Kazakh, Kyrgyz, English
                </p>
                <LanguageSelector isAdmin={true} />
              </div>
            </div>
          </div>

          <div className="p-6 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">Usage Example</h3>
            <p className="text-sm text-muted-foreground">
              This component will be added to the sidebar Settings section. 
              It shows available languages based on user role and allows switching between them.
            </p>
          </div>
        </div>
      </LanguageProvider>
    </BrowserRouter>
  )
}