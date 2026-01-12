import { BrowserRouter } from "react-router-dom"
import { DurationSelector, DurationType } from "@/polymet/components/duration-selector"
import { useState } from "react"

export default function DurationSelectorRender() {
  const [duration, setDuration] = useState<DurationType>("5")

  return (
    <BrowserRouter>
      <div className="p-8 max-w-md space-y-4">
        <div>
          <h3 className="text-sm font-medium mb-3">Duration Selection</h3>
          <DurationSelector value={duration} onChange={setDuration} />
          <p className="text-sm text-muted-foreground mt-3">Selected: {duration} seconds</p>
        </div>
      </div>
    </BrowserRouter>
  )
}