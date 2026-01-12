import { BrowserRouter } from "react-router-dom"
import { LanguageProvider } from "@/polymet/components/language-provider"
import { GenerateButton } from "@/polymet/components/generate-button"
import { useState } from "react"

export default function GenerateButtonRender() {
  const [loading, setLoading] = useState(false)

  const handleGenerate = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 2000)
  }

  return (
    <BrowserRouter>
      <LanguageProvider>
        <div className="p-8 max-w-md space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-3">Default State</h3>
            <GenerateButton credits={5} onClick={handleGenerate} />
          </div>
          
          <div>
            <h3 className="text-sm font-medium mb-3">Loading State</h3>
            <GenerateButton credits={5} onClick={() => {}} loading={loading} />
          </div>
          
          <div>
            <h3 className="text-sm font-medium mb-3">Disabled State</h3>
            <GenerateButton credits={10} onClick={() => {}} disabled />
          </div>
          
          <div>
            <h3 className="text-sm font-medium mb-3">High Credit Cost</h3>
            <GenerateButton credits={25} onClick={() => {}} />
          </div>
        </div>
      </LanguageProvider>
    </BrowserRouter>
  )
}