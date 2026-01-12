import { BrowserRouter } from "react-router-dom"
import { LanguageProvider } from "@/polymet/components/language-provider"
import { InputTypeToggle, InputType } from "@/polymet/components/input-type-toggle"
import { useState } from "react"

export default function InputTypeToggleRender() {
  const [inputType, setInputType] = useState<InputType>("text")

  return (
    <BrowserRouter>
      <LanguageProvider>
        <div className="p-8 space-y-6">
          <div>
            <h3 className="text-sm font-medium mb-2">For Image Creation</h3>
            <InputTypeToggle value={inputType} onChange={setInputType} creationType="image" />
          </div>
          <div>
            <h3 className="text-sm font-medium mb-2">For Video Creation</h3>
            <InputTypeToggle value={inputType} onChange={setInputType} creationType="video" />
          </div>
        </div>
      </LanguageProvider>
    </BrowserRouter>
  )
}