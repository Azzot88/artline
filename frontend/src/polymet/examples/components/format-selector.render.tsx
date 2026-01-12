import { BrowserRouter } from "react-router-dom"
import { FormatSelector, FormatType } from "@/polymet/components/format-selector"
import { useState } from "react"

export default function FormatSelectorRender() {
  const [format, setFormat] = useState<FormatType>("square")

  return (
    <BrowserRouter>
      <div className="p-8 max-w-2xl space-y-4">
        <div>
          <h3 className="text-sm font-medium mb-3">Format Selection</h3>
          <FormatSelector value={format} onChange={setFormat} />
          <p className="text-sm text-muted-foreground mt-3">Selected: {format}</p>
        </div>
      </div>
    </BrowserRouter>
  )
}