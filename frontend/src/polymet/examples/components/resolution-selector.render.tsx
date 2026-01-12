import { BrowserRouter } from "react-router-dom"
import { ResolutionSelector, ResolutionType } from "@/polymet/components/resolution-selector"
import { useState } from "react"

export default function ResolutionSelectorRender() {
  const [resolution, setResolution] = useState<ResolutionType>("1080")

  return (
    <BrowserRouter>
      <div className="p-8 max-w-md space-y-4">
        <div>
          <h3 className="text-sm font-medium mb-3">Resolution Selection</h3>
          <ResolutionSelector value={resolution} onChange={setResolution} />
          <p className="text-sm text-muted-foreground mt-3">Selected: {resolution}</p>
        </div>
      </div>
    </BrowserRouter>
  )
}