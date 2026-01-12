import { BrowserRouter } from "react-router-dom"
import { LanguageProvider } from "@/polymet/components/language-provider"
import { CreationTypeToggle, CreationType } from "@/polymet/components/creation-type-toggle"
import { useState } from "react"

export default function CreationTypeToggleRender() {
  const [type, setType] = useState<CreationType>("image")

  return (
    <BrowserRouter>
      <LanguageProvider>
        <div className="p-8 space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Default State</h3>
            <CreationTypeToggle value={type} onChange={setType} />
            <p className="text-sm text-muted-foreground mt-2">Selected: {type}</p>
          </div>
        </div>
      </LanguageProvider>
    </BrowserRouter>
  )
}