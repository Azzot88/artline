import { BrowserRouter } from "react-router-dom"
import { ModelSelector } from "@/polymet/components/model-selector"
import { useState } from "react"

export default function ModelSelectorRender() {
  const [imageModel, setImageModel] = useState("dalle-3")
  const [videoModel, setVideoModel] = useState("runway-gen2")

  return (
    <BrowserRouter>
      <div className="p-8 max-w-md space-y-6">
        <div>
          <h3 className="text-sm font-medium mb-3">Image Models</h3>
          <ModelSelector 
            value={imageModel} 
            onChange={setImageModel} 
            creationType="image" 
          />
          <p className="text-xs text-muted-foreground mt-2">Selected: {imageModel}</p>
        </div>
        
        <div>
          <h3 className="text-sm font-medium mb-3">Video Models</h3>
          <ModelSelector 
            value={videoModel} 
            onChange={setVideoModel} 
            creationType="video" 
          />
          <p className="text-xs text-muted-foreground mt-2">Selected: {videoModel}</p>
        </div>
      </div>
    </BrowserRouter>
  )
}